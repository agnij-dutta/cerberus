"use client";

import { CodeBlock } from "@/components/docs/CodeBlock";

export default function SelfHostingPage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Self-Hosting Guide</h1>
        <p className="text-text-secondary text-lg">
          Deploy Cerberus on your own infrastructure with Docker Compose or Kubernetes.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-3">Production Docker Compose</h2>
        <p className="text-sm text-text-secondary mb-3">
          The production compose file adds replicas, resource limits, and disables debug features:
        </p>
        <CodeBlock
          language="bash"
          code={`# Copy and configure environment
cp .env.example .env
# Edit .env — set a strong CERBERUS_ADMIN_API_KEY

# Start with production overrides
docker compose -f infra/docker-compose.yml -f infra/docker-compose.prod.yml up -d

# Run database migrations
docker compose exec backend alembic upgrade head

# Seed initial data (optional)
./infra/scripts/seed-data.sh`}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Environment Variables</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-surface text-left">
                <th className="px-4 py-2.5 font-medium text-text-secondary border-b border-border">Variable</th>
                <th className="px-4 py-2.5 font-medium text-text-secondary border-b border-border">Default</th>
                <th className="px-4 py-2.5 font-medium text-text-secondary border-b border-border">Description</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              {[
                ["CERBERUS_REDIS_URL", "redis://localhost:6379/0", "Redis connection URL"],
                ["CERBERUS_DATABASE_URL", "(required)", "PostgreSQL async connection string"],
                ["CERBERUS_ADMIN_API_KEY", "(required)", "Admin API key for tenant management"],
                ["CERBERUS_WORKERS", "4", "Number of Uvicorn worker processes"],
                ["CERBERUS_LOG_LEVEL", "info", "Log level (debug, info, warning, error)"],
                ["CERBERUS_REDIS_POOL_SIZE", "20", "Max Redis connections per worker"],
                ["CERBERUS_POLICY_CACHE_TTL", "30", "Policy cache TTL in seconds"],
                ["CERBERUS_METRICS_ENABLED", "true", "Enable Prometheus metrics endpoint"],
              ].map(([name, def, desc]) => (
                <tr key={name} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2.5 font-mono text-cyan text-xs">{name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{def}</td>
                  <td className="px-4 py-2.5">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Redis Configuration</h2>
        <p className="text-sm text-text-secondary mb-3">
          For production, we recommend these Redis settings:
        </p>
        <CodeBlock
          language="text"
          filename="redis.conf"
          code={`maxmemory 512mb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
tcp-keepalive 60`}
        />
        <p className="text-sm text-text-secondary mt-3">
          The <code className="text-cyan">allkeys-lru</code> eviction policy is deliberate:
          if Redis runs out of memory, evicting old rate limit keys effectively resets those
          counters (fails open), which is the correct failure mode.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Scaling</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          The API layer is stateless — scale horizontally by increasing the replica count.
          With the production compose file, set <code className="text-cyan">replicas: N</code>{" "}
          for the backend service. All replicas share the same Redis instance for rate
          limiting state and use pub/sub for cache invalidation.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">TLS / mTLS</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          TLS termination is handled at the nginx reverse proxy layer. For mTLS (mutual TLS),
          configure <code className="text-cyan">ssl_verify_client on</code> in the nginx config.
          Internal traffic between nginx and the backend runs over plaintext within the Docker
          network.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Health Checks</h2>
        <p className="text-sm text-text-secondary mb-3">
          Configure your load balancer to check these endpoints:
        </p>
        <ul className="list-disc list-inside text-sm text-text-secondary space-y-1.5">
          <li>
            <code className="text-cyan">GET /healthz</code> — Liveness probe.
            Returns 200 if the process is alive.
          </li>
          <li>
            <code className="text-cyan">GET /readyz</code> — Readiness probe.
            Returns 200 only if Redis and Postgres are reachable.
          </li>
        </ul>
      </section>
    </article>
  );
}
