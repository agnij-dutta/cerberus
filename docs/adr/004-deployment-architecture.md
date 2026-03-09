# ADR 004: Free-Tier Cloud Deployment Architecture

**Status:** Accepted
**Date:** 2026-03-09
**Author:** Agnij Dutta

## Context

Cerberus needs to be publicly accessible for demos and early adoption without incurring infrastructure costs. The stack has four components that need hosting:

1. **Frontend** — Next.js 15 SSR application
2. **Backend** — FastAPI with Gunicorn/Uvicorn workers
3. **PostgreSQL** — Configuration store (tenants, policies)
4. **Redis** — Hot path (rate limit counters, caching)

Constraints:
- Zero cost (all free tiers)
- Must support custom domains
- Must handle the full feature set (SSR, WebSockets not required, TLS mandatory)
- Acceptable cold-start latency (this is a demo/early-stage deployment, not production SLA)

## Decision

| Component | Provider | Why |
|-----------|----------|-----|
| Frontend | **Vercel** | Native Next.js support, zero-config deployment from GitHub, global CDN, generous free tier |
| Backend | **Render** | Docker-based deployment, free tier with 750 hours/month, auto-deploy from GitHub |
| PostgreSQL | **Neon** | Serverless Postgres, scales to zero, 0.5GB free storage, branching for dev/staging |
| Redis | **Upstash** | Serverless Redis with TLS, 10k commands/day free, per-request pricing beyond that |

### Frontend → Backend Communication

The frontend runs on Vercel's domain. API calls need to reach the backend on Render without CORS issues.

**Solution:** Vercel rewrites. All requests to `/api/v1/*` on the frontend domain are proxied server-side to the Render backend. The browser never sees a cross-origin request.

```json
{
  "rewrites": [
    {
      "source": "/api/v1/:path*",
      "destination": "https://cerberus-api-eg8l.onrender.com/v1/:path*"
    }
  ]
}
```

This also means the backend URL is not exposed to the client — a minor security benefit.

### Keeping Render Alive

Render's free tier spins down services after 15 minutes of inactivity. Cold starts take 30-50 seconds (Docker container boot + Gunicorn startup + dependency loading).

**Solution:** A cron job on [cron-job.org](https://cron-job.org) hits `GET /healthz` every 10 minutes. The endpoint returns `{"status": "ok"}` with minimal overhead. This keeps the service warm without burning through Upstash's Redis command quota (healthz doesn't touch Redis).

### Database URL Conversion

Neon provides standard `postgresql://` connection strings. SQLAlchemy with asyncpg requires `postgresql+asyncpg://` as the scheme.

**Solution:** Automatic URL conversion at session initialization:
```python
db_url = str(settings.database_url)
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
```

We also detect Neon hosts and enable SSL:
```python
if "neon.tech" in db_url:
    connect_args["ssl"] = True
```

### Upstash Redis TLS

Upstash requires TLS connections and provides `rediss://` URLs (note the double 's'). The redis-py library handles this natively — no additional configuration needed beyond using the `rediss://` URL.

## Consequences

### Good

- **Zero infrastructure cost.** All providers are genuinely free for this workload level.
- **Zero ops burden.** No servers to patch, no containers to manage, no networking to configure. Push to GitHub and everything deploys.
- **Global edge network** for the frontend (Vercel CDN). Backend is single-region but that's acceptable for now.
- **Auto-scaling** on all layers (Vercel, Neon, Upstash). If traffic spikes, we don't go down — we just start paying.

### Bad

- **Cold starts on Render.** Even with the cron keepalive, occasional cold starts happen (cron-job.org isn't perfectly reliable). First request after a cold start takes 30-50 seconds.
- **Upstash command limits.** 10k commands/day on the free tier. Each rate limit check is ~3-5 Redis commands (Lua script counts as one, but policy cache lookups add more). This limits demo traffic to roughly 2,000-3,000 checks/day.
- **Neon cold starts.** Serverless Postgres can take 1-2 seconds to wake up. Mitigated by the 3-tier cache — most policy lookups never hit Postgres.
- **Single region.** Render free tier is US-only. Latency from other continents will be 100-300ms. Acceptable for demos, not for production.

### Migration Path

When Cerberus outgrows free tiers:

1. **Render → Railway or Fly.io** — better cold start times, multi-region support
2. **Upstash → self-hosted Redis** or Upstash paid tier — removes command limits
3. **Neon → Neon paid tier or Supabase** — removes compute hour limits
4. **Vercel stays** — the free tier is generous enough for most traffic levels

The application code doesn't change. All provider-specific details are in environment variables and URL formats.

## Alternatives Considered

- **Railway:** Good option, but the free tier is less generous than Render (no persistent free tier as of 2026).
- **Fly.io:** Better cold starts, but requires `fly.toml` configuration and CLI tooling. More complex setup for marginal benefit at this stage.
- **Supabase (for Postgres):** Viable, but Neon's serverless model is a better fit — we don't need Supabase's auth, storage, or realtime features.
- **AWS Free Tier (EC2 + ElastiCache + RDS):** 12-month limited free tier, significant ops overhead, overkill for a demo deployment.
