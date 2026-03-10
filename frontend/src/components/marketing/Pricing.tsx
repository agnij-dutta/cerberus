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
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    desc: "Managed service with guaranteed uptime and priority support.",
    features: [
      "Everything in Open Source",
      "Managed Redis cluster",
      "99.99% uptime SLA",
      "Dashboard and analytics",
      "Up to 10M checks/month",
      "Email support",
      "Custom policies",
    ],
    cta: "Start Free Trial",
    href: "#",
    highlight: true,
  },
  {
    name: "Enterprise",
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
      "On-prem deployment option",
      "Custom algorithm support",
    ],
    cta: "Contact Sales",
    href: "#",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-28 sm:py-36 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent mb-4"
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
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-text-secondary text-[15px] max-w-lg mx-auto"
          >
            Open source and self-hostable. Or let us handle the infrastructure
            so you can focus on your product.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "relative flex flex-col p-7 rounded-xl border transition-all",
                plan.highlight
                  ? "border-accent/20 bg-bg-card glow-box"
                  : "border-border-default bg-bg-card/40 hover:border-border-bright"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-accent text-bg text-[11px] font-semibold">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <p className="text-[12px] font-mono uppercase tracking-wider text-text-tertiary mb-3">
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-text-tertiary">{plan.period}</span>
                </div>
                <p className="text-sm text-text-secondary">{plan.desc}</p>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      size={14}
                      className={cn(
                        "shrink-0 mt-0.5",
                        plan.highlight ? "text-accent" : "text-text-tertiary"
                      )}
                    />
                    <span className="text-text-secondary">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                  plan.highlight
                    ? "bg-accent text-bg hover:bg-accent-hover"
                    : "border border-border-default text-text-secondary hover:text-text-primary hover:border-border-bright hover:bg-bg-card-hover"
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
