# Deployment Guide

How to get Cerberus running in different environments, from your laptop to production.

## Development (Docker Compose)

The easiest way. One command, everything runs locally.

```bash
cd infra
docker compose up -d
```

This gives you hot-reloading on the backend, access to all ports, and debug logging. See the [Getting Started](./getting-started.md) guide for details.

**Ports exposed:**
| Service    | Port |
|------------|------|
| Backend    | 8000 |
| Frontend   | 3000 |
| Redis      | 6379 |
| Postgres   | 5432 |
| Prometheus | 9090 |
| Grafana    | 3001 |

## Production (Docker Compose)

For small-to-medium deployments, Docker Compose with the production overlay works well.

### Setup

1. Copy and configure environment:
```bash
cp .env.example .env
# Edit .env — set real passwords, API keys, domain, etc.
```

2. Start with production overrides:
```bash
cd infra
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### What's different in production mode?

- **3 backend replicas** behind Nginx load balancer
- **Resource limits** on all containers (CPU + memory)
- **No port exposure** for internal services (Redis, Postgres)
- **Gunicorn** with 4 Uvicorn workers per replica (instead of single-process reload mode)
- **Nginx** terminates TLS and handles routing
- Restart policies with backoff
- Info-level logging (not debug)

### TLS Setup

Put your certs in `infra/nginx/certs/`:
```
infra/nginx/certs/
  ├── fullchain.pem
  └── privkey.pem
```

Then update `nginx.conf` to listen on 443 with SSL. There's a commented-out block in the config for this.

### Backups

**Postgres:** Set up `pg_dump` on a cron:
```bash
docker compose exec postgres pg_dump -U cerberus cerberus | gzip > backup-$(date +%Y%m%d).sql.gz
```

**Redis:** AOF persistence is enabled by default. For snapshots, the `appendonly.aof` file in the Redis volume is your backup.

## Kubernetes

For larger deployments, here's the high-level approach. We don't ship Helm charts yet (contributions welcome), but the architecture maps cleanly to K8s primitives.

### Resource Mapping

| Docker Compose Service | Kubernetes Resource                          |
|------------------------|----------------------------------------------|
| backend                | Deployment + Service + HPA                   |
| frontend               | Deployment + Service                         |
| redis                  | StatefulSet + Service (or Redis Operator)     |
| postgres               | StatefulSet + PVC (or managed DB like RDS)    |
| prometheus             | Prometheus Operator (recommended)             |
| grafana                | Grafana Operator or Deployment                |
| nginx                  | Ingress Controller (nginx-ingress or Traefik) |

### Key Considerations

**Backend Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cerberus-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cerberus-backend
  template:
    spec:
      containers:
        - name: backend
          image: cerberus-backend:latest
          resources:
            requests:
              cpu: 250m
              memory: 128Mi
            limits:
              cpu: "1"
              memory: 512Mi
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 30
```

**HPA (Horizontal Pod Autoscaler):**
Scale on CPU and custom metrics (request latency from Prometheus):
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

**Redis:** Seriously consider using a managed Redis service (ElastiCache, Memorystore, Azure Cache) in production. Running Redis yourself in K8s is doable but requires careful attention to persistence, failover, and resource isolation.

**Postgres:** Same advice — use RDS, Cloud SQL, or Azure Database for PostgreSQL. The operational overhead of running Postgres in K8s is rarely worth it unless you have a dedicated platform team.

### Secrets

Store credentials in Kubernetes Secrets (or better, use a secrets manager like Vault or AWS Secrets Manager):

```bash
kubectl create secret generic cerberus-secrets \
  --from-literal=admin-api-key='your-secure-key' \
  --from-literal=database-url='postgresql+asyncpg://...' \
  --from-literal=redis-url='redis://...'
```

## Free-Tier Cloud Deployment (Current Setup)

Cerberus runs on a zero-cost cloud stack. Here's what's deployed and how.

### Architecture

```
Browser → Vercel (Next.js SSR + CDN)
              │
              ├─ Static pages served from edge
              └─ /api/v1/* rewrites (server-side proxy)
                      │
                      ▼
              Render (FastAPI + Gunicorn)
                 │         │
                 ▼         ▼
           Upstash      Neon
           (Redis)    (PostgreSQL)
```

### Providers

| Component | Provider | Tier | Limits |
|-----------|----------|------|--------|
| Frontend | Vercel | Free | 100GB bandwidth/month |
| Backend | Render | Free | 750 hours/month, spins down after 15min idle |
| PostgreSQL | Neon | Free | 0.5GB storage, auto-suspend after 5min |
| Redis | Upstash | Free | 10k commands/day, 256MB storage |

### Environment Variables

**Render (Backend):**
```
DATABASE_URL=postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/cerberus?sslmode=require
REDIS_URL=rediss://default:pass@us1-xyz.upstash.io:6379
ADMIN_API_KEY=your-secure-admin-key
ENVIRONMENT=production
LOG_LEVEL=info
```

**Vercel (Frontend):**
No required env vars. The API proxy is configured in `vercel.json`.

### Keeping Render Alive

Render free tier kills idle services after 15 minutes. Cold starts take 30-50 seconds.

**Solution:** A cron job on [cron-job.org](https://cron-job.org) hits `GET /healthz` every 10 minutes. This endpoint returns `{"status": "ok"}` without touching Redis or Postgres, so it doesn't burn through Upstash's command quota.

### Neon URL Conversion

Neon provides `postgresql://` URLs. SQLAlchemy + asyncpg needs `postgresql+asyncpg://`. The backend auto-converts this at startup — no manual URL editing needed.

### Upstash TLS

Upstash requires TLS. It provides `rediss://` URLs (double 's'). redis-py handles this natively.

### Upgrading from Free Tier

When you outgrow free limits:
1. Render → Railway or Fly.io (better cold starts)
2. Upstash → Upstash Pro or self-hosted Redis
3. Neon → Neon Pro or Supabase
4. Vercel stays (generous free tier)

No code changes needed — everything is configured via environment variables.

For the full rationale, see [ADR 004: Deployment Architecture](adr/004-deployment-architecture.md).

## Cloud Deployment Considerations

### AWS

- **ECS Fargate** for the backend (if you don't want K8s)
- **ElastiCache** (Redis) with cluster mode for high throughput
- **RDS PostgreSQL** with Multi-AZ for durability
- **ALB** as the ingress with WAF in front
- **CloudWatch** for logs, Prometheus for metrics

### GCP

- **Cloud Run** for the backend (scales to zero, great for dev/staging)
- **Memorystore** (Redis)
- **Cloud SQL** (Postgres)
- **Cloud Load Balancing** with Cloud Armor

### General Tips

1. **Redis latency matters.** Put your backend and Redis in the same availability zone. Cross-AZ latency adds 0.5-1ms per call, which is significant when your target is sub-millisecond.

2. **Connection pooling.** Both Redis and Postgres connections should be pooled. The backend does this by default with `asyncpg` pools and `redis-py` connection pools.

3. **Health checks.** The `/health` endpoint checks both Redis and Postgres connectivity. Use it for your load balancer health checks, but set a reasonable timeout (5s) so a slow Postgres query doesn't cascade into container restarts.

4. **Monitoring.** Ship the Prometheus metrics to your monitoring stack. The pre-built Grafana dashboard works anywhere Grafana runs.

5. **Log aggregation.** The backend outputs structured JSON logs (via `structlog`). Ship them to ELK, Loki, CloudWatch, or whatever you use.
