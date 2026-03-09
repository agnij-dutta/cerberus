"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const codeSnippet = `curl -X POST https://api.cerberus.dev/v1/check \\
  -H "X-API-Key: ck_live_abc123..." \\
  -d '{
    "key": "user:42",
    "policy": "api-default"
  }'

# Response: 0.8ms
{
  "allowed": true,
  "remaining": 97,
  "limit": 100,
  "reset_at": 1710100060
}`;

const stats = [
  { value: "<1ms", label: "p99 latency" },
  { value: "100k+", label: "requests/sec" },
  { value: "99.99%", label: "uptime SLA" },
  { value: "0", label: "race conditions" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-20">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial gradient from center */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
          style={{
            background:
              "radial-gradient(circle, var(--color-cyan-glow) 0%, transparent 70%)",
          }}
        />
        {/* Grid overlay */}
        <div className="absolute inset-0 grid-bg" />
        {/* Top fade */}
        <div
          className="absolute inset-x-0 top-0 h-40"
          style={{
            background:
              "linear-gradient(to bottom, var(--color-obsidian), transparent)",
          }}
        />
        {/* Bottom fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-40"
          style={{
            background:
              "linear-gradient(to top, var(--color-obsidian), transparent)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-surface/50 backdrop-blur-sm text-xs font-mono text-text-secondary mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            v1.0 — Now Generally Available
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
          >
            Guard your gates.
            <br />
            <span className="text-gradient">Rate limit everything.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Cerberus is a distributed rate-limiting service built for
            speed. Sliding window and token bucket algorithms, atomic Lua
            operations, sub-millisecond decisions. Drop it in front of any API.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/docs/guides/quickstart"
              className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan text-obsidian font-semibold text-sm hover:bg-cyan-dim transition-colors"
            >
              Get Started
              <ArrowRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
            <Link
              href="/docs/api-reference"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-text-secondary font-medium text-sm hover:text-text-primary hover:border-border-light hover:bg-surface-hover transition-all"
            >
              API Reference
            </Link>
          </motion.div>
        </div>

        {/* Code demo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          <div className="glow-border rounded-xl overflow-hidden bg-obsidian-light">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red/60" />
                <div className="w-3 h-3 rounded-full bg-amber/60" />
                <div className="w-3 h-3 rounded-full bg-green/60" />
              </div>
              <span className="text-xs text-text-muted font-mono ml-2">
                terminal
              </span>
            </div>
            {/* Code content */}
            <pre className="p-5 overflow-x-auto">
              <code className="text-sm font-mono leading-relaxed">
                {codeSnippet.split("\n").map((line, i) => (
                  <div key={i} className="flex">
                    <span className="select-none text-text-muted w-8 shrink-0 text-right mr-4 text-xs leading-relaxed">
                      {i + 1}
                    </span>
                    <span
                      className={
                        line.startsWith("#")
                          ? "text-text-muted italic"
                          : line.startsWith("curl")
                          ? "text-green"
                          : line.includes('"allowed"')
                          ? "text-cyan"
                          : line.includes('"remaining"') ||
                            line.includes('"limit"') ||
                            line.includes('"reset_at"')
                          ? "text-text-secondary"
                          : "text-text-primary"
                      }
                    >
                      {line}
                    </span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto"
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gradient mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-text-muted font-mono uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
