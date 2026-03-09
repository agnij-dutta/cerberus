# Cerberus API Reference

Base URL: `http://localhost:8000/api/v1`

All requests must include the `X-API-Key` header. Admin endpoints require the admin API key. Tenant endpoints use the tenant's API key.

## Authentication

Every request needs an API key in the `X-API-Key` header:

```
X-API-Key: your-api-key-here
```

There are two types of keys:
- **Admin key** — for managing tenants (set via `CERBERUS_ADMIN_API_KEY` env var)
- **Tenant key** — for managing policies and making rate limit checks (returned when you create a tenant)

---

## Rate Limit Check

### `POST /api/v1/check`

The main event. Call this to check (and count) a request against a rate limit policy.

**Auth:** Tenant API key

**Request:**
```json
{
  "key": "user:42",
  "policy": "standard-api",
  "cost": 1
}
```

| Field    | Type   | Required | Description                                       |
|----------|--------|----------|---------------------------------------------------|
| `key`    | string | yes      | The identifier to rate limit (user ID, IP, etc.)  |
| `policy` | string | yes      | Name of the policy to check against               |
| `cost`   | int    | no       | How many tokens this request costs (default: 1)   |

**Response (200 — Allowed):**
```json
{
  "allowed": true,
  "remaining": 94,
  "limit": 100,
  "reset": 1710000060,
  "retry_after": null
}
```

**Response (429 — Rate Limited):**
```json
{
  "allowed": false,
  "remaining": 0,
  "limit": 100,
  "reset": 1710000060,
  "retry_after": 12.5
}
```

**Rate Limit Headers:**

Every response includes these headers, even on 429s:

| Header                  | Description                                    |
|-------------------------|------------------------------------------------|
| `X-RateLimit-Limit`    | Maximum requests allowed in the window         |
| `X-RateLimit-Remaining`| Requests remaining in current window           |
| `X-RateLimit-Reset`    | Unix timestamp when the window resets          |
| `Retry-After`          | Seconds until the client can retry (429 only)  |

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/check \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tenant-api-key-here" \
  -d '{"key": "user:42", "policy": "standard-api"}'
```

---

## Tenants

### `POST /api/v1/tenants`

Create a new tenant. Returns the tenant ID and API key.

**Auth:** Admin API key

**Request:**
```json
{
  "name": "my-app"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "my-app",
  "api_key": "cerb_live_a1b2c3d4e5f6...",
  "is_active": true,
  "created_at": "2026-03-10T12:00:00Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/tenants \
  -H "Content-Type: application/json" \
  -H "X-API-Key: cerberus-admin-dev-key" \
  -d '{"name": "my-app"}'
```

### `GET /api/v1/tenants`

List all tenants.

**Auth:** Admin API key

**Response (200):**
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "my-app",
      "is_active": true,
      "created_at": "2026-03-10T12:00:00Z"
    }
  ],
  "total": 1
}
```

**Example:**
```bash
curl http://localhost:8000/api/v1/tenants \
  -H "X-API-Key: cerberus-admin-dev-key"
```

### `GET /api/v1/tenants/{tenant_id}`

Get a specific tenant.

**Auth:** Admin API key

```bash
curl http://localhost:8000/api/v1/tenants/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: cerberus-admin-dev-key"
```

### `DELETE /api/v1/tenants/{tenant_id}`

Deactivate a tenant. This doesn't delete data — it sets `is_active` to false and invalidates the API key.

**Auth:** Admin API key

```bash
curl -X DELETE http://localhost:8000/api/v1/tenants/550e8400-... \
  -H "X-API-Key: cerberus-admin-dev-key"
```

**Response (204):** No content.

---

## Policies

### `POST /api/v1/policies`

Create a rate limit policy for the authenticated tenant.

**Auth:** Tenant API key

**Request:**
```json
{
  "name": "standard-api",
  "algorithm": "sliding_window",
  "limit": 100,
  "window_seconds": 60,
  "burst_limit": null
}
```

| Field            | Type   | Required | Description                                    |
|------------------|--------|----------|------------------------------------------------|
| `name`           | string | yes      | Unique name within the tenant                  |
| `algorithm`      | string | no       | `sliding_window`, `fixed_window`, `token_bucket` (default: `sliding_window`) |
| `limit`          | int    | yes      | Max requests per window                        |
| `window_seconds` | int    | yes      | Window duration in seconds                     |
| `burst_limit`    | int    | no       | Max burst size (token_bucket only)             |

**Response (201):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "standard-api",
  "algorithm": "sliding_window",
  "limit": 100,
  "window_seconds": 60,
  "burst_limit": null,
  "is_active": true,
  "created_at": "2026-03-10T12:00:00Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/policies \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tenant-api-key-here" \
  -d '{
    "name": "standard-api",
    "algorithm": "sliding_window",
    "limit": 100,
    "window_seconds": 60
  }'
```

### `GET /api/v1/policies`

List all policies for the authenticated tenant.

**Auth:** Tenant API key

```bash
curl http://localhost:8000/api/v1/policies \
  -H "X-API-Key: tenant-api-key-here"
```

### `GET /api/v1/policies/{policy_id}`

Get a specific policy.

**Auth:** Tenant API key

### `PUT /api/v1/policies/{policy_id}`

Update a policy. You can change `limit`, `window_seconds`, and `burst_limit`. Changing `algorithm` requires creating a new policy.

**Auth:** Tenant API key

```bash
curl -X PUT http://localhost:8000/api/v1/policies/660e8400-... \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tenant-api-key-here" \
  -d '{"limit": 200, "window_seconds": 60}'
```

### `DELETE /api/v1/policies/{policy_id}`

Delete a policy. Active rate limit counters for this policy will expire naturally.

**Auth:** Tenant API key

**Response (204):** No content.

---

## Health & Metrics

### `GET /health`

Health check endpoint. No auth required.

**Response (200):**
```json
{
  "status": "healthy",
  "redis": "connected",
  "postgres": "connected",
  "version": "1.0.0"
}
```

### `GET /metrics`

Prometheus metrics endpoint. No auth required (restrict via network policy in production).

Returns Prometheus text format with metrics including:
- `cerberus_rate_limit_checks_total` — counter by result (allowed/blocked) and algorithm
- `cerberus_check_duration_seconds` — histogram of check latencies
- `cerberus_redis_operation_duration_seconds` — histogram by operation type
- `cerberus_active_tenants` — gauge
- `cerberus_cache_hits_total` / `cerberus_cache_misses_total` — cache effectiveness

---

## Error Responses

All errors follow [RFC 7807](https://tools.ietf.org/html/rfc7807) Problem Details format:

```json
{
  "type": "https://cerberus.dev/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Policy 'nonexistent' not found for this tenant.",
  "instance": "/api/v1/check"
}
```

### Common Error Codes

| Status | Type                  | When                                      |
|--------|-----------------------|-------------------------------------------|
| 400    | `validation-error`    | Invalid request body or parameters        |
| 401    | `unauthorized`        | Missing or invalid API key                |
| 403    | `forbidden`           | API key doesn't have access to resource   |
| 404    | `not-found`           | Tenant or policy doesn't exist            |
| 409    | `conflict`            | Resource already exists (duplicate name)  |
| 429    | `rate-limited`        | Rate limit exceeded                       |
| 503    | `service-unavailable` | Backend dependency (Redis/Postgres) down  |
