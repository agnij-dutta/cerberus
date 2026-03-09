-- ---------------------------------------------------------------------------
-- Token-bucket rate limiter.
--
-- Stores bucket state in a hash with two fields: ``tokens`` (float) and
-- ``last_refill`` (microsecond timestamp).  On each call we calculate how
-- many tokens have accumulated since the last refill, clamp to capacity,
-- and either grant or deny the request.
--
-- KEYS[1] — the rate-limit key
-- ARGV[1] — bucket capacity (max tokens)
-- ARGV[2] — refill rate (tokens per second)
-- ARGV[3] — current timestamp (microseconds)
-- ARGV[4] — number of tokens requested (usually 1)
--
-- Returns: {allowed (0|1), remaining, retry_after_us}
-- ---------------------------------------------------------------------------

local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(bucket[1])
local last_refill = tonumber(bucket[2])

-- First request — initialise a full bucket
if tokens == nil then
    tokens = capacity
    last_refill = now
end

-- Calculate how many tokens have accumulated since last refill
local elapsed = (now - last_refill) / 1000000  -- convert us to seconds
local refilled = math.min(capacity, tokens + elapsed * refill_rate)

if refilled >= requested then
    local new_tokens = refilled - requested
    redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now)
    -- TTL: time to refill from zero + 1 s buffer
    redis.call('PEXPIRE', key, math.ceil(capacity / refill_rate * 1000) + 1000)
    return {1, math.floor(new_tokens), 0}
else
    -- How long until enough tokens accumulate?
    local deficit = requested - refilled
    local retry_after = math.ceil(deficit / refill_rate * 1000000)  -- microseconds
    return {0, 0, retry_after}
end
