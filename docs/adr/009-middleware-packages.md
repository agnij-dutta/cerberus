# ADR 009: Framework-Specific Middleware Packages

**Status:** Accepted
**Date:** 2026-03-12
**Author:** Agnij Dutta

## Context

The core SDKs (`cerberus-sdk` for Python, `@cerberus/sdk` for TypeScript) provide a raw client for making rate limit checks. But most users want to drop in rate limiting with one or two lines of code — not manually call `client.check()` in every route handler.

Framework-specific middleware packages bridge this gap.

## Decision

Create two middleware packages, one per primary target framework:

### `cerberus-fastapi` (PyPI)

Two integration patterns:

1. **Middleware** — applies to all routes:
   ```python
   app.add_middleware(CerberusMiddleware, base_url=..., api_key=..., policy_id=...)
   ```

2. **Decorator** — per-route control:
   ```python
   @app.get("/resource")
   @rate_limit("policy-uuid")
   async def get_resource(request: Request): ...
   ```

### `@cerberus/express` (npm)

Single factory function, usable globally or per-route:
```typescript
const limiter = createRateLimiter(config, { policyId: "uuid" });
app.use(limiter);           // global
app.get("/api", limiter, handler);  // per-route
```

### Shared Design Principles

Both packages follow the same conventions:

| Feature | Behavior |
|---------|----------|
| Default identifier | Client IP (respects `X-Forwarded-For`) |
| Custom identifier | `identifier_fn` / `identifierFn` callback |
| Fail open | Optional — when Cerberus is unreachable, allow requests through |
| Response headers | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` |
| 429 response body | `{"detail": "Rate limit exceeded", "retry_after_ms": N}` |

### Package Dependencies

- `cerberus-fastapi` depends on `cerberus-sdk` (the Python core client) and `fastapi`
- `@cerberus/express` is self-contained — it embeds a minimal HTTP client to avoid forcing users to install `@cerberus/sdk` separately. Express users only need one package.

## Alternatives Considered

1. **Single SDK with built-in middleware** — Increases the core SDK's dependency footprint. A FastAPI user shouldn't need to install Express types, and vice versa.

2. **Generic HTTP middleware (framework-agnostic)** — Too low-level. Users would still need to write glue code for their specific framework's request/response types.

3. **Only middleware, no core SDK** — Some users need the raw client for custom logic (batch checks, conditional limiting, testing). The core SDK remains valuable.

## Consequences

### Good

- One-liner integration for the two most popular frameworks in each ecosystem
- Separation of concerns: core client vs. framework integration
- Independent versioning — middleware can evolve without bumping the core SDK

### Bad

- Four packages to maintain and publish instead of two
- Middleware packages must stay in sync with backend API changes (same as the core SDKs)
- Express package duplicates some HTTP client logic from `@cerberus/sdk` — accepted tradeoff for simpler install
