# ADR 002: Lua Scripts for Atomic Rate Limiting Operations

**Status:** Accepted
**Date:** 2026-01-18
**Author:** Agnij Dutta

## Context

Rate limiting requires a check-and-increment operation: read the current count, decide if the request is allowed, and if so, increment the counter. This must be atomic — if two requests arrive at the same time, they must not both read count=99, both decide "allowed", and both increment to 100 (giving us 101, which exceeds the limit).

Options for achieving atomicity in Redis:

1. **MULTI/EXEC transactions** — Redis transactions with optimistic locking (WATCH)
2. **Lua scripts** — server-side scripts that run atomically
3. **RedLock** — distributed lock algorithm
4. **Client-side locking** — application-level mutex

## Decision

We use **Lua scripts** executed via `EVALSHA` for all rate limiting operations.

Each algorithm (sliding window, fixed window, token bucket) has its own Lua script that performs the complete check-and-increment as a single atomic operation.

## Rationale

### Why Lua Scripts?

**Single round trip.** The entire operation — read count, decide, increment, set expiry — happens in one network call. With MULTI/EXEC, you need at least 3-4 round trips (WATCH, read, MULTI, EXEC). At our target latency (<1ms), every round trip matters.

**True atomicity.** Redis executes Lua scripts without interruption. No other command can run between our read and write. MULTI/EXEC with WATCH can fail and retry if another client modifies the key, adding unpredictable latency.

**No coordination needed.** Unlike RedLock, there's no distributed lock acquisition. The atomicity comes from Redis's single-threaded execution model. This is simpler and faster.

**Script caching.** Redis caches compiled Lua scripts via `SCRIPT LOAD` / `EVALSHA`. After the first call, subsequent calls only send the SHA hash, not the full script. Minimal overhead.

### Example: Sliding Window Lua Script

```lua
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window_us = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
local ttl_ms = tonumber(ARGV[5])

local window_start = now - window_us

-- Prune expired entries
redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

-- Count
local count = redis.call('ZCARD', key)

if count < limit then
    redis.call('ZADD', key, now, member)
    redis.call('PEXPIRE', key, ttl_ms)
    return {1, limit - count - 1, 0}  -- allowed, remaining, retry_after
else
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local retry_after = 0
    if #oldest > 0 then
        retry_after = tonumber(oldest[2]) + window_us - now
    end
    return {0, 0, retry_after}  -- blocked, remaining, retry_after
end
```

This entire operation is atomic. Two concurrent requests to the same key will be serialized by Redis and produce correct counts.

## Consequences

### Good

- Sub-millisecond check latency (single round trip)
- Guaranteed correctness under concurrent load
- No distributed locks or coordination
- Scripts are cached and reused across connections
- Works identically whether you have 1 or 100 backend instances

### Bad

- **Lua script complexity.** Lua is not the most ergonomic language. Debugging scripts requires `redis.log()` calls. We mitigate this by keeping scripts focused and well-tested.
- **Blocking.** Long-running Lua scripts block all Redis operations. Our scripts do O(log N) work with small N (bounded by rate limit), so this isn't a practical concern. We also set `lua-time-limit` as a safety net.
- **Redis Cluster limitations.** Lua scripts in Redis Cluster can only access keys on the same shard. Since all keys for a given rate limit counter share a prefix, they hash to the same slot. This works by design.

### Why not the alternatives?

- **MULTI/EXEC + WATCH:** 3-4 round trips minimum. WATCH-based optimistic locking retries under contention, adding tail latency. Unacceptable for our hot path.
- **RedLock:** Designed for distributed mutual exclusion across multiple Redis instances. Massive overkill for our use case. Also adds 5+ round trips for lock acquisition.
- **Client-side locking:** Only works within a single process. Useless with multiple backend instances.

## References

- [Redis Lua scripting documentation](https://redis.io/docs/interact/programmability/eval-intro/)
- [EVALSHA command](https://redis.io/commands/evalsha/)
- Antirez's post on Redis transactions vs Lua scripts
