"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn, formatCompact } from "@/lib/utils";

// Mock data — in production this would come from the analytics API
const stats = [
  {
    label: "Total Requests",
    value: 1_247_832,
    change: 12.3,
    icon: Zap,
  },
  {
    label: "Allowed",
    value: 1_215_440,
    change: 11.8,
    icon: Shield,
  },
  {
    label: "Blocked",
    value: 32_392,
    change: -5.2,
    icon: XCircle,
  },
  {
    label: "Avg Latency",
    value: 0.72,
    unit: "ms",
    change: -8.1,
    icon: Clock,
  },
];

const recentActivity = [
  { key: "user:42", policy: "api-default", result: "allowed", time: "2s ago" },
  { key: "ip:10.0.0.1", policy: "strict", result: "blocked", time: "5s ago" },
  { key: "user:99", policy: "api-default", result: "allowed", time: "8s ago" },
  { key: "user:42", policy: "api-default", result: "allowed", time: "12s ago" },
  { key: "api:upload", policy: "burst", result: "allowed", time: "15s ago" },
  { key: "ip:192.168.1.50", policy: "strict", result: "blocked", time: "18s ago" },
  { key: "user:77", policy: "api-default", result: "allowed", time: "22s ago" },
  { key: "user:42", policy: "api-default", result: "blocked", time: "25s ago" },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-text-secondary mt-1">
          Real-time view of your rate limiting activity.
        </p>
      </div>

      {/* Stats grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const positive = stat.change > 0;

          return (
            <motion.div
              key={i}
              variants={item}
              className="p-5 rounded-xl border border-border bg-surface/30"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-surface-hover flex items-center justify-center">
                  <Icon size={16} className="text-text-secondary" />
                </div>
                <div
                  className={cn(
                    "flex items-center gap-0.5 text-xs font-medium",
                    stat.label === "Blocked"
                      ? positive
                        ? "text-red"
                        : "text-green"
                      : stat.label === "Avg Latency"
                      ? positive
                        ? "text-red"
                        : "text-green"
                      : positive
                      ? "text-green"
                      : "text-red"
                  )}
                >
                  {positive ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {Math.abs(stat.change)}%
                </div>
              </div>
              <div className="text-2xl font-bold">
                {stat.unit
                  ? `${stat.value}${stat.unit}`
                  : formatCompact(stat.value)}
              </div>
              <div className="text-xs text-text-muted mt-1">{stat.label}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Request timeline placeholder */}
      <div className="p-6 rounded-xl border border-border bg-surface/30 mb-8">
        <h3 className="text-sm font-semibold mb-4">Request Volume (24h)</h3>
        <div className="h-48 flex items-end gap-1">
          {Array.from({ length: 48 }, (_, i) => {
            const height = 20 + Math.random() * 80;
            const blocked = Math.random() > 0.85;
            return (
              <div
                key={i}
                className="flex-1 rounded-t transition-all hover:opacity-80"
                style={{
                  height: `${height}%`,
                  backgroundColor: blocked
                    ? "var(--color-red)"
                    : "var(--color-cyan)",
                  opacity: 0.4 + (i / 48) * 0.6,
                }}
                title={`${Math.floor(height * 12)} requests`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-text-muted font-mono">
          <span>24h ago</span>
          <span>12h ago</span>
          <span>Now</span>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-border bg-surface/30 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold">Recent Activity</h3>
        </div>
        <div className="divide-y divide-border">
          {recentActivity.map((event, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    event.result === "allowed" ? "bg-green" : "bg-red"
                  )}
                />
                <code className="font-mono text-xs text-text-primary">
                  {event.key}
                </code>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-text-muted font-mono">
                  {event.policy}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded",
                    event.result === "allowed"
                      ? "text-green bg-green/10"
                      : "text-red bg-red/10"
                  )}
                >
                  {event.result}
                </span>
                <span className="text-xs text-text-muted w-16 text-right">
                  {event.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
