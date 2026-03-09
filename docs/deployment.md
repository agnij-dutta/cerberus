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
