"use client";

import { motion } from "framer-motion";
import { cn, formatCompact } from "@/lib/utils";

// Mock timeline data
const timeline = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  allowed: Math.floor(800 + Math.random() * 1200),
  blocked: Math.floor(10 + Math.random() * 80),
}));

const topKeys = [
  { key: "user:42", count: 12_432, blocked: 342 },
  { key: "user:99", count: 8_921, blocked: 18 },
  { key: "ip:10.0.0.1", count: 6_543, blocked: 890 },
  { key: "api:search", count: 5_211, blocked: 45 },
  { key: "user:77", count: 4_892, blocked: 12 },
  { key: "endpoint:/upload", count: 3_456, blocked: 234 },
  { key: "user:123", count: 2_890, blocked: 8 },
  { key: "ip:192.168.1.50", count: 2_100, blocked: 567 },
];

const maxCount = Math.max(...topKeys.map((k) => k.count));

export default function AnalyticsPage() {
  const totalAllowed = timeline.reduce((s, t) => s + t.allowed, 0);
  const totalBlocked = timeline.reduce((s, t) => s + t.blocked, 0);
  const blockRate = totalBlocked / (totalAllowed + totalBlocked);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">
          Detailed view of rate limiting patterns and usage over the last 24 hours.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-xl border border-border bg-surface/30">
          <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-2">
            Allowed
          </div>
          <div className="text-2xl font-bold text-green">
            {formatCompact(totalAllowed)}
          </div>
        </div>
        <div className="p-5 rounded-xl border border-border bg-surface/30">
          <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-2">
            Blocked
          </div>
          <div className="text-2xl font-bold text-red">
            {formatCompact(totalBlocked)}
          </div>
        </div>
        <div className="p-5 rounded-xl border border-border bg-surface/30">
          <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-2">
            Block Rate
          </div>
          <div className="text-2xl font-bold text-amber">
            {(blockRate * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Timeline chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl border border-border bg-surface/30 mb-8"
      >
        <h3 className="text-sm font-semibold mb-6">Hourly Traffic</h3>
        <div className="h-56 flex items-end gap-1.5">
          {timeline.map((t, i) => {
            const total = t.allowed + t.blocked;
            const maxTotal = Math.max(
              ...timeline.map((x) => x.allowed + x.blocked)
            );
            const height = (total / maxTotal) * 100;
            const blockedPct = (t.blocked / total) * 100;

            return (
              <div
                key={i}
                className="flex-1 flex flex-col justify-end rounded-t overflow-hidden group relative"
                style={{ height: `${height}%` }}
              >
                {/* Blocked portion */}
                <div
                  className="bg-red/70 w-full"
                  style={{ height: `${blockedPct}%`, minHeight: t.blocked > 0 ? 2 : 0 }}
                />
                {/* Allowed portion */}
                <div
                  className="bg-cyan/60 w-full flex-1"
                />
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                  <div className="px-2.5 py-1.5 rounded-lg bg-obsidian border border-border text-xs whitespace-nowrap shadow-lg">
                    <div className="font-mono text-text-muted mb-1">{t.hour}</div>
                    <div className="text-green">{t.allowed} allowed</div>
                    <div className="text-red">{t.blocked} blocked</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-3 text-xs text-text-muted font-mono">
          <span>0:00</span>
          <span>6:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm bg-cyan/60" /> Allowed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm bg-red/70" /> Blocked
          </span>
        </div>
      </motion.div>

      {/* Top keys table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold">Top Rate-Limited Keys</h3>
        </div>
        <div className="divide-y divide-border">
          {topKeys.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-3 hover:bg-surface-hover/30 transition-colors"
            >
              <span className="text-xs text-text-muted w-6 text-right font-mono">
                {i + 1}
              </span>
              <code className="font-mono text-sm text-text-primary flex-1">
                {item.key}
              </code>
              <div className="w-48 h-1.5 rounded-full bg-surface-hover overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan/50"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-sm text-text-secondary w-20 text-right font-mono">
                {formatCompact(item.count)}
              </span>
              <span
                className={cn(
                  "text-xs w-16 text-right font-mono",
                  item.blocked > 100 ? "text-red" : "text-text-muted"
                )}
              >
                {formatCompact(item.blocked)} blocked
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
