# Cerberus

**Production-grade Rate-Limit-as-a-Service.**

Stop reinventing rate limiting. Cerberus is a standalone service that handles rate limiting for your APIs — multi-tenant, sub-millisecond, and horizontally scalable.

---

## Why Cerberus?

Every team ends up building rate limiting. It starts as a simple Redis counter, then someone needs sliding windows, then another team needs token buckets, then you realize your implementation doesn't work across multiple instances, and before you know it you've spent three sprints on plumbing.

Cerberus is the rate limiter you'd build if you had the time to do it right:

- **Multi-tenant** — isolated rate limiting for each of your services or customers
- **Multiple algorithms** — sliding window, fixed window, token bucket. Pick the right tool.
- **Sub-millisecond latency** — single Redis round trip via atomic Lua scripts
- **Horizontally scalable** — stateless backends, shared Redis. Scale to millions of checks/sec.
- **Observable** — Prometheus metrics, pre-built Grafana dashboards, structured logging
- **Simple API** — one endpoint for checks, standard rate limit headers, RFC 7807 errors

## Architecture

```
  Clients
    │
    ▼
  Nginx (L7 LB)
    │
    ├──────────┬──────────┐
    ▼          ▼          ▼
  Backend    Backend    Backend     ← stateless FastAPI workers
    │          │          │
    └──────────┴──────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
      Redis       PostgreSQL
    (hot path)   (config store)
```

The hot path (rate limit checks) is a single Redis round trip. Policy configs are cached in-process with a 3-tier cache (LRU -> Redis -> Postgres). Backends are fully stateless.

## Quick Start

```bash
# Start everything
make dev

# Create a tenant
curl -X POST http://localhost:8000/api/v1/tenants \
  -H "Content-Type: application/json" \
  -H "X-API-Key: cerberus-admin-dev-key" \
  -d '{"name": "my-app"}'

# Create a policy (100 requests per minute)
curl -X POST http://localhost:8000/api/v1/policies \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_TENANT_API_KEY" \
  -d '{"name": "api-standard", "limit": 100, "window_seconds": 60}'

# Check a rate limit
curl -X POST http://localhost:8000/api/v1/check \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_TENANT_API_KEY" \
  -d '{"key": "user:42", "policy": "api-standard"}'
```

Response:
```json
{
  "allowed": true,
  "remaining": 99,
  "limit": 100,
  "reset": 1710000060
}
```

## Features

| Feature | Description |
|---------|-------------|
| **Sliding Window** | Exact counting over rolling time windows. No boundary artifacts. |
| **Fixed Window** | Cheap and fast. Simple counter with automatic reset. |
| **Token Bucket** | Smooth traffic shaping with configurable burst capacity. |
| **Multi-Tenant** | Isolated namespaces with per-tenant API keys. |
| **3-Tier Cache** | In-process LRU -> Redis -> Postgres. Policies served in ~10us. |
| **Atomic Lua Scripts** | All rate limit operations are single-roundtrip and race-free. |
| **Prometheus Metrics** | Request rates, latency percentiles, cache hit ratios. |
| **Grafana Dashboard** | Pre-built dashboard, zero configuration. |
| **Fail Open** | If Redis goes down, requests are allowed. Your users come first. |
| **SDKs** | Python and TypeScript clients included. |

## API at a Glance

```
POST   /api/v1/check              # Check (and count) a rate limit
POST   /api/v1/tenants            # Create a tenant (admin)
GET    /api/v1/tenants            # List tenants (admin)
POST   /api/v1/policies           # Create a policy
GET    /api/v1/policies           # List policies
PUT    /api/v1/policies/{id}      # Update a policy
DELETE /api/v1/policies/{id}      # Delete a policy
GET    /health                     # Health check
GET    /metrics                    # Prometheus metrics
```

Full reference: [docs/api-reference.md](docs/api-reference.md)

## Performance

Target numbers on a single instance (4-core, 8GB RAM, Redis on same host):

| Metric | Value |
|--------|-------|
| Throughput | 50,000+ checks/sec |
| p50 latency | < 0.3ms |
| p95 latency | < 0.8ms |
| p99 latency | < 1.5ms |
| Memory per 1M active keys | ~200MB Redis |

Scales horizontally by adding backend instances. Redis is the bottleneck — a single Redis instance handles 100k+ ops/sec. For more, use Redis Cluster sharded by tenant.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python 3.11+, FastAPI, Uvicorn |
| Rate Limiting | Redis 7+ with Lua scripts |
| Database | PostgreSQL 16 |
| Frontend | Next.js |
| Metrics | Prometheus + Grafana |
| Load Balancer | Nginx |
| SDKs | Python (httpx), TypeScript (fetch) |

## SDKs

### Python

```python
from cerberus import CerberusClient

client = CerberusClient(
    base_url="http://localhost:8000",
    api_key="your-tenant-key",
)

result = client.check("user:42", "api-standard")
if not result.allowed:
    raise Exception(f"Rate limited. Retry after {result.retry_after}s")
```

### TypeScript

```typescript
import { CerberusClient } from "@cerberus/sdk";

const client = new CerberusClient({
  baseUrl: "http://localhost:8000",
  apiKey: "your-tenant-key",
});

const result = await client.check("user:42", "api-standard");
if (!result.allowed) {
  throw new Error(`Rate limited. Retry after ${result.retryAfter}s`);
}
```

## Documentation

- [Getting Started](docs/getting-started.md)
- [API Reference](docs/api-reference.md)
- [Architecture](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing](docs/CONTRIBUTING.md)
- Architecture Decision Records: [ADR Index](docs/adr/)

## Contributing

We welcome contributions. See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## License

MIT. See [LICENSE](LICENSE).

Copyright (c) 2026 Agnij Dutta.
