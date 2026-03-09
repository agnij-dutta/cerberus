"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const tabs = [
  {
    id: "python",
    label: "Python",
    code: `from cerberus import CerberusClient

client = CerberusClient(
    base_url="https://api.cerberus.dev",
    api_key="ck_live_abc123..."
)

# Check if request should be allowed
result = client.check(
    key="user:42",
    policy="api-default"
)

if result.allowed:
    process_request()
else:
    raise RateLimitExceeded(
        retry_after=result.retry_after
    )`,
  },
  {
    id: "typescript",
    label: "TypeScript",
    code: `import { Cerberus } from '@cerberus/sdk';

const cerberus = new Cerberus({
  baseUrl: 'https://api.cerberus.dev',
  apiKey: 'ck_live_abc123...'
});

// Check if request should be allowed
const result = await cerberus.check({
  key: 'user:42',
  policy: 'api-default'
});

if (result.allowed) {
  await processRequest();
} else {
  throw new RateLimitError(
    result.retry_after
  );
}`,
  },
  {
    id: "curl",
    label: "cURL",
    code: `# Check rate limit for a specific key
curl -X POST https://api.cerberus.dev/v1/check \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ck_live_abc123..." \\
  -d '{
    "key": "user:42",
    "policy": "api-default"
  }'

# Response
{
  "allowed": true,
  "remaining": 97,
  "limit": 100,
  "reset_at": 1710100060,
  "retry_after": null
}`,
  },
];

function highlightCode(code: string, lang: string) {
  // Simple syntax highlighting — good enough for demo, no heavy deps
  return code.split("\n").map((line, i) => {
    let highlighted = line;

    // Comments
    if (line.trimStart().startsWith("#") || line.trimStart().startsWith("//")) {
      return (
        <span key={i} className="text-text-muted italic">
          {line}
        </span>
      );
    }

    // Strings
    highlighted = line;

    return (
      <span key={i}>
        {line.split(/(["'`].*?["'`])/).map((part, j) => {
          if (/^["'`]/.test(part)) {
            return (
              <span key={j} className="text-green">
                {part}
              </span>
            );
          }
          // Keywords
          const withKeywords = part.split(
            /\b(import|from|const|let|await|async|if|else|raise|throw|new|return|def|class)\b/
          );
          return withKeywords.map((kw, k) => {
            if (
              /^(import|from|const|let|await|async|if|else|raise|throw|new|return|def|class)$/.test(
                kw
              )
            ) {
              return (
                <span key={k} className="text-cyan">
                  {kw}
                </span>
              );
            }
            return <span key={k}>{kw}</span>;
          });
        })}
      </span>
    );
  });
}

export function CodeDemo() {
  const [activeTab, setActiveTab] = useState("python");
  const activeCode = tabs.find((t) => t.id === activeTab)!;

  return (
    <section className="relative py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-mono uppercase tracking-widest text-cyan mb-4"
          >
            Integration
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          >
            Three lines to protect any API
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-text-secondary max-w-lg mx-auto"
          >
            Drop in the SDK, configure a policy, and you&apos;re done. Cerberus
            handles the rest.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glow-border rounded-xl overflow-hidden bg-obsidian-light"
        >
          {/* Tab bar */}
          <div className="flex items-center border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative px-5 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "text-cyan"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="code-tab"
                    className="absolute inset-x-0 bottom-0 h-px bg-cyan"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Code */}
          <div className="p-5 min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.pre
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="overflow-x-auto"
              >
                <code className="text-sm font-mono leading-relaxed">
                  {highlightCode(activeCode.code, activeCode.id).map(
                    (line, i) => (
                      <div key={i} className="flex">
                        <span className="select-none text-text-muted/50 w-8 shrink-0 text-right mr-4 text-xs">
                          {i + 1}
                        </span>
                        {line}
                      </div>
                    )
                  )}
                </code>
              </motion.pre>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
