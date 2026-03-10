"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  ShieldCheck,
  ShieldX,
  Percent,
  Plus,
  BookOpen,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { api } from "@/lib/api";
import type { AnalyticsResponse, PolicyListResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn, formatCompact } from "@/lib/utils";

// ---------------------------------------------------------------------------
// SVG Sparkline
// ---------------------------------------------------------------------------

function Sparkline({
  data,
  color = "#00e599",
  height = 40,
  width = 120,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const gradientId = `sparkline-${color.replace("#", "")}`;

  // Build area path for gradient fill
  const firstX = padding;
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2);
  const areaPoints = `${firstX},${height} ${points} ${lastX},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-20 bg-white/[0.06] rounded" />
        <div className="h-4 w-4 bg-white/[0.04] rounded" />
      </div>
      <div className="h-8 w-24 bg-white/[0.06] rounded mt-1" />
      <div className="h-6 w-full bg-white/[0.03] rounded mt-3" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardOverviewPage() {
  const { tenant } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [policies, setPolicies] = useState<PolicyListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getAnalytics(7), api.listPolicies()])
      .then(([a, p]) => {
        setAnalytics(a);
        setPolicies(p);
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load dashboard data.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Derive metrics
  const totalChecks = analytics?.total_checks ?? 0;
  const totalRejected = analytics?.total_rejected ?? 0;
  const totalAllowed = totalChecks - totalRejected;
  const denialRate =
    totalChecks > 0 ? ((totalRejected / totalChecks) * 100).toFixed(1) : "0.0";

  // Build sparkline data from daily stats
  const dailyTotals = analytics?.days
    ? [...analytics.days].reverse().map((d) => d.total_checks)
    : [];
  const dailyAllowed = analytics?.days
    ? [...analytics.days].reverse().map((d) => d.allowed_checks)
    : [];
  const dailyRejected = analytics?.days
    ? [...analytics.days].reverse().map((d) => d.rejected_checks)
    : [];

  // Simple trend: compare last half to first half
  function getTrend(data: number[]): "up" | "down" | "flat" {
    if (data.length < 4) return "flat";
    const mid = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, mid).reduce((a, b) => a + b, 0);
    const secondHalf = data.slice(mid).reduce((a, b) => a + b, 0);
    if (secondHalf > firstHalf * 1.1) return "up";
    if (secondHalf < firstHalf * 0.9) return "down";
    return "flat";
  }

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  const stats = [
    {
      label: "Total Checks",
      value: formatCompact(totalChecks),
      icon: Activity,
      color: "text-text-secondary",
      sparkData: dailyTotals,
      sparkColor: "#8a8a8a",
      trend: getTrend(dailyTotals),
    },
    {
      label: "Allowed",
      value: formatCompact(totalAllowed),
      icon: ShieldCheck,
      color: "text-accent",
      sparkData: dailyAllowed,
      sparkColor: "#00e599",
      trend: getTrend(dailyAllowed),
    },
    {
      label: "Rejected",
      value: formatCompact(totalRejected),
      icon: ShieldX,
      color: "text-red",
      sparkData: dailyRejected,
      sparkColor: "#ff4466",
      trend: getTrend(dailyRejected),
    },
    {
      label: "Denial Rate",
      value: `${denialRate}%`,
      icon: Percent,
      color: parseFloat(denialRate) > 10 ? "text-red" : "text-accent",
      sparkData: analytics?.days
        ? [...analytics.days]
            .reverse()
            .map((d) =>
              d.total_checks > 0
                ? (d.rejected_checks / d.total_checks) * 100
                : 0
            )
        : [],
      sparkColor: parseFloat(denialRate) > 10 ? "#ff4466" : "#00e599",
      trend: "flat" as const,
    },
  ];

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-7 w-64 bg-white/[0.06] rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-white/[0.04] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 h-64 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <Activity size={32} className="mx-auto text-text-tertiary mb-4" />
        <p className="text-[15px] text-text-secondary mb-2">
          Failed to load dashboard
        </p>
        <p className="text-[13px] text-text-tertiary">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-[24px] font-semibold tracking-[-0.02em] text-text-primary"
        >
          {greeting},{" "}
          <span className="text-gradient">
            {tenant?.name ?? "there"}
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="text-[14px] text-text-secondary mt-1"
        >
          Here is your rate limiting activity for the last 7 days.
        </motion.p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] transition-colors duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-medium text-text-tertiary uppercase tracking-wider">
                {stat.label}
              </span>
              <stat.icon size={16} className={stat.color} />
            </div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p
                  className={cn(
                    "text-[28px] font-semibold tracking-[-0.03em] font-mono",
                    stat.label === "Denial Rate"
                      ? stat.color
                      : "text-text-primary"
                  )}
                >
                  {stat.value}
                </p>
                {stat.trend !== "flat" && (
                  <div className="flex items-center gap-1 mt-1">
                    {stat.trend === "up" ? (
                      <TrendingUp size={12} className="text-text-tertiary" />
                    ) : (
                      <TrendingDown size={12} className="text-text-tertiary" />
                    )}
                    <span className="text-[11px] text-text-tertiary">
                      vs prior
                    </span>
                  </div>
                )}
              </div>
              <div className="shrink-0 opacity-60">
                <Sparkline
                  data={stat.sparkData}
                  color={stat.sparkColor}
                  width={80}
                  height={32}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom row: Chart + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mini bar chart - last 7 days */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold text-text-primary">
              Daily volume
            </h2>
            <span className="text-[11px] text-text-tertiary font-mono">
              Last 7 days
            </span>
          </div>

          {analytics && analytics.days.length > 0 ? (
            <div className="flex items-end gap-2 h-36">
              {[...analytics.days].reverse().map((day, i) => {
                const maxChecks = Math.max(
                  ...[...analytics.days].map((d) => d.total_checks),
                  1
                );
                const totalHeight =
                  (day.total_checks / maxChecks) * 100;
                const rejectedPct =
                  day.total_checks > 0
                    ? (day.rejected_checks / day.total_checks) * 100
                    : 0;

                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-1.5 group"
                  >
                    <div className="w-full flex flex-col items-stretch justify-end h-28 relative">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${totalHeight}%` }}
                        transition={{ delay: 0.3 + i * 0.04, duration: 0.5, ease: "easeOut" }}
                        className="w-full rounded-t-md relative overflow-hidden"
                        style={{ background: "rgba(0, 229, 153, 0.25)" }}
                      >
                        {rejectedPct > 0 && (
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded-b-sm"
                            style={{
                              height: `${rejectedPct}%`,
                              background: "rgba(255, 68, 102, 0.35)",
                            }}
                          />
                        )}
                      </motion.div>

                      {/* Hover tooltip */}
                      <div className="absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                        <div className="px-2 py-1 rounded-lg bg-[#111] border border-white/[0.1] text-[10px] text-text-primary whitespace-nowrap font-mono">
                          {formatCompact(day.total_checks)}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-text-tertiary font-mono">
                      {day.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-36 flex items-center justify-center">
              <p className="text-[13px] text-text-tertiary">
                No data for this period yet.
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm bg-accent/30" />
              <span className="text-[11px] text-text-tertiary">Allowed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm bg-red/30" />
              <span className="text-[11px] text-text-tertiary">Rejected</span>
            </div>
          </div>
        </motion.div>

        {/* Quick actions + status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="flex flex-col gap-4"
        >
          {/* Quick actions */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
            <h3 className="text-[13px] font-medium text-text-tertiary uppercase tracking-wider mb-4">
              Quick actions
            </h3>
            <div className="space-y-2.5">
              <Link
                href="/dashboard/policies"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent hover:bg-accent-hover text-bg text-[13px] font-medium transition-all duration-200 btn-shimmer relative group"
              >
                <Plus size={15} className="relative z-10" />
                <span className="relative z-10 flex-1">Create Policy</span>
                <ArrowRight
                  size={14}
                  className="relative z-10 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                />
              </Link>
              <Link
                href="/docs"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] text-text-secondary hover:text-text-primary text-[13px] font-medium transition-all duration-200 group"
              >
                <BookOpen size={15} />
                <span className="flex-1">View Docs</span>
                <ArrowRight
                  size={14}
                  className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                />
              </Link>
            </div>
          </div>

          {/* Quick status */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex-1">
            <h3 className="text-[13px] font-medium text-text-tertiary uppercase tracking-wider mb-4">
              Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-secondary">
                  Active policies
                </span>
                <span className="text-[13px] font-mono text-text-primary">
                  {policies?.items.filter((p) => p.is_active).length ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-secondary">
                  Total policies
                </span>
                <span className="text-[13px] font-mono text-text-primary">
                  {policies?.total ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-secondary">Tier</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent/[0.1] text-[11px] font-medium text-accent uppercase tracking-wider">
                  {tenant?.tier ?? "free"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-secondary">
                  Service
                </span>
                <span className="inline-flex items-center gap-1.5 text-[13px] text-accent">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Operational
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
