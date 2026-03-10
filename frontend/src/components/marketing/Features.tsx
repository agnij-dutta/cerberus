"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Layers,
  Shield,
  Lock,
  BarChart3,
  Globe,
  RefreshCw,
  Clock,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Zap,
    title: "Sub-Millisecond Checks",
    desc: "Atomic Lua scripts execute entirely within Redis. Single round-trip, zero race conditions. Typical latency under 800us.",
    size: "large" as const,
    metric: "< 0.8ms",
    metricLabel: "avg latency",
  },
  {
    icon: Layers,
    title: "Multiple Algorithms",
    desc: "Sliding window for smooth enforcement, token bucket for burst tolerance. Choose per endpoint, per policy.",
    size: "normal" as const,
  },
  {
    icon: Shield,
    title: "Atomic Operations",
    desc: "All logic runs inside Redis via EVALSHA. No TOCTOU bugs, no distributed locks.",
    size: "normal" as const,
  },
  {
    icon: Lock,
    title: "Tenant Isolation",
    desc: "Full multi-tenancy with API key auth. Each tenant gets isolated policies and namespaced keys.",
    size: "normal" as const,
  },
  {
    icon: BarChart3,
    title: "Prometheus Metrics",
    desc: "Native metrics with pre-built Grafana dashboards. Track allowed/blocked ratios and latency percentiles.",
    size: "normal" as const,
  },
  {
    icon: Globe,
    title: "Horizontally Scalable",
    desc: "Stateless API layer, shared Redis backend. Add replicas without coordination. Scale to millions.",
    size: "large" as const,
    metric: "100K+",
    metricLabel: "ops/sec per node",
  },
  {
    icon: RefreshCw,
    title: "Dynamic Policies",
    desc: "Create, update, delete rate limit policies at runtime. Changes propagate across all nodes instantly.",
    size: "normal" as const,
  },
  {
    icon: Clock,
    title: "TTL-Bounded Memory",
    desc: "Every Redis key auto-expires. No background cleanup jobs, no memory leaks. Bounded by design.",
    size: "normal" as const,
  },
  {
    icon: Code2,
    title: "Official SDKs",
    desc: "Python and TypeScript SDKs included. Standard rate-limit headers and RFC 7807 error responses.",
    size: "normal" as const,
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-28 sm:py-40 px-6">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(0,229,153,0.03) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-[12px] font-mono text-text-secondary mb-6"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            Capabilities
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-[2.75rem] font-bold tracking-[-0.03em] mb-5"
          >
            <span className="text-gradient-white">Built for production.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-text-secondary max-w-lg mx-auto text-[16px] leading-relaxed"
          >
            Everything you need to enforce rate limits at scale,
            without building it from scratch.
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            const isLarge = f.size === "large";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.04, duration: 0.5 }}
                className={cn(
                  "group relative rounded-2xl overflow-hidden transition-all duration-500",
                  "glass hover:bg-white/[0.06]",
                  isLarge ? "lg:col-span-2 p-7 sm:p-8" : "p-6"
                )}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl"
                  style={{
                    background: "radial-gradient(circle at 30% 20%, rgba(0,229,153,0.05), transparent 50%)",
                  }}
                />

                <div className={cn(
                  isLarge ? "flex flex-col sm:flex-row sm:items-start gap-6" : ""
                )}>
                  <div className="flex-1">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5 group-hover:border-accent/20 group-hover:bg-accent/[0.06] transition-all duration-500">
                      <Icon size={18} className="text-text-secondary group-hover:text-accent transition-colors duration-500" />
                    </div>
                    <h3 className="text-[15px] font-semibold mb-2.5 tracking-[-0.01em]">{f.title}</h3>
                    <p className="text-[13.5px] text-text-secondary leading-[1.6]">
                      {f.desc}
                    </p>
                  </div>

                  {/* Large card metric */}
                  {isLarge && f.metric && (
                    <div className="sm:min-w-[140px] sm:text-right mt-4 sm:mt-0">
                      <div className="glass rounded-xl px-5 py-4 inline-block sm:block">
                        <div className="text-2xl sm:text-3xl font-bold text-gradient tracking-tight">
                          {f.metric}
                        </div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-text-tertiary mt-1">
                          {f.metricLabel}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
