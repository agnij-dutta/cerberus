"use client";

import { CodeBlock } from "@/components/docs/CodeBlock";

export default function QuickstartPage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Quickstart</h1>
        <p className="text-text-secondary text-lg">
          Get Cerberus running locally in under 5 minutes.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-3">Prerequisites</h2>
        <ul className="list-disc list-inside text-sm text-text-secondary space-y-1.5">
          <li>Docker and Docker Compose</li>
          <li>curl or any HTTP client</li>
          <li>About 512MB of free memory for Redis</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">1. Clone the Repository</h2>
        <CodeBlock
          language="bash"
          code={`git clone https://github.com/agnijdutta/cerberus.git
cd cerberus`}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">2. Start the Stack</h2>
        <CodeBlock
          language="bash"
          code={`docker compose up -d`}
        />
        <p className="text-sm text-text-secondary mt-3">
          This starts the API server, Redis, PostgreSQL, and the frontend. Give it
          about 15 seconds for the database migrations to run.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">3. Verify It&apos;s Running</h2>
        <CodeBlock
          language="bash"
          code={`curl http://localhost:8000/healthz

# Expected output:
# {"status":"ok","redis":"connected","postgres":"connected","uptime_seconds":12}`}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">4. Create a Tenant</h2>
        <p className="text-sm text-text-secondary mb-3">
          Use the admin API key (set in <code className="text-cyan">.env</code>) to
          create your first tenant:
        </p>
        <CodeBlock
          language="bash"
          code={`curl -X POST http://localhost:8000/v1/tenants \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: cerberus-admin-dev-key" \\
  -d '{"name": "my-app", "tier": "pro"}'

# Save the api_key from the response — you'll need it.`}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">5. Create a Policy</h2>
        <CodeBlock
          language="bash"
          code={`curl -X POST http://localhost:8000/v1/policies \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_TENANT_API_KEY" \\
  -d '{
    "name": "api-default",
    "algorithm": "sliding_window",
    "limit": 10,
    "window_seconds": 60
  }'`}
        />
        <p className="text-sm text-text-secondary mt-3">
          This creates a policy that allows 10 requests per 60-second window using the
          sliding window algorithm.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">6. Check a Rate Limit</h2>
        <CodeBlock
          language="bash"
          code={`# Run this in a loop to see the counter decrease:
for i in $(seq 1 12); do
  echo "Request $i:"
  curl -s -X POST http://localhost:8000/v1/check \\
    -H "Content-Type: application/json" \\
    -H "X-API-Key: YOUR_TENANT_API_KEY" \\
    -d '{"key": "user:test", "policy": "api-default"}' | python3 -m json.tool
  echo ""
done`}
        />
        <p className="text-sm text-text-secondary mt-3">
          You should see <code className="text-cyan">&quot;allowed&quot;: true</code> for
          the first 10 requests, then <code className="text-red">&quot;allowed&quot;: false</code>{" "}
          for requests 11 and 12, with a <code className="text-cyan">retry_after</code> value
          telling you when the window resets.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">7. Check Metrics</h2>
        <CodeBlock
          language="bash"
          code={`curl http://localhost:8000/metrics | grep cerberus`}
        />
        <p className="text-sm text-text-secondary mt-3">
          You should see Prometheus-formatted metrics for allowed/blocked requests,
          latency histograms, and more.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Next Steps</h2>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li>
            Read the{" "}
            <a href="/docs/api-reference" className="text-cyan hover:underline">
              API Reference
            </a>{" "}
            for the full endpoint documentation
          </li>
          <li>
            Explore the{" "}
            <a href="/docs/architecture" className="text-cyan hover:underline">
              Architecture
            </a>{" "}
            to understand how it all works
          </li>
          <li>
            Try the{" "}
            <a href="/dashboard/playground" className="text-cyan hover:underline">
              API Playground
            </a>{" "}
            in the dashboard for interactive testing
          </li>
          <li>
            Set up{" "}
            <a href="/docs/guides/self-hosting" className="text-cyan hover:underline">
              production deployment
            </a>{" "}
            when you&apos;re ready to go live
          </li>
        </ul>
      </section>
    </article>
  );
}
