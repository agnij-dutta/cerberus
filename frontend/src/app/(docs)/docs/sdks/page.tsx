"use client";

import { CodeBlock } from "@/components/docs/CodeBlock";

export default function SdksPage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">SDKs</h1>
        <p className="text-text-secondary text-lg">
          Official client libraries for Python and TypeScript.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Python SDK</h2>
        <CodeBlock
          language="bash"
          code={`pip install cerberus-ratelimit`}
        />
        <div className="mt-4">
          <CodeBlock
            language="python"
            filename="example.py"
            code={`from cerberus import CerberusClient

client = CerberusClient(
    base_url="https://api.cerberus.dev",
    api_key="ck_live_abc123..."
)

# Check a rate limit
result = client.check(key="user:42", policy="api-default")

if result.allowed:
    print(f"Allowed. {result.remaining} requests remaining.")
else:
    print(f"Blocked. Retry after {result.retry_after}s.")

# Manage policies
policy = client.create_policy(
    name="strict",
    algorithm="sliding_window",
    limit=10,
    window_seconds=60,
)

# Async support
import asyncio
from cerberus import AsyncCerberusClient

async def main():
    async_client = AsyncCerberusClient(
        base_url="https://api.cerberus.dev",
        api_key="ck_live_abc123..."
    )
    result = await async_client.check(key="user:42", policy="api-default")
    print(result.allowed)

asyncio.run(main())`}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">TypeScript SDK</h2>
        <CodeBlock
          language="bash"
          code={`npm install @cerberus/sdk`}
        />
        <div className="mt-4">
          <CodeBlock
            language="typescript"
            filename="example.ts"
            code={`import { Cerberus } from '@cerberus/sdk';

const cerberus = new Cerberus({
  baseUrl: 'https://api.cerberus.dev',
  apiKey: 'ck_live_abc123...',
});

// Check a rate limit
const result = await cerberus.check({
  key: 'user:42',
  policy: 'api-default',
});

if (result.allowed) {
  console.log(\`Allowed. \${result.remaining} remaining.\`);
} else {
  console.log(\`Blocked. Retry after \${result.retryAfter}s.\`);
}

// Express middleware
import { cerberusMiddleware } from '@cerberus/sdk/express';

app.use(cerberusMiddleware({
  client: cerberus,
  keyExtractor: (req) => req.ip,
  policy: 'api-default',
}));`}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Direct HTTP</h2>
        <p className="text-sm text-text-secondary mb-3">
          Don&apos;t want to use an SDK? The API is a simple REST endpoint. Here&apos;s
          all you need:
        </p>
        <CodeBlock
          language="bash"
          code={`curl -X POST https://api.cerberus.dev/v1/check \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ck_live_abc123..." \\
  -d '{"key": "user:42", "policy": "api-default"}'`}
        />
      </section>
    </article>
  );
}
