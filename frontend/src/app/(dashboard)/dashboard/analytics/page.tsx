"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ShieldCheck,
  ShieldX,
  Percent,
  BarChart3,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import type { AnalyticsResponse } from "@/lib/api";
import { cn, formatCompact } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function StatSkeleton() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-20 bg-white/[0.06] rounded" />
        <div className="h-4 w-4 bg-white/[0.04] rounded" />
      </div>
      <div className="h-8 w-24 bg-white/[0.06] rounded mt-1" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Stacked bar chart
// ---------------------------------------------------------------------------

function StackedBarChart({
  days,
}: {
  days: AnalyticsResponse["days"];
}) {
  if (!days || days.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-[13px] text-text-tertiary">No data to display.</p>
      </div>
    );
  }

  // We display chronologically (oldest to newest)
  const sorted = [...days].reverse();
  const maxTotal = Math.max(...sorted.map((d) => d.total_checks), 1);

  const chartWidth = 800;
  const chartHeight = 240;
  const barGap = 4;
  const labelHeight = 24;
  const yLabelWidth = 48;
  const innerWidth = chartWidth - yLabelWidth;
  const barWidth = Math.max(
    (innerWidth - barGap * (sorted.length + 1)) / sorted.length,
    8
  );

  // Y-axis ticks (5 steps)
  const yTicks = Array.from({ length: 5 }, (_, i) =>
    Math.round((maxTotal / 4) * i)
  );

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight + labelHeight}`}
        className="w-full h-auto min-w-[500px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y-axis grid lines */}
        {yTicks.map((tick) => {
          const y =
            chartHeight - (tick / maxTotal) * chartHeight;
          return (
            <g key={tick}>
              <line
                x1={yLabelWidth}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="rgba(255,255,255,0.04)"
                strokeDasharray="4 4"
              />
              <text
                x={yLabelWidth - 8}
                y={y + 3}
                textAnchor="end"
                fill="#4a4a4a"
                fontSize={10}
                fontFamily="var(--font-mono)"
              >
                {formatCompact(tick)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {sorted.map((day, i) => {
          const x =
            yLabelWidth +
            barGap +
            i * (barWidth + barGap);
          const totalBarHeight =
            (day.total_checks / maxTotal) * chartHeight;
          const allowedHeight =
            day.total_checks > 0
              ? (day.allowed_checks / day.total_checks) * totalBarHeight
              : 0;
          const rejectedHeight =
            day.total_checks > 0
              ? (day.rejected_checks / day.total_checks) * totalBarHeight
              : 0;

          const barY = chartHeight - totalBarHeight;

          return (
            <g key={day.date}>
              {/* Hover backdrop */}
              <rect
                x={x - 2}
                y={0}
                width={barWidth + 4}
                height={chartHeight}
                fill="transparent"
                className="hover:fill-white/[0.02] transition-colors cursor-default"
              />

              {/* Allowed portion (top) */}
              <motion.rect
                x={x}
                width={barWidth}
                rx={3}
                ry={3}
                fill="#00e599"
                fillOpacity={0.3}
                initial={{ y: chartHeight, height: 0 }}
                animate={{
                  y: barY,
                  height: allowedHeight,
                }}
                transition={{
                  delay: i * 0.03,
                  duration: 0.5,
                  ease: "easeOut",
                }}
              />

              {/* Rejected portion (bottom of the bar) */}
              <motion.rect
                x={x}
                width={barWidth}
                rx={0}
                fill="#ff4466"
                fillOpacity={0.35}
                initial={{ y: chartHeight, height: 0 }}
                animate={{
                  y: chartHeight - rejectedHeight,
                  height: rejectedHeight,
                }}
                transition={{
                  delay: i * 0.03 + 0.1,
                  duration: 0.5,
                  ease: "easeOut",
                }}
              />

              {/* Tooltip on hover (title element for native hover) */}
              <title>
                {day.date}: {day.total_checks.toLocaleString()} total,{" "}
                {day.allowed_checks.toLocaleString()} allowed,{" "}
                {day.rejected_checks.toLocaleString()} rejected
              </title>

              {/* X-axis label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 16}
                textAnchor="middle"
                fill="#4a4a4a"
                fontSize={10}
                fontFamily="var(--font-mono)"
              >
                {day.date.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const data = await api.getAnalytics(days);
        if (!cancelled) { setAnalytics(data); setError(null); setLoading(false); }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load analytics.";
          setError(msg);
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [days]);

  // Compute derived stats
  const totalChecks = analytics?.total_checks ?? 0;
  const totalRejected = analytics?.total_rejected ?? 0;
  const totalAllowed = totalChecks - totalRejected;
  const denialRate =
    totalChecks > 0 ? ((totalRejected / totalChecks) * 100).toFixed(1) : "0.0";

  const statCards = [
    {
      label: "Total Checks",
      value: formatCompact(totalChecks),
      icon: Activity,
      colorClass: "text-text-secondary",
    },
    {
      label: "Allowed",
      value: formatCompact(totalAllowed),
      icon: ShieldCheck,
      colorClass: "text-accent",
    },
    {
      label: "Rejected",
      value: formatCompact(totalRejected),
      icon: ShieldX,
      colorClass: "text-red",
    },
    {
      label: "Denial Rate",
      value: `${denialRate}%`,
      icon: Percent,
      colorClass: parseFloat(denialRate) > 10 ? "text-red" : "text-accent",
    },
  ];

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-7 w-32 bg-white/[0.06] rounded animate-pulse mb-2" />
            <div className="h-4 w-56 bg-white/[0.04] rounded animate-pulse" />
          </div>
          <div className="h-9 w-36 bg-white/[0.06] rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 h-72 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-text-primary">
            Analytics
          </h1>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-12 text-center">
          <BarChart3 size={32} className="mx-auto text-text-tertiary mb-4" />
          <p className="text-[15px] text-text-secondary mb-2">
            Unable to load analytics
          </p>
          <p className="text-[13px] text-text-tertiary">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with time range selector */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-text-primary">
            Analytics
          </h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Rate limiting activity over the last {days} days.
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {[
            { value: 7, label: "7d" },
            { value: 14, label: "14d" },
            { value: 30, label: "30d" },
          ].map((period) => (
            <button
              key={period.value}
              onClick={() => setDays(period.value)}
              className={cn(
                "relative px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200",
                days === period.value
                  ? "text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              {days === period.value && (
                <motion.div
                  layoutId="analytics-period"
                  className="absolute inset-0 bg-white/[0.08] rounded-lg"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10">{period.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
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
              <stat.icon size={16} className={stat.colorClass} />
            </div>
            <p
              className={cn(
                "text-[28px] font-semibold tracking-[-0.03em] font-mono",
                stat.label === "Denial Rate"
                  ? stat.colorClass
                  : stat.label === "Rejected"
                  ? "text-red"
                  : stat.label === "Allowed"
                  ? "text-accent"
                  : "text-text-primary"
              )}
            >
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Stacked bar chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[15px] font-semibold text-text-primary">
            Daily volume
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(0, 229, 153, 0.3)" }} />
              <span className="text-[11px] text-text-tertiary">Allowed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(255, 68, 102, 0.35)" }} />
              <span className="text-[11px] text-text-tertiary">Rejected</span>
            </div>
          </div>
        </div>

        {analytics ? (
          <StackedBarChart days={analytics.days} />
        ) : (
          <div className="h-64 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-text-tertiary" />
          </div>
        )}
      </motion.div>

      {/* Data table */}
      {analytics && analytics.days.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.35 }}
          className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden mt-4"
        >
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-[15px] font-semibold text-text-primary">
              Daily breakdown
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-3 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Allowed
                  </th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Rejected
                  </th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Denial Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {[...analytics.days].reverse().map((day) => {
                  const rate =
                    day.total_checks > 0
                      ? (
                          (day.rejected_checks / day.total_checks) *
                          100
                        ).toFixed(1)
                      : "0.0";
                  return (
                    <tr
                      key={day.date}
                      className="hover:bg-white/[0.02] transition-colors duration-150"
                    >
                      <td className="px-6 py-3.5 font-mono text-text-primary">
                        {day.date}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-text-secondary">
                        {day.total_checks.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-accent">
                        {day.allowed_checks.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-red">
                        {day.rejected_checks.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-text-secondary">
                        {rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
