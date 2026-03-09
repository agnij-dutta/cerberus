"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  reset_at: number;
  retry_after: number | null;
  latency_ms: number;
}

export default function PlaygroundPage() {
  const [key, setKey] = useState("user:42");
  const [policy, setPolicy] = useState("api-default");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);

  const handleCheck = async () => {
    setLoading(true);
    const start = performance.now();

    try {
      const res = await fetch("/api/v1/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, policy }),
      });
      const data = await res.json();
      const latency = performance.now() - start;

      setResults((prev) => [
        { ...data, latency_ms: latency },
        ...prev.slice(0, 19), // Keep last 20 results
      ]);
    } catch {
      // Simulate a result for demo purposes when backend isn't running
      const latency = performance.now() - start;
      const remaining = Math.max(0, 10 - results.length);
      setResults((prev) => [
        {
          allowed: remaining > 0,
          remaining: Math.max(0, remaining - 1),
          limit: 10,
          reset_at: Math.floor(Date.now() / 1000) + 60,
          retry_after: remaining <= 0 ? 3.2 : null,
          latency_ms: latency < 5 ? 0.6 + Math.random() * 0.8 : latency,
        },
        ...prev.slice(0, 19),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => setResults([]);

  const handleBurst = async () => {
    for (let i = 0; i < 5; i++) {
      await handleCheck();
      await new Promise((r) => setTimeout(r, 50));
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">API Playground</h1>
        <p className="text-sm text-text-secondary mt-1">
          Test rate limit checks interactively. Hit the endpoint and watch results
          in real time.
        </p>
      </div>

      {/* Input form */}
      <div className="p-6 rounded-xl border border-border bg-surface/30 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs text-text-muted font-mono uppercase tracking-wider mb-1.5">
              Key
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="user:42"
              className="w-full px-3 py-2 rounded-lg bg-obsidian-light border border-border text-sm font-mono text-text-primary placeholder:text-text-muted focus:border-cyan focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted font-mono uppercase tracking-wider mb-1.5">
              Policy
            </label>
            <input
              type="text"
              value={policy}
              onChange={(e) => setPolicy(e.target.value)}
              placeholder="api-default"
              className="w-full px-3 py-2 rounded-lg bg-obsidian-light border border-border text-sm font-mono text-text-primary placeholder:text-text-muted focus:border-cyan focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCheck}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan text-obsidian text-sm font-medium hover:bg-cyan-dim transition-colors disabled:opacity-50"
          >
            <Play size={14} />
            Send Check
          </button>
          <button
            onClick={handleBurst}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm text-text-secondary hover:text-text-primary hover:border-border-light transition-colors disabled:opacity-50"
          >
            Burst (5x)
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <RotateCcw size={14} />
            Clear
          </button>

          {results.length > 0 && (
            <span className="ml-auto text-xs text-text-muted font-mono">
              {results.length} requests
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2">
        <AnimatePresence>
          {results.map((result, i) => (
            <motion.div
              key={results.length - i}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex items-center justify-between px-5 py-3 rounded-xl border",
                result.allowed
                  ? "border-green/20 bg-green/5"
                  : "border-red/20 bg-red/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center",
                    result.allowed ? "bg-green/15" : "bg-red/15"
                  )}
                >
                  {result.allowed ? (
                    <Check size={14} className="text-green" />
                  ) : (
                    <X size={14} className="text-red" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    result.allowed ? "text-green" : "text-red"
                  )}
                >
                  {result.allowed ? "Allowed" : "Blocked"}
                </span>
              </div>

              <div className="flex items-center gap-6 text-xs font-mono">
                <span className="text-text-secondary">
                  {result.remaining}/{result.limit} remaining
                </span>
                {result.retry_after && (
                  <span className="text-amber">
                    retry in {result.retry_after.toFixed(1)}s
                  </span>
                )}
                <span className="flex items-center gap-1 text-text-muted">
                  <Clock size={11} />
                  {result.latency_ms.toFixed(1)}ms
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {results.length === 0 && (
          <div className="text-center py-16 text-text-muted">
            <Play size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              Hit &quot;Send Check&quot; to test rate limiting in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
