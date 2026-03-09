"use client";

import { CodeBlock } from "@/components/docs/CodeBlock";

const endpoints = [
  {
    method: "POST",
    path: "/v1/check",
    title: "Check Rate Limit",
    description: "Evaluate whether a request should be allowed based on the configured rate limit policy. This is the primary hot-path endpoint — designed for sub-millisecond response times.",
    request: `{
  "key": "user:42",
  "policy": "api-default"
}`,
    response: `{
  "allowed": true,
  "remaining": 97,
  "limit": 100,
  "reset_at": 1710100060,
  "retry_after": null
}`,
    responseBlocked: `{
  "allowed": false,
  "remaining": 0,
  "limit": 100,
  "reset_at": 1710100060,
  "retry_after": 3.2
}`,
    headers: [
      "X-RateLimit-Limit: 100",
      "X-RateLimit-Remaining: 97",
      "X-RateLimit-Reset: 1710100060",
    ],
    curl: `curl -X POST http://localhost:8000/v1/check \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{"key": "user:42", "policy": "api-default"}'`,
  },
  {
    method: "POST",
    path: "/v1/policies",
    title: "Create Policy",
    description: "Create a new rate limit policy for the authenticated tenant. Policies define the algorithm, limit, and time window for rate limiting.",
    request: `{
  "name": "api-default",
  "algorithm": "sliding_window",
  "limit": 100,
  "window_seconds": 60
}`,
    response: `{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "tenant-uuid",
  "name": "api-default",
  "algorithm": "sliding_window",
  "limit": 100,
  "window_seconds": 60,
  "refill_rate": null,
  "is_active": true,
  "created_at": "2026-03-10T12:00:00Z",
  "updated_at": "2026-03-10T12:00:00Z"
}`,
    curl: `curl -X POST http://localhost:8000/v1/policies \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{
    "name": "api-default",
    "algorithm": "sliding_window",
    "limit": 100,
    "window_seconds": 60
  }'`,
  },
  {
    method: "GET",
    path: "/v1/policies",
    title: "List Policies",
    description: "List all rate limit policies for the authenticated tenant.",
    response: `[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "api-default",
    "algorithm": "sliding_window",
    "limit": 100,
    "window_seconds": 60,
    "is_active": true
  }
]`,
    curl: `curl http://localhost:8000/v1/policies \\
  -H "X-API-Key: your-api-key"`,
  },
  {
    method: "PUT",
    path: "/v1/policies/{id}",
    title: "Update Policy",
    description: "Update an existing rate limit policy. Changes propagate to all nodes within the cache TTL (default: 30 seconds).",
    request: `{
  "limit": 200,
  "window_seconds": 120
}`,
    response: `{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "api-default",
  "algorithm": "sliding_window",
  "limit": 200,
  "window_seconds": 120,
  "is_active": true,
  "updated_at": "2026-03-10T12:30:00Z"
}`,
    curl: `curl -X PUT http://localhost:8000/v1/policies/550e8400-... \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{"limit": 200, "window_seconds": 120}'`,
  },
  {
    method: "DELETE",
    path: "/v1/policies/{id}",
    title: "Delete Policy",
    description: "Permanently delete a rate limit policy. Existing rate limit keys in Redis will expire naturally after their TTL.",
    curl: `curl -X DELETE http://localhost:8000/v1/policies/550e8400-... \\
  -H "X-API-Key: your-api-key"`,
  },
  {
    method: "POST",
    path: "/v1/tenants",
    title: "Create Tenant",
    description: "Create a new tenant. Requires the admin API key. Returns the generated API key — store it securely, it won't be shown again.",
    request: `{
  "name": "acme-corp",
  "tier": "pro"
}`,
    response: `{
  "id": "tenant-uuid",
  "name": "acme-corp",
  "api_key": "ck_live_a1b2c3d4e5f6...",
  "api_key_prefix": "ck_live_a",
  "is_active": true,
  "tier": "pro",
  "created_at": "2026-03-10T12:00:00Z"
}`,
    curl: `curl -X POST http://localhost:8000/v1/tenants \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: admin-api-key" \\
  -d '{"name": "acme-corp", "tier": "pro"}'`,
  },
  {
    method: "GET",
    path: "/v1/analytics",
    title: "Get Analytics",
    description: "Retrieve usage analytics for the authenticated tenant. Supports time window filtering.",
    response: `{
  "total_requests": 15234,
  "allowed_requests": 14891,
  "blocked_requests": 343,
  "block_rate": 0.0225,
  "avg_latency_ms": 0.72,
  "p99_latency_ms": 1.8,
  "top_keys": [
    {"key": "user:42", "count": 1204},
    {"key": "user:99", "count": 987}
  ],
  "timeline": [
    {"timestamp": "2026-03-10T11:00:00Z", "allowed": 523, "blocked": 12}
  ]
}`,
    curl: `curl "http://localhost:8000/v1/analytics?window=1h" \\
  -H "X-API-Key: your-api-key"`,
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-green/15 text-green border-green/30",
  POST: "bg-cyan/15 text-cyan border-cyan/30",
  PUT: "bg-amber/15 text-amber border-amber/30",
  DELETE: "bg-red/15 text-red border-red/30",
};

export default function ApiReferencePage() {
  return (
    <article className="space-y-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          API Reference
        </h1>
        <p className="text-text-secondary text-lg mb-6">
          Complete reference for the Cerberus REST API. All endpoints require an{" "}
          <code className="px-1.5 py-0.5 rounded bg-surface text-cyan text-sm">
            X-API-Key
          </code>{" "}
          header.
        </p>

        <div className="p-4 rounded-xl border border-border bg-surface/30 mb-8">
          <h3 className="text-sm font-semibold mb-2">Base URL</h3>
          <code className="text-sm font-mono text-cyan">
            http://localhost:8000
          </code>
          <p className="text-xs text-text-muted mt-1">
            In production, replace with your deployment URL.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface/30">
          <h3 className="text-sm font-semibold mb-2">Authentication</h3>
          <p className="text-sm text-text-secondary mb-2">
            Pass your API key in the <code className="text-cyan">X-API-Key</code>{" "}
            header with every request. Keys are created when you register a new
            tenant.
          </p>
          <CodeBlock
            code={`curl -H "X-API-Key: ck_live_a1b2c3d4e5f6..." http://localhost:8000/v1/policies`}
            language="bash"
          />
        </div>
      </div>

      {endpoints.map((ep) => (
        <section key={`${ep.method}-${ep.path}`} className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${
                methodColors[ep.method]
              }`}
            >
              {ep.method}
            </span>
            <code className="text-base font-mono text-text-primary">
              {ep.path}
            </code>
          </div>

          <h2 className="text-xl font-semibold mb-2">{ep.title}</h2>
          <p className="text-sm text-text-secondary mb-5 leading-relaxed">
            {ep.description}
          </p>

          {ep.request && (
            <div className="mb-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-text-muted mb-2">
                Request Body
              </h4>
              <CodeBlock code={ep.request} language="json" />
            </div>
          )}

          {ep.response && (
            <div className="mb-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-text-muted mb-2">
                Response
              </h4>
              <CodeBlock code={ep.response} language="json" />
            </div>
          )}

          {"responseBlocked" in ep && ep.responseBlocked && (
            <div className="mb-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-text-muted mb-2">
                Response (Rate Limited)
              </h4>
              <CodeBlock code={ep.responseBlocked} language="json" />
            </div>
          )}

          {"headers" in ep && ep.headers && (
            <div className="mb-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-text-muted mb-2">
                Rate Limit Headers
              </h4>
              <CodeBlock
                code={(ep.headers as string[]).join("\n")}
                language="http"
              />
            </div>
          )}

          {ep.curl && (
            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-text-muted mb-2">
                Example
              </h4>
              <CodeBlock code={ep.curl} language="bash" />
            </div>
          )}
        </section>
      ))}

      {/* Error responses */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Error Responses</h2>
        <p className="text-sm text-text-secondary mb-4 leading-relaxed">
          Cerberus uses{" "}
          <a
            href="https://www.rfc-editor.org/rfc/rfc7807"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan hover:underline"
          >
            RFC 7807 Problem Details
          </a>{" "}
          for error responses. Every error includes a machine-readable type URI,
          a human-readable title, the HTTP status code, and a descriptive detail
          message.
        </p>
        <CodeBlock
          language="json"
          code={`{
  "type": "https://cerberus.dev/errors/rate-limited",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Policy 'api-default' limit of 100 requests per 60s exceeded.",
  "retry_after": 3.2
}`}
        />
      </section>
    </article>
  );
}
