"use client";

import { motion } from "framer-motion";
import { Copy, Check, ArrowRight, ExternalLink } from "lucide-react";
import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute top-3 right-3 p-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-border-default text-text-tertiary hover:text-text-secondary transition-all"
    >
      {copied ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
    </button>
  );
}

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  return (
    <div className="relative group rounded-xl overflow-hidden border border-border-default bg-[#0a0a0a] my-5">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-subtle">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
        </div>
        <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider ml-2">{lang}</span>
      </div>
      <CopyButton text={code} />
      <pre className="p-4 overflow-x-auto font-mono text-[13px] leading-[1.8] text-text-secondary">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Heading({ id, children, level = 2 }: { id: string; children: React.ReactNode; level?: number }) {
  const sizes: Record<number, string> = {
    1: "text-3xl sm:text-4xl font-bold tracking-[-0.03em] mb-4",
    2: "text-2xl sm:text-[1.75rem] font-bold tracking-[-0.02em] mb-4 mt-16 pt-8 border-t border-border-subtle",
    3: "text-lg sm:text-xl font-semibold tracking-[-0.01em] mb-3 mt-10",
  };
  const className = sizes[level] || sizes[2];
  const inner = (
    <a href={`#${id}`} className="group">
      {children}
      <span className="ml-2 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">#</span>
    </a>
  );
  if (level === 1) return <h1 id={id} className={className}>{inner}</h1>;
  if (level === 3) return <h3 id={id} className={className}>{inner}</h3>;
  return <h2 id={id} className={className}>{inner}</h2>;
}

function Callout({ type = "info", children }: { type?: "info" | "warning" | "tip"; children: React.ReactNode }) {
  const styles = {
    info: "border-code-blue/20 bg-code-blue/[0.04]",
    warning: "border-amber/20 bg-amber/[0.04]",
    tip: "border-accent/20 bg-accent/[0.04]",
  };
  const labels = { info: "Note", warning: "Warning", tip: "Tip" };
  const dots = { info: "bg-code-blue", warning: "bg-amber", tip: "bg-accent" };

  return (
    <div className={`rounded-xl border ${styles[type]} px-5 py-4 my-5`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-1.5 h-1.5 rounded-full ${dots[type]}`} />
        <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-text-tertiary">{labels[type]}</span>
      </div>
      <div className="text-[14px] text-text-secondary leading-relaxed">{children}</div>
    </div>
  );
}

function ParamTable({ params }: { params: { name: string; type: string; desc: string; required?: boolean }[] }) {
  return (
    <div className="rounded-xl border border-border-default overflow-hidden my-5">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border-default bg-white/[0.02]">
            <th className="text-left px-4 py-2.5 font-mono text-text-tertiary text-[11px] uppercase tracking-wider">Parameter</th>
            <th className="text-left px-4 py-2.5 font-mono text-text-tertiary text-[11px] uppercase tracking-wider">Type</th>
            <th className="text-left px-4 py-2.5 font-mono text-text-tertiary text-[11px] uppercase tracking-wider">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-border-subtle last:border-0">
              <td className="px-4 py-3 font-mono">
                <code className="text-accent">{p.name}</code>
                {p.required && <span className="ml-1.5 text-[9px] text-red font-mono uppercase">required</span>}
              </td>
              <td className="px-4 py-3 font-mono text-code-purple">{p.type}</td>
              <td className="px-4 py-3 text-text-secondary">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DocsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="docs-content"
    >
      {/* Page header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[11px] font-mono text-text-secondary mb-5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Documentation
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.03em] leading-[1.1] mb-5">
          <span className="text-gradient-white">Cerberus</span>{" "}
          <span className="text-gradient">Docs</span>
        </h1>
        <p className="text-text-secondary text-[16px] leading-relaxed max-w-2xl">
          Everything you need to add production-grade rate limiting to your APIs.
          Sub-millisecond enforcement powered by atomic Redis Lua scripts.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
        {[
          { label: "5-min Quickstart", href: "#quickstart", desc: "Get running in minutes" },
          { label: "API Reference", href: "#check-endpoint", desc: "Endpoints & params" },
          { label: "Python SDK", href: "#installation", desc: "pip install cerberus-sdk" },
        ].map((card) => (
          <a
            key={card.label}
            href={card.href}
            className="group p-4 rounded-xl glass hover:bg-white/[0.06] transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] font-medium text-text-primary group-hover:text-accent transition-colors">
                {card.label}
              </span>
              <ArrowRight size={13} className="text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[12px] text-text-tertiary">{card.desc}</p>
          </a>
        ))}
      </div>

      {/* === INTRODUCTION === */}
      <Heading id="introduction" level={2}>Introduction</Heading>
      <p className="text-text-secondary text-[15px] leading-[1.8] mb-4">
        Cerberus is an open-source, Redis-backed rate limiting service designed
        for modern API infrastructure. It provides sub-millisecond decision
        latency using atomic Lua scripts, supports multiple algorithms (sliding
        window and token bucket), and offers full multi-tenant isolation.
      </p>
      <p className="text-text-secondary text-[15px] leading-[1.8] mb-4">
        Deploy it as a sidecar, standalone service, or use the managed cloud
        version. Cerberus handles the complexity of distributed rate limiting so
        you can focus on your product.
      </p>

      <Callout type="tip">
        Cerberus is fully open source under the MIT license. Self-host it on your own
        infrastructure with zero limitations.
      </Callout>

      {/* === QUICKSTART === */}
      <Heading id="quickstart" level={2}>Quickstart</Heading>
      <p className="text-text-secondary text-[15px] leading-[1.8] mb-4">
        Get Cerberus running locally in under 5 minutes with Docker.
      </p>

      <Heading id="quickstart-docker" level={3}>1. Start with Docker Compose</Heading>
      <CodeBlock
        lang="bash"
        code={`git clone https://github.com/AgnijDutta/cerberus.git
cd cerberus
docker compose up -d`}
      />

      <Heading id="quickstart-create-tenant" level={3}>2. Create a Tenant</Heading>
      <CodeBlock
        lang="bash"
        code={`curl -X POST http://localhost:8000/v1/tenants \\
  -H "X-Admin-Key: your-admin-key" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "my-app"}'

# Response:
# { "id": "...", "name": "my-app", "api_key": "cerb_abc123..." }`}
      />

      <Callout type="warning">
        Save the <code className="font-mono text-accent">api_key</code> returned — it&apos;s only shown once.
        The key is hashed with SHA-256 and cannot be recovered.
      </Callout>

      <Heading id="quickstart-create-policy" level={3}>3. Create a Rate Limit Policy</Heading>
      <CodeBlock
        lang="bash"
        code={`curl -X POST http://localhost:8000/v1/policies \\
  -H "X-API-Key: cerb_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "api-default",
    "algorithm": "sliding_window",
    "limit": 100,
    "window_seconds": 60
  }'`}
      />

      <Heading id="quickstart-check" level={3}>4. Check a Request</Heading>
      <CodeBlock
        lang="bash"
        code={`curl -X POST http://localhost:8000/v1/check \\
  -H "X-API-Key: cerb_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{"key": "user:42", "policy": "api-default"}'

# Response:
# {
#   "allowed": true,
#   "remaining": 99,
#   "limit": 100,
#   "reset_at": 1710100060
# }`}
      />

      {/* === INSTALLATION === */}
      <Heading id="installation" level={2}>Installation</Heading>

      <Heading id="install-python" level={3}>Python SDK</Heading>
      <CodeBlock lang="bash" code="pip install cerberus-sdk" />
      <CodeBlock
        lang="python"
        code={`from cerberus import CerberusClient

client = CerberusClient(
    base_url="http://localhost:8000",
    api_key="cerb_abc123..."
)

# Check rate limit
result = client.check("user:42", "api-default")
if result.allowed:
    # Process request
    print(f"Remaining: {result.remaining}/{result.limit}")
else:
    # Rate limited — back off
    print(f"Retry after: {result.reset_at}")`}
      />

      <Heading id="install-typescript" level={3}>TypeScript SDK</Heading>
      <CodeBlock lang="bash" code="npm install @cerberus/sdk" />
      <CodeBlock
        lang="typescript"
        code={`import { Cerberus } from "@cerberus/sdk";

const cerberus = new Cerberus({
  baseUrl: "http://localhost:8000",
  apiKey: "cerb_abc123...",
});

const result = await cerberus.check("user:42", "api-default");

if (result.allowed) {
  console.log(\`Remaining: \${result.remaining}/\${result.limit}\`);
} else {
  console.log(\`Rate limited. Reset at: \${result.resetAt}\`);
}`}
      />

      {/* === RATE LIMITING === */}
      <Heading id="rate-limiting" level={2}>Rate Limiting</Heading>
      <p className="text-text-secondary text-[15px] leading-[1.8] mb-4">
        Cerberus enforces rate limits using atomic Redis Lua scripts — no race
        conditions, no distributed locks, no approximations. Every decision
        completes in a single Redis round-trip.
      </p>
      <p className="text-text-secondary text-[15px] leading-[1.8] mb-4">
        Each check is identified by a composite key (e.g., <code className="font-mono text-accent text-[13px] px-1.5 py-0.5 rounded bg-accent/[0.06]">user:42</code>)
        and evaluated against a named policy. The response tells you whether the
        request is allowed and how many requests remain in the window.
      </p>

      {/* === POLICIES === */}
      <Heading id="policies" level={2}>Policies</Heading>
      <p className="text-text-secondary text-[15px] leading-[1.8] mb-4">
        Policies define the rules for rate limiting. Each policy specifies an
        algorithm, a request limit, and a time window. Policies are scoped to
        your tenant — no cross-tenant leakage.
      </p>
      <CodeBlock
        lang="json"
        code={`{
  "name": "api-default",
  "algorithm": "sliding_window",
  "limit": 100,
  "window_seconds": 60
}

// Token bucket example:
{
  "name": "burst-friendly",
  "algorithm": "token_bucket",
  "limit": 50,
  "window_seconds": 1,
  "burst_limit": 10
}`}
      />

      {/* === ALGORITHMS === */}
      <Heading id="algorithms" level={2}>Algorithms</Heading>

      <Heading id="algo-sliding" level={3}>Sliding Window</Heading>
      <p className="text-text-secondary text-[15px] leading-[1.8] mb-4">
        The sliding window algorithm tracks requests across a rolling time
        window, providing smooth rate limiting without the &quot;burst at boundary&quot;
        problem of fixed windows. Cerberus implements this with a single Redis
        sorted set and an atomic Lua script.
      </p>
      <div className="rounded-xl border border-border-default bg-white/[0.02] p-5 my-5">
        <div className="grid grid-cols-2 gap-4 text-[13px]">
          <div>
            <p className="font-mono text-text-tertiary text-[11px] uppercase tracking-wider mb-1">Best for</p>
            <p className="text-text-secondary">APIs with steady traffic patterns</p>
          </div>
          <div>
            <p className="font-mono text-text-tertiary text-[11px] uppercase tracking-wider mb-1">Complexity</p>
            <p className="text-text-secondary">O(log N) per check</p>
          </div>
          <div>
            <p className="font-mono text-text-tertiary text-[11px] uppercase tracking-wider mb-1">Redis Structure</p>
            <p className="text-text-secondary">Sorted set (ZRANGEBYSCORE)</p>
          </div>
          <div>
            <p className="font-mono text-text-tertiary text-[11px] uppercase tracking-wider mb-1">Boundary Issues</p>
            <p className="text-accent font-medium">None</p>
          </div>
        </div>
      </div>

      <Heading id="algo-token" level={3}>Token Bucket</Heading>
      <p className="text-text-secondary text-[15px] leading-[1.8] mb-4">
        The token bucket algorithm allows controlled bursting. Tokens refill at
        a constant rate, and each request consumes one token. If the bucket is
        empty, the request is denied. The <code className="font-mono text-accent text-[13px] px-1.5 py-0.5 rounded bg-accent/[0.06]">burst_limit</code> parameter
        controls the maximum bucket size.
      </p>
      <div className="rounded-xl border border-border-default bg-white/[0.02] p-5 my-5">
        <div className="grid grid-cols-2 gap-4 text-[13px]">
          <div>
            <p className="font-mono text-text-tertiary text-[11px] uppercase tracking-wider mb-1">Best for</p>
            <p className="text-text-secondary">APIs allowing bursts (webhooks, uploads)</p>
          </div>
          <div>
            <p className="font-mono text-text-tertiary text-[11px] uppercase tracking-wider mb-1">Complexity</p>
            <p className="text-text-secondary">O(1) per check</p>
          </div>
          <div>
            <p className="font-mono text-text-tertiary text-[11px] uppercase tracking-wider mb-1">Redis Structure</p>
            <p className="text-text-secondary">Hash (HMSET)</p>
          </div>
          <div>
            <p className="font-mono text-text-tertiary text-[11px] uppercase tracking-wider mb-1">Burst Support</p>
            <p className="text-accent font-medium">Yes — configurable</p>
          </div>
        </div>
      </div>

      {/* === AUTHENTICATION === */}
      <Heading id="authentication" level={2}>Authentication</Heading>
      <p className="text-text-secondary text-[15px] leading-[1.8] mb-4">
        All API requests require a valid API key passed in the{" "}
        <code className="font-mono text-accent text-[13px] px-1.5 py-0.5 rounded bg-accent/[0.06]">X-API-Key</code> header.
        Keys are prefixed with <code className="font-mono text-code-purple text-[13px] px-1.5 py-0.5 rounded bg-code-purple/[0.06]">cerb_</code> for
        easy identification.
      </p>
      <CodeBlock
        lang="bash"
        code={`# All requests must include your API key:
curl -H "X-API-Key: cerb_abc123..." \\
  http://localhost:8000/v1/check`}
      />

      <Callout type="info">
        API keys are hashed with SHA-256 before storage. Cerberus uses a prefix-based
        lookup (first 8 characters) for fast key resolution, then verifies the full hash.
      </Callout>

      {/* === CHECK ENDPOINT === */}
      <Heading id="check-endpoint" level={2}>Check Endpoint</Heading>
      <p className="text-text-secondary text-[15px] leading-[1.8] mb-4">
        The core endpoint. Call it before processing any request to determine
        whether it should be allowed or rate-limited.
      </p>

      <div className="flex items-center gap-3 my-5 px-4 py-3 rounded-xl bg-white/[0.02] border border-border-default font-mono text-[14px]">
        <span className="px-2 py-0.5 rounded bg-accent/15 text-accent text-[12px] font-bold">POST</span>
        <span className="text-text-primary">/v1/check</span>
      </div>

      <Heading id="check-request" level={3}>Request Body</Heading>
      <ParamTable
        params={[
          { name: "key", type: "string", desc: "Unique identifier for the rate limit subject (e.g., user ID, IP)", required: true },
          { name: "policy", type: "string", desc: "Name of the rate limit policy to evaluate against", required: true },
          { name: "cost", type: "integer", desc: "Number of tokens to consume (default: 1)" },
        ]}
      />

      <Heading id="check-response" level={3}>Response</Heading>
      <ParamTable
        params={[
          { name: "allowed", type: "boolean", desc: "Whether the request should be allowed" },
          { name: "remaining", type: "integer", desc: "Number of requests remaining in the current window" },
          { name: "limit", type: "integer", desc: "Total requests allowed per window" },
          { name: "reset_at", type: "integer", desc: "Unix timestamp when the window resets" },
        ]}
      />

      <CodeBlock
        lang="json"
        code={`// 200 OK — Allowed
{
  "allowed": true,
  "remaining": 97,
  "limit": 100,
  "reset_at": 1710100060
}

// 200 OK — Rate Limited
{
  "allowed": false,
  "remaining": 0,
  "limit": 100,
  "reset_at": 1710100060
}`}
      />

      <Callout type="tip">
        The check endpoint always returns <code className="font-mono text-accent">200 OK</code>. It&apos;s your
        application&apos;s responsibility to act on the <code className="font-mono text-accent">allowed</code> field.
        Return <code className="font-mono text-code-purple">429 Too Many Requests</code> to your clients when
        <code className="font-mono text-accent"> allowed</code> is <code className="font-mono text-code-orange">false</code>.
      </Callout>

      {/* === ANALYTICS === */}
      <Heading id="analytics" level={2}>Analytics</Heading>
      <p className="text-text-secondary text-[15px] leading-[1.8] mb-4">
        Cerberus tracks request metrics per tenant. Query the analytics endpoint
        to get insights into your rate limiting traffic.
      </p>

      <div className="flex items-center gap-3 my-5 px-4 py-3 rounded-xl bg-white/[0.02] border border-border-default font-mono text-[14px]">
        <span className="px-2 py-0.5 rounded bg-code-blue/15 text-code-blue text-[12px] font-bold">GET</span>
        <span className="text-text-primary">/v1/analytics</span>
      </div>

      <CodeBlock
        lang="json"
        code={`{
  "total_checks": 1542893,
  "allowed": 1498210,
  "denied": 44683,
  "denial_rate": 0.029,
  "p99_latency_ms": 0.8,
  "policies": {
    "api-default": { "checks": 982100, "denied": 31200 },
    "auth-strict": { "checks": 560793, "denied": 13483 }
  }
}`}
      />

      {/* Bottom nav */}
      <div className="mt-20 pt-8 border-t border-border-subtle flex items-center justify-between">
        <div />
        <a
          href="https://github.com/AgnijDutta/cerberus"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 text-[14px] text-text-secondary hover:text-accent transition-colors"
        >
          Edit on GitHub
          <ExternalLink size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </motion.div>
  );
}
