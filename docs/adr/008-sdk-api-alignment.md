# ADR 008: SDK API Alignment with Backend Schema

**Status:** Accepted
**Date:** 2026-03-12
**Author:** Agnij Dutta

## Context

Both the Python and TypeScript SDKs were initially built with a different API contract than the actual backend:

**SDKs expected:**
```json
{"key": "user:123", "policy": "my-policy-name"}
```

**Backend actually accepts:**
```json
{"policy_id": "uuid-here", "identifier": "user:123", "tokens": 1}
```

The response shape also diverged — SDKs expected `reset` and `retry_after` fields, but the backend returns `retry_after_ms`. This would have caused runtime failures for any SDK user.

## Decision

Rewrite both SDK clients to match the real backend schema exactly:

### Python SDK (`cerberus-sdk`)

```python
client.check(policy_id="uuid", identifier="user:42", tokens=1)
# Returns: CheckResult(allowed, remaining, limit, retry_after_ms)
```

### TypeScript SDK (`@cerberus/sdk`)

```typescript
client.check("uuid", "user:42", 1)
// Returns: { allowed, remaining, limit, retryAfterMs }
```

Both SDKs hit `/v1/check` (not `/api/v1/check`) — the `/api` prefix is a frontend proxy concern, not part of the actual API.

## Consequences

### Good

- SDKs actually work against the real backend
- Single source of truth: `backend/app/api/v1/schemas/check.py` defines the contract
- Consistent naming: `policy_id` (UUID) everywhere, not `policy` (name)

### Bad

- Breaking change if anyone was using the old SDK API (unlikely — the old version never worked against the backend anyway)
- SDK field naming conventions differ between languages (snake_case in Python, camelCase in TypeScript) — this is intentional and idiomatic
