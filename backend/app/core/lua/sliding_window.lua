-- ---------------------------------------------------------------------------
-- Sliding-window rate limiter (sorted-set based).
--
-- Uses a sorted set where each member is a unique request ID scored by
-- its timestamp in microseconds.  On every call we:
--   1. Trim entries older than the window.
--   2. Count how many entries remain.
--   3. If under the limit, add the new entry; otherwise reject.
--
-- KEYS[1] — the rate-limit key
-- ARGV[1] — current timestamp (microseconds)
-- ARGV[2] — window size (microseconds)
-- ARGV[3] — max requests allowed in the window
-- ARGV[4] — unique member id for this request
--
-- Returns: {allowed (0|1), remaining, retry_after_us}
-- ---------------------------------------------------------------------------

local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

local window_start = now - window

-- Evict everything outside the current window
redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

local count = redis.call('ZCARD', key)

if count < limit then
    redis.call('ZADD', key, now, member)
    -- Expire the whole key slightly after the window closes so we don't leak memory
    redis.call('PEXPIRE', key, math.ceil(window / 1000))
    return {1, limit - count - 1, 0}
else
    -- Figure out when the oldest entry will fall out of the window
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local retry_after = 0
    if #oldest > 0 then
        retry_after = tonumber(oldest[2]) + window - now
    end
    return {0, 0, retry_after}
end
