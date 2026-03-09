"use client";

import { CodeBlock } from "@/components/docs/CodeBlock";

export default function ArchitecturePage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Architecture</h1>
        <p className="text-text-secondary text-lg">
          How Cerberus is built under the hood — from request flow to data model.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">System Overview</h2>
        <CodeBlock
          language="text"
          code={`┌──────────────┐     ┌──────────────────┐     ┌───────────┐
│ Your Service │────▶│   Cerberus API   │────▶│   Redis   │
│              │◀────│   (FastAPI)      │◀────│  Sorted   │
└──────────────┘     │                  │     │   Sets    │
                     │  ┌────────────┐  │     └───────────┘
                     │  │ Lua Script │  │
                     │  │ (EVALSHA)  │  │     ┌───────────┐
                     │  └────────────┘  │────▶│ Postgres  │
                     │                  │     │ (Policies │
                     │  ┌────────────┐  │     │  Tenants) │
                     │  │ Prometheus │  │     └───────────┘
                     │  │  Metrics   │  │
                     │  └────────────┘  │
                     └──────────────────┘`}
        />
        <p className="text-text-secondary mt-4 leading-relaxed">
          The API layer is fully stateless. All rate limiting state lives in Redis.
          Configuration (tenants, policies) is stored in PostgreSQL and aggressively
          cached in a three-tier cache: in-process LRU, Redis hash, and Postgres.
          The hot path — the rate limit check — never touches Postgres.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">The Hot Path</h2>
        <p className="text-text-secondary mb-4 leading-relaxed">
          When a <code className="text-cyan">POST /v1/check</code> request arrives,
          here&apos;s exactly what happens:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-text-secondary">
          <li>
            <strong className="text-text-primary">Auth middleware</strong> resolves the API key
            to a tenant. Tenant metadata is cached in an in-process LRU (TTL 60s).
          </li>
          <li>
            <strong className="text-text-primary">Policy resolution</strong> looks up the named
            policy from a local cache (TTL 30s), falling back to Redis, then Postgres.
          </li>
          <li>
            <strong className="text-text-primary">Algorithm dispatch</strong> calls the appropriate
            Lua script via a single <code className="text-cyan">EVALSHA</code> command.
          </li>
          <li>
            <strong className="text-text-primary">Response</strong> is returned immediately with
            the allow/deny decision, remaining count, and rate limit headers.
          </li>
        </ol>
        <p className="text-text-secondary mt-3 leading-relaxed">
          Total: one network round-trip to Redis, zero Postgres queries, no Python-side
          race conditions. Typical latency: 0.5-0.8ms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Sliding Window Algorithm</h2>
        <p className="text-text-secondary mb-4 leading-relaxed">
          The sliding window uses a Redis sorted set where each member is a unique request
          ID and each score is the request timestamp in microseconds. On every check:
        </p>
        <CodeBlock
          language="lua"
          filename="sliding_window.lua"
          code={`-- Remove expired entries outside the window
ZREMRANGEBYSCORE key -inf (now - window)

-- Count remaining entries
count = ZCARD key

if count < limit then
    -- Add this request and allow
    ZADD key now request_id
    PEXPIRE key (window_ms + buffer)
    return ALLOWED, (limit - count - 1), 0
else
    -- Find when the oldest entry expires
    oldest = ZRANGE key 0 0 WITHSCORES
    retry_after = oldest.score + window - now
    return DENIED, 0, retry_after
end`}
        />
        <p className="text-text-secondary mt-3 leading-relaxed">
          Because this runs as a single Lua script inside Redis, the entire
          read-modify-write cycle is atomic. No TOCTOU bugs, no distributed locks.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Token Bucket Algorithm</h2>
        <p className="text-text-secondary mb-4 leading-relaxed">
          The token bucket uses a Redis hash with two fields: <code className="text-cyan">tokens</code>{" "}
          (current count) and <code className="text-cyan">last_refill</code> (timestamp). On every check,
          tokens are refilled based on elapsed time, then consumed if available.
        </p>
        <CodeBlock
          language="lua"
          filename="token_bucket.lua"
          code={`-- Load current bucket state
tokens, last_refill = HMGET key 'tokens' 'last_refill'

-- Calculate refilled tokens since last check
elapsed = (now - last_refill) / 1_000_000  -- microseconds to seconds
refilled = min(capacity, tokens + elapsed * refill_rate)

if refilled >= requested then
    new_tokens = refilled - requested
    HMSET key 'tokens' new_tokens 'last_refill' now
    return ALLOWED, floor(new_tokens), 0
else
    deficit = requested - refilled
    retry_after = ceil(deficit / refill_rate * 1_000_000)
    return DENIED, 0, retry_after
end`}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Redis Key Design</h2>
        <p className="text-text-secondary mb-4">
          All keys are namespaced by tenant and policy to ensure isolation:
        </p>
        <CodeBlock
          language="text"
          code={`rl:{tenant_id}:{key}:{policy_name}

Examples:
  rl:t-abc123:user:42:api-default
  rl:t-abc123:ip:192.168.1.1:strict
  rl:t-def456:endpoint:/api/upload:burst-policy`}
        />
        <p className="text-text-secondary mt-3">
          Every key auto-expires via <code className="text-cyan">PEXPIRE</code> after
          the window duration. No background cleanup jobs needed.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Caching Strategy</h2>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Cerberus uses a three-tier cache to keep the hot path fast without sacrificing
          consistency:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-surface text-left">
                <th className="px-4 py-2.5 font-medium text-text-secondary border-b border-border">Layer</th>
                <th className="px-4 py-2.5 font-medium text-text-secondary border-b border-border">Storage</th>
                <th className="px-4 py-2.5 font-medium text-text-secondary border-b border-border">TTL</th>
                <th className="px-4 py-2.5 font-medium text-text-secondary border-b border-border">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              <tr className="border-b border-border">
                <td className="px-4 py-2.5 font-mono text-cyan">L1</td>
                <td className="px-4 py-2.5">In-process LRU</td>
                <td className="px-4 py-2.5">30-60s</td>
                <td className="px-4 py-2.5">Zero-latency reads for hot policies/tenants</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2.5 font-mono text-cyan">L2</td>
                <td className="px-4 py-2.5">Redis Hash</td>
                <td className="px-4 py-2.5">5min</td>
                <td className="px-4 py-2.5">Shared cache across all API replicas</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-cyan">L3</td>
                <td className="px-4 py-2.5">PostgreSQL</td>
                <td className="px-4 py-2.5">Permanent</td>
                <td className="px-4 py-2.5">Source of truth for configuration</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-text-secondary mt-3 leading-relaxed">
          When a policy is updated via the API, a Redis pub/sub message invalidates
          the L1 cache across all replicas. The L2 cache is overwritten directly.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Failure Modes</h2>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Cerberus is designed to <strong>fail open</strong> by default. If Redis is
          unreachable, the check endpoint returns <code className="text-cyan">allowed: true</code>{" "}
          rather than blocking all traffic. This is the correct behavior for a rate
          limiter — it&apos;s better to temporarily allow extra requests than to
          create an outage for your users.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Scaling</h2>
        <p className="text-text-secondary leading-relaxed">
          The API layer is stateless, so horizontal scaling is straightforward: add
          more replicas behind a load balancer. Each replica maintains its own Redis
          connection pool (default: 20 connections). With 10 replicas, that&apos;s 200
          connections — well within Redis&apos;s capability. For the Redis layer,
          consider Redis Sentinel for high availability or Redis Cluster for sharding
          at very high throughput.
        </p>
      </section>
    </article>
  );
}
