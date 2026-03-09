"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Open Source",
    price: "Free",
    period: "forever",
    description: "Self-host on your own infrastructure. Full source code, no limits.",
    features: [
      "Unlimited requests",
      "Sliding window + token bucket",
      "Redis-backed storage",
      "Prometheus metrics",
      "Docker deployment",
      "Community support",
    ],
    cta: "Get Started",
    href: "/docs/guides/quickstart",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "Managed service with guaranteed uptime and priority support.",
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
    href: "/dashboard",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Dedicated infrastructure, custom SLAs, and hands-on support.",
    features: [
      "Everything in Pro",
      "Unlimited checks",
      "Dedicated Redis cluster",
      "Custom SLA",
      "SSO / SAML",
      "Priority support + Slack",
      "On-prem deployment option",
      "Custom algorithm support",
    ],
    cta: "Contact Sales",
    href: "mailto:sales@cerberus.dev",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-mono uppercase tracking-widest text-cyan mb-4"
          >
            Pricing
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          >
            Start free, scale when ready
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-text-secondary max-w-lg mx-auto"
          >
            Cerberus is open source. Self-host for free or let us run it for
            you.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "relative flex flex-col p-7 rounded-xl border",
                plan.highlight
                  ? "border-cyan/30 bg-surface/50 glow-border-active"
                  : "border-border bg-surface/20"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-cyan text-obsidian text-xs font-semibold">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-text-muted text-sm">
                    {plan.period}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    <Check
                      size={16}
                      className={cn(
                        "shrink-0 mt-0.5",
                        plan.highlight ? "text-cyan" : "text-text-muted"
                      )}
                    />
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={cn(
                  "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  plan.highlight
                    ? "bg-cyan text-obsidian hover:bg-cyan-dim"
                    : "border border-border text-text-secondary hover:text-text-primary hover:border-border-light hover:bg-surface-hover"
                )}
              >
                {plan.cta}
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
