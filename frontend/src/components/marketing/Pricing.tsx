"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles, Zap, Building2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Open Source",
    icon: Zap,
    price: "Free",
    period: "forever",
    desc: "Self-host on your own infrastructure with full source code access.",
    features: [
      "Unlimited requests",
      "Sliding window + token bucket",
      "Redis-backed storage",
      "Prometheus metrics",
      "Docker deployment",
      "Community support",
    ],
    cta: "Get Started",
    href: "#",
    style: "default" as const,
  },
  {
    name: "Pro",
    icon: Sparkles,
    price: "$49",
    period: "/mo",
    desc: "Managed service with guaranteed uptime and priority support.",
    features: [
      "Everything in Open Source",
      "Managed Redis cluster",
      "99.99% uptime SLA",
      "Dashboard & analytics",
      "Up to 10M checks/month",
      "Email support",
      "Custom policies",
    ],
    cta: "Start Free Trial",
    href: "#",
    style: "highlighted" as const,
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: "Custom",
    period: "",
    desc: "Dedicated infrastructure, custom SLAs, and hands-on engineering support.",
    features: [
      "Everything in Pro",
      "Unlimited checks",
      "Dedicated Redis cluster",
      "Custom SLA",
      "SSO / SAML",
      "Priority support + Slack",
      "On-prem deployment",
      "Custom algorithms",
    ],
    cta: "Contact Sales",
    href: "#",
    style: "default" as const,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-28 sm:py-40 px-6">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(0,229,153,0.04) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-[12px] font-mono text-text-secondary mb-6"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            Pricing
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-[2.75rem] font-bold tracking-[-0.03em] mb-5"
          >
            <span className="text-gradient-white">Start free, scale when ready.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-text-secondary text-[16px] max-w-lg mx-auto leading-relaxed"
          >
            Open source and self-hostable. Or let us handle the infrastructure
            so you can focus on your product.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const isHighlighted = plan.style === "highlighted";
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className={cn(
                  "relative flex flex-col rounded-2xl overflow-hidden transition-all duration-500",
                  isHighlighted
                    ? "animated-border"
                    : "border border-border-default hover:border-border-bright"
                )}
              >
                {/* Content */}
                <div className={cn(
                  "relative flex flex-col flex-1 p-7 rounded-2xl",
                  isHighlighted
                    ? "bg-bg-raised"
                    : "glass"
                )}>
                  {/* Background for highlighted */}
                  {isHighlighted && (
                    <div className="absolute inset-0 pointer-events-none rounded-2xl"
                      style={{
                        background: "radial-gradient(circle at 50% 0%, rgba(0,229,153,0.08), transparent 60%)",
                      }}
                    />
                  )}

                  {/* Badge */}
                  {isHighlighted && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2">
                      <div className="px-4 py-1 rounded-b-lg bg-accent text-bg text-[11px] font-semibold tracking-wide">
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  <div className="relative mb-7 pt-2">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-5 border transition-colors",
                      isHighlighted
                        ? "bg-accent/10 border-accent/20 text-accent"
                        : "bg-white/[0.03] border-white/[0.06] text-text-secondary"
                    )}>
                      <Icon size={18} />
                    </div>

                    <p className="text-[12px] font-mono uppercase tracking-[0.1em] text-text-tertiary mb-3">
                      {plan.name}
                    </p>
                    <div className="flex items-baseline gap-1.5 mb-3">
                      <span className={cn(
                        "text-4xl font-bold tracking-tight",
                        isHighlighted ? "text-gradient" : ""
                      )}>
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-sm text-text-tertiary">{plan.period}</span>
                      )}
                    </div>
                    <p className="text-[13.5px] text-text-secondary leading-relaxed">{plan.desc}</p>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-border-default to-transparent mb-7" />

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-[13.5px]">
                        <div className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          isHighlighted
                            ? "bg-accent/15 text-accent"
                            : "bg-white/[0.04] text-text-tertiary"
                        )}>
                          <Check size={10} strokeWidth={3} />
                        </div>
                        <span className="text-text-secondary">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.href}
                    className={cn(
                      "relative group flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                      isHighlighted
                        ? "bg-accent text-bg hover:bg-accent-hover btn-shimmer shadow-lg shadow-accent/10"
                        : "glass hover:bg-white/[0.06] text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <span className="relative z-10">{plan.cta}</span>
                    <ArrowRight size={14} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
