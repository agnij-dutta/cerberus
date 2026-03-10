"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTA() {
  return (
    <section className="relative py-28 sm:py-36 px-6 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px]"
          style={{
            background: "radial-gradient(ellipse, rgba(0,229,153,0.08) 0%, transparent 60%)",
          }}
        />
        <div className="absolute inset-0 dot-pattern opacity-30" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-[2.75rem] lg:text-5xl font-bold tracking-[-0.03em] leading-[1.1] mb-6"
        >
          <span className="text-gradient-white">Stop reinventing</span>
          <br />
          <span className="text-gradient">rate limiting.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="text-text-secondary text-[16px] sm:text-[17px] leading-relaxed max-w-lg mx-auto mb-10"
        >
          Every team ends up building it. It starts as a simple Redis counter,
          then becomes three sprints of plumbing. Let Cerberus handle it.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.14 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="#"
            className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-[15px] font-semibold transition-all duration-300 btn-shimmer"
          >
            <div className="absolute inset-0 rounded-xl bg-accent group-hover:bg-accent-hover transition-colors" />
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_40px_rgba(0,229,153,0.35)]" />
            <span className="relative z-10 text-bg">Start Building</span>
            <ArrowRight size={16} className="relative z-10 text-bg group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/docs"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl glass hover:bg-white/[0.06] text-[15px] text-text-secondary hover:text-text-primary transition-all"
          >
            Read the Docs
          </Link>
        </motion.div>

        {/* Install command */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-12 inline-flex items-center gap-3 px-5 py-2.5 rounded-xl glass font-mono text-[13px] text-text-secondary"
        >
          <span className="text-accent">$</span>
          pip install cerberus-sdk
        </motion.div>
      </div>
    </section>
  );
}
