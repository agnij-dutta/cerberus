# Getting Started with Cerberus

Get a fully working rate limiter running locally in about five minutes. No, really.

## Prerequisites

You'll need:
- **Docker** and **Docker Compose** (v2+)
- **curl** (for poking the API)
- A terminal and mild enthusiasm

That's it. Everything else runs in containers.

## 1. Clone and Start

```bash
git clone https://github.com/your-org/cerberus.git
cd cerberus

# Fire up the whole stack
make dev
```

This starts:
- **Backend** (FastAPI) on [localhost:8000](http://localhost:8000)
- **Frontend** (Next.js) on [localhost:3000](http://localhost:3000)
- **Redis** on localhost:6379
- **Postgres** on localhost:5432
- **Prometheus** on [localhost:9090](http://localhost:9090)
- **Grafana** on [localhost:3001](http://localhost:3001) (admin / cerberus)

Wait for the health check to pass:

```bash
curl http://localhost:8000/health
```

You should see:
```json
{"status": "healthy", "redis": "connected", "postgres": "connected", "version": "1.0.0"}
```

## 2. Create a Tenant

Tenants are isolated rate-limiting namespaces. Each gets its own API key.

```bash
curl -X POST http://localhost:8000/api/v1/tenants \
  -H "Content-Type: application/json" \
  -H "X-API-Key: cerberus-admin-dev-key" \
  -d '{"name": "my-app"}'
```

Save the `api_key` from the response — you'll need it for everything else.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "my-app",
  "api_key": "cerb_live_a1b2c3d4..."
}
```

## 3. Create a Rate Limit Policy

Policies define the rules. Let's create one that allows 100 requests per minute:

```bash
curl -X POST http://localhost:8000/api/v1/policies \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_TENANT_API_KEY" \
  -d '{
    "name": "api-standard",
    "algorithm": "sliding_window",
    "limit": 100,
    "window_seconds": 60
  }'
```

## 4. Check a Rate Limit

Now the fun part. Every time a user makes a request to your API, you call Cerberus to check if they're within limits:

```bash
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
  "reset": 1710000060,
  "retry_after": null
}
```

Hit it 100 more times and you'll get:
```json
{
  "allowed": false,
  "remaining": 0,
  "limit": 100,
  "reset": 1710000060,
  "retry_after": 34.2
}
```

The response headers also include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` — just forward these to your end users.

## 5. Watch the Metrics

Open Grafana at [localhost:3001](http://localhost:3001) and log in with `admin` / `cerberus`.

The pre-built Cerberus dashboard shows:
- Requests allowed vs. blocked (real-time)
- Latency percentiles
- Redis operation timing
- Active tenant count
- Cache hit ratios

You can also check Prometheus directly at [localhost:9090](http://localhost:9090) and query `cerberus_rate_limit_checks_total`.

## Or Just Use the Seed Script

Too lazy to type all that? Fair:

```bash
make seed
```

This creates a demo tenant with three sample policies (standard API, burst, and login limiter) and prints out the credentials.

## What's Next?

- Read the [API Reference](./api-reference.md) for the full endpoint docs
- Check out the [Architecture](./architecture.md) doc to understand how it works under the hood
- Look at the [SDKs](../sdk/) for Python and TypeScript clients
- For production deployment, see the [Deployment Guide](./deployment.md)

## Troubleshooting

**Backend won't start?**
Check that ports 8000, 5432, and 6379 aren't already in use. Run `docker compose logs backend` to see what's going on.

**Redis connection refused?**
Make sure the Redis container is healthy: `docker compose ps`. If it's restarting, check `docker compose logs redis`.

**Postgres init failed?**
The init script only runs on first boot. If you need to reset: `docker compose down -v` (this deletes all data) and start fresh.
