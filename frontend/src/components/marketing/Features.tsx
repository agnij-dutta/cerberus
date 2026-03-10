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
    desc: "Atomic Lua scripts execute entirely within Redis. Single round-trip, no race conditions. Typical latency under 800us.",
    span: "lg:col-span-2",
  },
  {
    icon: Layers,
    title: "Multiple Algorithms",
    desc: "Sliding window for smooth enforcement, token bucket for burst tolerance. Choose per endpoint.",
  },
  {
    icon: Shield,
    title: "Atomic Operations",
    desc: "All logic runs inside Redis via EVALSHA. No TOCTOU bugs, no distributed locks needed.",
  },
  {
    icon: Lock,
    title: "Tenant Isolation",
    desc: "Full multi-tenancy with API key auth. Each tenant gets isolated policies and namespaced keys.",
  },
  {
    icon: BarChart3,
    title: "Prometheus Metrics",
    desc: "Native metrics with pre-built Grafana dashboards. Track allowed/blocked ratios and latency percentiles.",
  },
  {
    icon: Globe,
    title: "Horizontally Scalable",
    desc: "Stateless API layer, shared Redis backend. Add replicas without coordination.",
  },
  {
    icon: RefreshCw,
    title: "Dynamic Policies",
    desc: "Create, update, and delete rate limit policies at runtime via API. Changes propagate instantly.",
  },
  {
    icon: Clock,
    title: "TTL-Bounded Memory",
    desc: "Every Redis key auto-expires after its window duration. No cleanup jobs, no memory leaks.",
  },
  {
    icon: Code2,
    title: "Official SDKs",
    desc: "Versioned REST API with Python and TypeScript SDKs. Standard rate-limit headers and RFC 7807 errors.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-28 sm:py-36 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent mb-4"
          >
            Capabilities
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          >
            Built for production
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-text-secondary max-w-lg mx-auto text-[15px]"
          >
            Everything you need to enforce rate limits at scale, without building it from scratch.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "group relative p-6 rounded-xl border border-border-default bg-bg-card/50 hover:bg-bg-card-hover hover:border-border-bright transition-all duration-300",
                  f.span
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-bg-raised border border-border-default flex items-center justify-center mb-4 group-hover:border-accent/20 transition-colors">
                  <Icon size={16} className="text-text-secondary group-hover:text-accent transition-colors" />
                </div>
                <h3 className="text-[15px] font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
