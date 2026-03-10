"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    id: "python",
    label: "Python",
    lines: [
      { tokens: [{ text: "from", c: "kw" }, { text: " cerberus ", c: "t" }, { text: "import", c: "kw" }, { text: " CerberusClient", c: "t" }] },
      { tokens: [] },
      { tokens: [{ text: "client = CerberusClient(", c: "t" }] },
      { tokens: [{ text: '    base_url=', c: "t" }, { text: '"https://api.cerberus.dev"', c: "str" }, { text: ",", c: "t" }] },
      { tokens: [{ text: '    api_key=', c: "t" }, { text: '"cerb_live_abc123..."', c: "str" }] },
      { tokens: [{ text: ")", c: "t" }] },
      { tokens: [] },
      { tokens: [{ text: "# Check if request should be allowed", c: "cmt" }] },
      { tokens: [{ text: "result = client.check(", c: "t" }] },
      { tokens: [{ text: '    key=', c: "t" }, { text: '"user:42"', c: "str" }, { text: ",", c: "t" }] },
      { tokens: [{ text: '    policy=', c: "t" }, { text: '"api-default"', c: "str" }] },
      { tokens: [{ text: ")", c: "t" }] },
      { tokens: [] },
      { tokens: [{ text: "if ", c: "kw" }, { text: "not ", c: "kw" }, { text: "result.allowed:", c: "t" }] },
      { tokens: [{ text: "    raise ", c: "kw" }, { text: "RateLimitExceeded(", c: "t" }] },
      { tokens: [{ text: "        retry_after=result.retry_after", c: "t" }] },
      { tokens: [{ text: "    )", c: "t" }] },
    ],
  },
  {
    id: "typescript",
    label: "TypeScript",
    lines: [
      { tokens: [{ text: "import", c: "kw" }, { text: " { Cerberus } ", c: "t" }, { text: "from", c: "kw" }, { text: " ", c: "t" }, { text: "'@cerberus/sdk'", c: "str" }] },
      { tokens: [] },
      { tokens: [{ text: "const ", c: "kw" }, { text: "cerberus = ", c: "t" }, { text: "new ", c: "kw" }, { text: "Cerberus({", c: "t" }] },
      { tokens: [{ text: "  baseUrl: ", c: "t" }, { text: "'https://api.cerberus.dev'", c: "str" }, { text: ",", c: "t" }] },
      { tokens: [{ text: "  apiKey: ", c: "t" }, { text: "'cerb_live_abc123...'", c: "str" }] },
      { tokens: [{ text: "})", c: "t" }] },
      { tokens: [] },
      { tokens: [{ text: "// Check if request should be allowed", c: "cmt" }] },
      { tokens: [{ text: "const ", c: "kw" }, { text: "result = ", c: "t" }, { text: "await ", c: "kw" }, { text: "cerberus.check({", c: "t" }] },
      { tokens: [{ text: "  key: ", c: "t" }, { text: "'user:42'", c: "str" }, { text: ",", c: "t" }] },
      { tokens: [{ text: "  policy: ", c: "t" }, { text: "'api-default'", c: "str" }] },
      { tokens: [{ text: "})", c: "t" }] },
      { tokens: [] },
      { tokens: [{ text: "if ", c: "kw" }, { text: "(!result.allowed) {", c: "t" }] },
      { tokens: [{ text: "  throw ", c: "kw" }, { text: "new ", c: "kw" }, { text: "RateLimitError(result.retryAfter)", c: "t" }] },
      { tokens: [{ text: "}", c: "t" }] },
    ],
  },
  {
    id: "curl",
    label: "cURL",
    lines: [
      { tokens: [{ text: "# Check rate limit for a specific key", c: "cmt" }] },
      { tokens: [{ text: "curl", c: "kw" }, { text: " -X POST https://api.cerberus.dev/v1/check \\", c: "t" }] },
      { tokens: [{ text: '  -H ', c: "t" }, { text: '"Content-Type: application/json"', c: "str" }, { text: " \\", c: "t" }] },
      { tokens: [{ text: '  -H ', c: "t" }, { text: '"X-API-Key: cerb_live_abc123..."', c: "str" }, { text: " \\", c: "t" }] },
      { tokens: [{ text: "  -d ", c: "t" }, { text: "'{", c: "str" }] },
      { tokens: [{ text: '    "key": "user:42",', c: "str" }] },
      { tokens: [{ text: '    "policy": "api-default"', c: "str" }] },
      { tokens: [{ text: "  }'", c: "str" }] },
      { tokens: [] },
      { tokens: [{ text: "# Response", c: "cmt" }] },
      { tokens: [{ text: "{", c: "t" }] },
      { tokens: [{ text: '  "allowed": ', c: "t" }, { text: "true", c: "kw" }, { text: ",", c: "t" }] },
      { tokens: [{ text: '  "remaining": ', c: "t" }, { text: "97", c: "num" }, { text: ",", c: "t" }] },
      { tokens: [{ text: '  "limit": ', c: "t" }, { text: "100", c: "num" }, { text: ",", c: "t" }] },
      { tokens: [{ text: '  "reset_at": ', c: "t" }, { text: "1710100060", c: "num" }] },
      { tokens: [{ text: "}", c: "t" }] },
    ],
  },
];

const colorMap: Record<string, string> = {
  kw: "text-code-red",
  str: "text-code-green",
  cmt: "text-code-comment italic",
  num: "text-code-orange",
  t: "text-text-primary",
};

export function CodeDemo() {
  const [activeTab, setActiveTab] = useState("python");
  const [copied, setCopied] = useState(false);
  const active = tabs.find((t) => t.id === activeTab)!;

  const plainText = active.lines
    .map((l) => l.tokens.map((t) => t.text).join(""))
    .join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative py-24 sm:py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent mb-4"
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
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-text-secondary text-[15px]"
          >
            Drop in the SDK, configure a policy, and you&apos;re done. Cerberus handles the rest.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glow-box rounded-xl overflow-hidden bg-bg-card"
        >
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-border-default">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative px-5 py-3 text-[13px] font-medium transition-colors",
                    activeTab === tab.id
                      ? "text-accent"
                      : "text-text-tertiary hover:text-text-secondary"
                  )}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="code-tab-indicator"
                      className="absolute inset-x-0 bottom-0 h-px bg-accent"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={handleCopy}
              className="mr-4 p-1.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-bg-card-hover transition-colors"
              title="Copy code"
            >
              {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
            </button>
          </div>

          {/* Code */}
          <div className="p-5 min-h-[340px] overflow-x-auto">
            <AnimatePresence mode="wait">
              <motion.pre
                key={activeTab}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.12 }}
                className="font-mono text-[13px] leading-6"
              >
                {active.lines.map((line, i) => (
                  <div key={i} className="flex">
                    <span className="select-none text-text-tertiary/40 w-7 shrink-0 text-right mr-4 text-xs tabular-nums leading-6">
                      {i + 1}
                    </span>
                    <span>
                      {line.tokens.map((token, j) => (
                        <span key={j} className={colorMap[token.c] || ""}>
                          {token.text}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </motion.pre>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
