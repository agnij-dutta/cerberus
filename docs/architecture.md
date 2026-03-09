# Cerberus Architecture

> How we built a rate limiter that doesn't fall over at 100k req/s.

## High-Level Overview

```
                         ┌─────────────┐
                         │   Clients   │
                         └──────┬──────┘
                                │
                         ┌──────▼──────┐
                         │    Nginx    │
                         │  (L7 proxy) │
                         └──────┬──────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                  │
       ┌──────▼──────┐  ┌──────▼──────┐  ┌───────▼───────┐
       │  Backend 1  │  │  Backend 2  │  │  Backend N    │
       │  (FastAPI)  │  │  (FastAPI)  │  │  (FastAPI)    │
       └──────┬──────┘  └──────┬──────┘  └───────┬───────┘
              │                │                  │
              └────────────────┼──────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
             ┌──────▼──────┐     ┌───────▼───────┐
             │    Redis    │     │   PostgreSQL  │
             │  (hot path) │     │  (cold store) │
             └─────────────┘     └───────────────┘
```

## The Hot Path

This is the most critical piece of the whole system. When a client calls `/api/v1/check`, here's exactly what happens:

```
Client POST /api/v1/check
  │
  ├─ 1. Parse request, validate JSON             ~0.1ms
  │
  ├─ 2. Look up policy in LRU cache              ~0.01ms (hit)
  │     └─ Cache miss? Check Redis hash           ~0.3ms
  │           └─ Redis miss? Query Postgres        ~2ms
  │                 └─ Populate both caches
  │
  ├─ 3. Execute rate limit check via Lua script   ~0.2ms
  │     └─ Atomic MULTI: read count, increment,
  │        set expiry — all in one round trip
  │
  ├─ 4. Build response with rate limit headers    ~0.05ms
  │
  └─ Return 200 (allowed) or 429 (blocked)
```

**Target latency:** < 1ms at p99 for cache-hot requests.

The entire check is a single Redis round trip when the policy is cached. That's the whole trick. No back-and-forth, no distributed locks, no coordination between backends. Redis does the counting, Lua scripts make it atomic.

## Redis Data Model

### Rate Limit Counters

**Sliding Window (sorted sets):**
```
Key:    rl:{tenant_id}:{policy_name}:{identifier}
Type:   Sorted Set
Score:  Unix timestamp (microseconds)
Member: Unique request ID (timestamp + random suffix)
TTL:    window_seconds + 1 (auto-cleanup)
```

Why sorted sets? Because `ZRANGEBYSCORE` lets us count hits in an arbitrary time window without bucketing artifacts. We add the current request, remove expired entries, and count — all in one Lua script.

**Fixed Window (strings):**
```
Key:    rl:{tenant_id}:{policy_name}:{identifier}:{window_id}
Type:   String (counter)
TTL:    window_seconds
```

Simple `INCR` with `EXPIRE`. Window ID is `floor(now / window_seconds)`.

**Token Bucket (hashes):**
```
Key:    rl:{tenant_id}:{policy_name}:{identifier}
Type:   Hash { tokens: float, last_refill: timestamp }
TTL:    window_seconds * 2
```

### Policy Cache

```
Key:    policy:{tenant_id}:{policy_name}
Type:   Hash { algorithm, limit, window_seconds, burst_limit }
TTL:    300s (5 minutes)
```

Policies don't change often. We cache them aggressively in Redis and even more aggressively in-process.

## Three-Tier Caching Strategy

```
┌──────────────────────────────────────────────┐
│  Tier 1: In-Process LRU Cache               │
│  ─────────────────────────────               │
│  TTL: 60s    Size: 10,000 entries            │
│  Latency: ~10μs                              │
│  Stores: Policy configs, tenant metadata     │
│  Library: cachetools (Python)                │
├──────────────────────────────────────────────┤
│  Tier 2: Redis                               │
│  ──────────                                  │
│  TTL: 300s                                   │
│  Latency: ~200μs                             │
│  Stores: Policy hashes, tenant lookups       │
│  Bonus: Shared across all backend instances  │
├──────────────────────────────────────────────┤
│  Tier 3: PostgreSQL                          │
│  ────────────────                            │
│  TTL: ∞ (source of truth)                    │
│  Latency: ~2ms                               │
│  Stores: Everything                          │
└──────────────────────────────────────────────┘
```

**Cache invalidation:** When a policy is updated via the admin API, we:
1. Update Postgres (source of truth)
2. Delete the Redis hash key
3. The in-process LRU expires naturally (60s max staleness)

This means policy updates take up to 60 seconds to propagate to all instances. That's an acceptable tradeoff — rate limit policies aren't updated in the middle of a traffic spike.

## Scaling Considerations

### Horizontal Scaling

Backend instances are stateless. Spin up as many as you want behind the load balancer. They all talk to the same Redis and Postgres.

**Bottleneck:** Redis is the single point of coordination. For most workloads, a single Redis instance handles 100k+ operations/sec easily. If you need more:

- **Redis Cluster:** Shard by tenant ID. Each tenant's counters live on one shard. No cross-shard operations needed.
- **Read replicas:** Not useful here — rate limiting is write-heavy by nature.

### Vertical Scaling

Before you go horizontal, try:
- Bump Redis `maxmemory` (we use `allkeys-lru`, so it handles pressure gracefully)
- Increase `uvicorn` workers (one per CPU core)
- Use connection pooling for Postgres (`asyncpg` pool)

### Multi-Region

This is where it gets interesting. Rate limiting across regions requires either:
1. **Region-local limits** — each region has its own Redis, limits are per-region. Simple, but a user can get 2x the limit by hitting both regions.
2. **Centralized Redis** — one Redis cluster, all regions talk to it. Adds latency (cross-region RTT).
3. **CRDTs** — eventually consistent counters. Complex, but the "right" answer for global limits.

We currently support option 1. Options 2 and 3 are on the roadmap.

## Failure Modes

### Redis Goes Down

**Behavior:** Fail open. If we can't reach Redis, we allow the request and log a warning.

**Why:** A rate limiter that blocks all traffic when Redis is unavailable is worse than no rate limiter at all. Your users' experience matters more than perfect rate limiting during an outage.

**Recovery:** When Redis comes back, counters reset. Brief spike of un-rate-limited traffic, then back to normal.

### Postgres Goes Down

**Behavior:** Serve from cache. Existing policies in the LRU and Redis caches continue to work. New policy creation/updates fail with 503.

**Impact:** Low for the hot path. Policy lookups are cached. Only admin operations are affected.

### Backend Instance Crashes

**Behavior:** Load balancer routes to healthy instances. No state is lost because all state lives in Redis/Postgres.

**Recovery:** Automatic. Spin up a replacement, it starts serving immediately.

### Clock Skew Between Instances

**Behavior:** Minimal impact. We use Redis `TIME` command for rate limit timestamps, not the backend's local clock. All instances agree on what time it is because they're all asking Redis.

## Why Not [Other Thing]?

**Why not in-memory rate limiting (no Redis)?**
Doesn't work with multiple backend instances. Each instance would track its own counts, so a 100 req/min limit becomes 100 * N req/min.

**Why not a distributed counter (Raft, Paxos)?**
Massive overkill. Redis gives us the coordination we need with sub-millisecond latency. Consensus protocols add latency and complexity for no benefit here.

**Why not a token bucket everywhere?**
Different algorithms suit different use cases. Token buckets are great for smoothing traffic, but sliding windows give more intuitive behavior for API rate limits ("100 requests per minute" means exactly that, no matter when you start counting).
