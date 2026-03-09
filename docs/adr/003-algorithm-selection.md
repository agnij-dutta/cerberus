# ADR 003: Supporting Multiple Rate Limiting Algorithms

**Status:** Accepted
**Date:** 2026-01-22
**Author:** Agnij Dutta

## Context

There's no single "best" rate limiting algorithm. Different use cases call for different behaviors:

- A public API wants predictable, user-friendly limits ("100 requests per minute")
- A payment gateway wants smooth traffic shaping (no bursts)
- A login page wants hard limits with some burst tolerance
- An internal service wants to prevent runaway loops without penalizing normal traffic

We needed to decide: ship one algorithm and keep it simple, or support multiple algorithms and let tenants choose?

## Decision

Support **three algorithms** from day one, selectable per policy:

### 1. Sliding Window (`sliding_window`)

**How it works:** Count requests in a rolling time window. At any moment, look back `window_seconds` and count. If under the limit, allow.

**Implementation:** Redis sorted set (see ADR-001). Each request is a member with timestamp as score.

**Best for:** Public API rate limits. The most intuitive behavior for developers — "100 per minute" means exactly that, regardless of when you start counting.

**Tradeoff:** Highest memory usage per key (stores each request individually).

### 2. Fixed Window (`fixed_window`)

**How it works:** Divide time into fixed buckets. Window ID = `floor(now / window_seconds)`. Count requests in the current bucket. Reset at bucket boundaries.

**Implementation:** Redis string with `INCR` + `EXPIRE`. Dead simple.

**Best for:** When you want cheap, fast counting and don't mind boundary effects. Good for internal services where exact fairness doesn't matter.

**Tradeoff:** Boundary problem — a user can make `limit` requests at the end of one window and `limit` more at the start of the next, effectively doubling their rate for a brief period.

### 3. Token Bucket (`token_bucket`)

**How it works:** A bucket starts full of tokens. Each request removes a token. Tokens refill at a steady rate. The bucket has a maximum capacity (burst limit).

**Implementation:** Redis hash with `{tokens, last_refill}`. On each request, calculate how many tokens have refilled since `last_refill`, add them (up to burst_limit), then try to remove one.

**Best for:** Traffic shaping. Allows short bursts while enforcing a long-term average rate. Great for services that handle bursty but generally well-behaved traffic.

**Tradeoff:** More complex mental model. "20 tokens/sec with burst of 50" is harder to reason about than "100 per minute."

## Algorithm Comparison

```
                  Sliding Window    Fixed Window    Token Bucket
                  ──────────────    ────────────    ────────────
Accuracy          Exact             Approximate     Exact (avg)
Memory/key        O(limit)          O(1)            O(1)
Redis ops/check   3-4 (Lua)         1-2 (Lua)       2-3 (Lua)
Burst handling    Prevents bursts   Allows 2x burst Configurable
Boundary effects  None              Yes             None
Complexity        Medium            Low             Medium
Best for          Public APIs       Internal APIs   Traffic shaping
```

## Consequences

### Good

- **Flexibility.** Tenants can pick the right tool for the job. A single tenant can even use different algorithms for different endpoints.
- **Future-proof.** Adding new algorithms (leaky bucket, GCRA, etc.) follows the same pattern — new Lua script, same API.
- **Competitive feature.** Most rate limiting services only offer one or two algorithms. Three out of the box is a differentiator.

### Bad

- **More code to maintain.** Three Lua scripts, three sets of tests, three sets of edge cases. We accept this because the algorithms are well-understood and unlikely to change.
- **Decision fatigue.** New users might not know which algorithm to pick. We mitigate this by defaulting to `sliding_window` (the most intuitive) and documenting when to use each one.
- **Performance differences.** Sliding window uses more memory than fixed window. We document this tradeoff clearly so tenants can make informed choices.

### What we explicitly chose NOT to support (for now)

- **Leaky Bucket:** Very similar to token bucket in practice. We can add it later if there's demand without breaking anything.
- **GCRA (Generic Cell Rate Algorithm):** Elegant but hard to explain. The mental model doesn't map well to "X requests per Y seconds." Might add it as an advanced option later.
- **Distributed/Global rate limiting:** Requires cross-region coordination. On the roadmap, but not v1.

## References

- "Rate Limiting Fundamentals" (blog post by Figma engineering)
- Kong's rate limiting plugin documentation (supports similar algorithm set)
- Google Cloud Armor rate limiting (uses token bucket)
- Stripe's API rate limiting (sliding window)
