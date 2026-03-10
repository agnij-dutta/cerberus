"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const terminalLines = [
  { text: "$ curl -X POST https://api.cerberus.dev/v1/check \\", style: "command" },
  { text: '    -H "X-API-Key: cerb_abc123..." \\', style: "flag" },
  { text: '    -d \'{"key": "user:42", "policy": "api-default"}\'', style: "flag" },
  { text: "", style: "blank" },
  { text: "# Response  200 OK  0.4ms", style: "comment" },
  { text: "{", style: "brace" },
  { text: '  "allowed": true,', style: "key-bool" },
  { text: '  "remaining": 97,', style: "key-num" },
  { text: '  "limit": 100,', style: "key-num" },
  { text: '  "reset_at": 1710100060', style: "key-num" },
  { text: "}", style: "brace" },
];

const stats = [
  { value: "<1ms", label: "p99 latency" },
  { value: "100K+", label: "checks/sec" },
  { value: "99.99%", label: "uptime SLA" },
  { value: "0", label: "race conditions" },
];

function TerminalLine({ line }: { line: (typeof terminalLines)[number] }) {
  if (line.style === "blank") return <div className="h-4" />;
  if (line.style === "comment")
    return <span className="text-code-comment italic">{line.text}</span>;
  if (line.style === "command")
    return <span className="text-accent">{line.text}</span>;
  if (line.style === "flag")
    return <span className="text-text-secondary">{line.text}</span>;
  if (line.style === "brace")
    return <span className="text-text-tertiary">{line.text}</span>;

  // Key-value lines with syntax coloring
  const parts = line.text.match(/^(\s*"[^"]+":)\s*(.+)$/);
  if (parts) {
    const isTrue = parts[2].includes("true");
    return (
      <span>
        <span className="text-code-blue">{parts[1]}</span>{" "}
        <span className={isTrue ? "text-accent" : "text-code-orange"}>
          {parts[2]}
        </span>
      </span>
    );
  }
  return <span>{line.text}</span>;
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-14">
      {/* Background */}
      <div className="absolute inset-0 dot-pattern opacity-60" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,229,153,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          {/* Left — Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-default bg-bg-card text-[12px] font-mono text-text-secondary mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Now open source
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1] mb-6"
            >
              Rate limiting
              <br />
              infrastructure
              <br />
              <span className="text-gradient">for modern APIs</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-md mb-8"
            >
              Sub-millisecond rate limit decisions powered by Redis Lua scripts.
              Sliding window, token bucket, multi-tenant isolation.
              Drop it in front of any API.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-wrap items-center gap-3 mb-12"
            >
              <Link
                href="#"
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors"
              >
                Get Started
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="https://github.com/AgnijDutta/cerberus"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border-default text-sm text-text-secondary hover:text-text-primary hover:border-border-bright hover:bg-bg-card transition-all"
              >
                View on GitHub
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex gap-8 sm:gap-10"
            >
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-xl sm:text-2xl font-bold text-gradient">
                    {s.value}
                  </div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-text-tertiary mt-0.5">
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Terminal */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="glow-box rounded-xl overflow-hidden bg-bg-card">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border-default">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-[11px] text-text-tertiary font-mono ml-2">
                  terminal
                </span>
              </div>

              {/* Code */}
              <div className="p-5 overflow-x-auto">
                <pre className="font-mono text-[13px] leading-6">
                  {terminalLines.map((line, i) => (
                    <div key={i}>
                      <TerminalLine line={line} />
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
