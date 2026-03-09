"use client";

import { CodeBlock } from "@/components/docs/CodeBlock";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
  return (
    <article className="prose-custom">
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Cerberus Documentation
      </h1>
      <p className="text-text-secondary text-lg mb-10">
        Everything you need to integrate, deploy, and operate Cerberus.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-12">
        {[
          {
            title: "Quickstart Guide",
            desc: "Get up and running in under 5 minutes with Docker Compose.",
            href: "/docs/guides/quickstart",
          },
          {
            title: "API Reference",
            desc: "Complete endpoint documentation with request/response examples.",
            href: "/docs/api-reference",
          },
          {
            title: "Architecture",
            desc: "Deep dive into the system design, algorithms, and data model.",
            href: "/docs/architecture",
          },
          {
            title: "SDKs",
            desc: "Official client libraries for Python and TypeScript.",
            href: "/docs/sdks",
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group block p-5 rounded-xl border border-border hover:border-border-light bg-surface/30 hover:bg-surface/50 transition-all"
          >
            <h3 className="font-semibold mb-1 group-hover:text-cyan transition-colors">
              {card.title}
            </h3>
            <p className="text-sm text-text-secondary">{card.desc}</p>
            <div className="flex items-center gap-1 text-xs text-text-muted group-hover:text-cyan mt-3 transition-colors">
              Read more <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4 mt-8">What is Cerberus?</h2>
      <p className="text-text-secondary mb-4 leading-relaxed">
        Cerberus is a distributed rate-limiting service designed to sit in front
        of your APIs and determine whether incoming requests should be allowed or
        rejected. It tracks request patterns using Redis and enforces limits
        using either a sliding window or token bucket algorithm — your choice per
        endpoint.
      </p>
      <p className="text-text-secondary mb-6 leading-relaxed">
        The core check operation executes as an atomic Lua script inside Redis,
        which means no race conditions, no distributed locks, and sub-millisecond
        latency. The API layer is stateless, so you can horizontally scale by
        adding more replicas behind a load balancer.
      </p>

      <h2 className="text-xl font-semibold mb-4 mt-8">Quick Example</h2>
      <p className="text-text-secondary mb-4">
        Here&apos;s the simplest way to check a rate limit:
      </p>
      <CodeBlock
        language="bash"
        filename="terminal"
        code={`curl -X POST http://localhost:8000/v1/check \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{
    "key": "user:42",
    "policy": "api-default"
  }'`}
      />

      <p className="text-text-secondary mt-4 mb-4">
        The response tells you whether the request is allowed and how many
        requests remain in the current window:
      </p>
      <CodeBlock
        language="json"
        filename="response.json"
        code={`{
  "allowed": true,
  "remaining": 97,
  "limit": 100,
  "reset_at": 1710100060,
  "retry_after": null
}`}
      />

      <h2 className="text-xl font-semibold mb-4 mt-10">Core Concepts</h2>

      <h3 className="text-base font-semibold mb-2 mt-6">Tenants</h3>
      <p className="text-text-secondary mb-4 leading-relaxed">
        Every API consumer is a <strong>tenant</strong>. Each tenant has a unique
        API key and can define multiple rate limit policies. Tenants are fully
        isolated — one tenant&apos;s traffic never affects another.
      </p>

      <h3 className="text-base font-semibold mb-2 mt-6">Policies</h3>
      <p className="text-text-secondary mb-4 leading-relaxed">
        A <strong>policy</strong> defines the rate limiting rules: algorithm
        type, request limit, time window, and refill rate (for token bucket).
        Policies are created per-tenant and referenced by name in check requests.
      </p>

      <h3 className="text-base font-semibold mb-2 mt-6">Keys</h3>
      <p className="text-text-secondary mb-6 leading-relaxed">
        The <strong>key</strong> in a check request identifies what you&apos;re
        rate limiting. It could be a user ID, IP address, API endpoint, or any
        arbitrary string. Keys are namespaced per tenant and per policy
        automatically.
      </p>

      <div className="mt-10 p-5 rounded-xl border border-cyan/20 bg-cyan-glow/30">
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">Ready to dive in?</strong>{" "}
          Head to the{" "}
          <Link
            href="/docs/guides/quickstart"
            className="text-cyan hover:underline"
          >
            Quickstart Guide
          </Link>{" "}
          to get Cerberus running locally in under 5 minutes.
        </p>
      </div>
    </article>
  );
}
