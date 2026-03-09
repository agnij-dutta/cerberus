"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Clock,
  BarChart3,
  Layers,
  Globe,
  Lock,
  RefreshCw,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Zap,
    title: "Sub-Millisecond Checks",
    description:
      "Atomic Lua scripts execute entirely within Redis. No round-trip overhead, no race conditions. Typical check latency is under 800μs.",
    accent: true,
  },
  {
    icon: Layers,
    title: "Multiple Algorithms",
    description:
      "Sliding window for smooth enforcement, token bucket for burst tolerance. Pick the right tool per endpoint, per policy.",
  },
  {
    icon: Shield,
    title: "Atomic Operations",
    description:
      "Rate limiting logic runs inside Redis via EVALSHA. No TOCTOU bugs, no distributed locks. Correctness by construction.",
  },
  {
    icon: Lock,
    title: "Tenant Isolation",
    description:
      "Full multi-tenancy with API key authentication. Each tenant gets isolated policies, namespaced keys, and independent limits.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Prometheus-native metrics with pre-built Grafana dashboards. Track allowed/blocked ratios, latency percentiles, and cache hit rates.",
  },
  {
    icon: Globe,
    title: "Horizontally Scalable",
    description:
      "Stateless API layer, shared Redis backend. Add replicas without coordination. Pub/sub handles cache invalidation across nodes.",
  },
  {
    icon: RefreshCw,
    title: "Dynamic Policies",
    description:
      "Create, update, and delete rate limit policies at runtime via API. Changes propagate to all nodes within seconds.",
  },
  {
    icon: Clock,
    title: "TTL-Bounded Memory",
    description:
      "Every Redis key auto-expires after its window duration. No background cleanup jobs, no memory leaks. Bounded by design.",
  },
  {
    icon: Code2,
    title: "SDK-Ready API",
    description:
      "Versioned REST API with standard rate-limit headers, RFC 7807 error responses, and official Python and TypeScript SDKs.",
  },
];

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function Features() {
  return (
    <section id="features" className="relative py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-mono uppercase tracking-widest text-cyan mb-4"
          >
            Capabilities
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          >
            Everything you need to
            <br />
            <span className="text-gradient">enforce rate limits at scale</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-text-secondary max-w-xl mx-auto"
          >
            Built for teams who need reliable, fast, and configurable rate
            limiting without building it from scratch.
          </motion.p>
        </div>

        {/* Feature grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                variants={item}
                className={cn(
                  "group relative p-6 rounded-xl border transition-all duration-300",
                  "border-border hover:border-border-light",
                  "bg-surface/30 hover:bg-surface/60",
                  feature.accent && "md:col-span-2 lg:col-span-1"
                )}
              >
                {feature.accent && (
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 0%, var(--color-cyan-glow), transparent 70%)",
                    }}
                  />
                )}
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center mb-4",
                    "bg-surface-hover text-text-secondary group-hover:text-cyan group-hover:bg-cyan-glow",
                    "transition-colors duration-300"
                  )}
                >
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-base mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
