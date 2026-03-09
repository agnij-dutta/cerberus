# ADR 001: Redis Sorted Sets for Sliding Window Rate Limiting

**Status:** Accepted
**Date:** 2026-01-15
**Author:** Agnij Dutta

## Context

We need a data structure for implementing sliding window rate limiting in Redis. The sliding window algorithm needs to:

1. Count the number of requests in a rolling time window (e.g., "last 60 seconds")
2. Add new requests atomically
3. Remove expired entries efficiently
4. Support high throughput (100k+ operations/sec)

The main candidates were:

- **Sorted Sets (ZSET)** — store each request with its timestamp as the score
- **HyperLogLog** — approximate counting (probabilistic)
- **Strings with bucketing** — divide the window into sub-buckets, use INCR on each
- **Streams** — append-only log with timestamp-based trimming

## Decision

We chose **Redis Sorted Sets** (ZSET) for the sliding window implementation.

Each rate limit counter is a sorted set where:
- **Key:** `rl:{tenant_id}:{policy_name}:{identifier}`
- **Score:** Unix timestamp in microseconds
- **Member:** Unique request ID (timestamp + random suffix to avoid collisions)

The check-and-increment operation is a single Lua script:

```lua
-- Simplified version of our Lua script
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

local window_start = now - window

-- Remove expired entries
redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

-- Count current entries
local count = redis.call('ZCARD', key)

if count < limit then
    -- Under limit: add the request
    redis.call('ZADD', key, now, member)
    redis.call('PEXPIRE', key, window + 1000)
    return {1, limit - count - 1}  -- allowed, remaining
else
    return {0, 0}  -- blocked, 0 remaining
end
```

## Consequences

### Good

- **Exact counting.** No approximation, no bucket boundary artifacts. When you set a limit of 100 per minute, it means exactly 100 per minute at any point in time.
- **Atomic.** The Lua script runs as a single Redis operation. No race conditions between read and write.
- **Simple mental model.** Each member is a request, each score is a timestamp. Easy to reason about and debug.
- **Built-in expiry.** `ZREMRANGEBYSCORE` efficiently prunes old entries. Combined with key TTL, we never leak memory.

### Bad

- **Memory usage.** Each request stores a member in the set. For high-volume keys (10k requests/min), this means 10k members per key. At ~50 bytes per member, that's ~500KB per key. For most use cases this is fine, but it's something to watch.
- **O(log N) per operation.** `ZADD` and `ZREMRANGEBYSCORE` are O(log N) where N is the set size. In practice, N is bounded by the rate limit, so this is effectively O(log limit). For a 10,000 req/min limit, that's ~13 operations — negligible.

### Why not the alternatives?

- **HyperLogLog:** ~0.81% error rate. For rate limiting, approximate counting means some users get 101 requests and some get 99. Unacceptable when accuracy matters (billing, auth throttling).
- **String bucketing:** Divides the window into sub-buckets (e.g., 60 one-second buckets for a minute window). Cheaper on memory but introduces boundary effects — requests at the edge of a bucket might be miscounted. Also more complex to implement correctly.
- **Streams:** Could work, but `XLEN` after `XTRIM` is less efficient than `ZCARD` after `ZREMRANGEBYSCORE`. Streams are designed for message passing, not counting.

## References

- [Redis documentation on Sorted Sets](https://redis.io/docs/data-types/sorted-sets/)
- Stripe's rate limiter blog post (uses a similar approach)
- Cloudflare's sliding window implementation (hybrid approach with counters)
