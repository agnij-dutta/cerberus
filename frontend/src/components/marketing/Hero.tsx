"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { ArrowRight, Github, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

const terminalLines = [
  { text: "$ curl -X POST https://api.cerberus.dev/v1/check \\", style: "command" as const },
  { text: '    -H "X-API-Key: cerb_abc123..." \\', style: "flag" as const },
  { text: '    -d \'{"key": "user:42", "policy": "api-default"}\'', style: "flag" as const },
  { text: "", style: "blank" as const },
  { text: "# Response  200 OK  0.4ms", style: "comment" as const },
  { text: "{", style: "brace" as const },
  { text: '  "allowed": true,', style: "value-bool" as const },
  { text: '  "remaining": 97,', style: "value-num" as const },
  { text: '  "limit": 100,', style: "value-num" as const },
  { text: '  "reset_at": 1710100060', style: "value-num" as const },
  { text: "}", style: "brace" as const },
];

const stats = [
  { value: "<1ms", label: "P99 Latency" },
  { value: "100K+", label: "Checks/sec" },
  { value: "99.99%", label: "Uptime SLA" },
  { value: "0", label: "Race Conditions" },
];

function TerminalLine({ line }: { line: (typeof terminalLines)[number] }) {
  if (line.style === "blank") return <div className="h-4" />;
  const styles = {
    command: "text-accent",
    flag: "text-text-secondary",
    comment: "text-code-comment italic",
    brace: "text-text-tertiary",
    "value-bool": "",
    "value-num": "",
  };
  if (line.style === "value-bool" || line.style === "value-num") {
    const m = line.text.match(/^(\s*"[^"]+":)\s*(.+)$/);
    if (m) {
      return (
        <span>
          <span className="text-code-blue">{m[1]}</span>{" "}
          <span className={m[2].includes("true") ? "text-accent font-medium" : "text-code-orange"}>{m[2]}</span>
        </span>
      );
    }
  }
  return <span className={styles[line.style] || ""}>{line.text}</span>;
}

function FloatingTerminal() {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [4, -4]), { stiffness: 150, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-400, 400], [-4, 4]), { stiffness: 150, damping: 25 });

  function handleMouse(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className="relative w-full max-w-2xl mx-auto"
    >
      {/* Massive glow behind terminal */}
      <div className="absolute -inset-16 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(0,229,153,0.1) 0%, transparent 65%)" }}
      />
      <div className="absolute inset-0 rounded-2xl blur-[80px] bg-accent/[0.06] pointer-events-none" />

      <div className="relative animated-border">
        <div className="relative rounded-2xl overflow-hidden bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/50">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.05]">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]/70 hover:bg-[#ff5f57] transition-colors" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]/70 hover:bg-[#febc2e] transition-colors" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]/70 hover:bg-[#28c840] transition-colors" />
            </div>
            <div className="flex-1 flex justify-center">
              <span className="text-[11px] text-text-tertiary font-mono px-3 py-0.5 rounded-md bg-white/[0.03]">
                ~ / cerberus
              </span>
            </div>
            <div className="w-[52px]" />
          </div>

          {/* Code */}
          <div className="p-5 sm:p-6 overflow-x-auto">
            <pre className="font-mono text-[12px] sm:text-[13px] leading-[1.75]">
              {terminalLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.04, duration: 0.3 }}
                >
                  <TerminalLine line={line} />
                </motion.div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* === DRAMATIC GRADIENT BACKGROUND === */}
      <div className="absolute inset-0 z-0">
        {/* Large blurred gradient strips — creates the atmospheric effect */}
        <div className="flex flex-col items-end absolute -right-40 -top-20 blur-xl">
          <div className="h-[12rem] rounded-full w-[50rem] bg-gradient-to-b blur-[8rem] from-emerald-700/40 to-teal-600/30" />
          <div className="h-[10rem] rounded-full w-[70rem] bg-gradient-to-b blur-[8rem] from-green-900/30 to-cyan-600/20" />
          <div className="h-[10rem] rounded-full w-[45rem] bg-gradient-to-b blur-[7rem] from-teal-500/20 to-emerald-800/20" />
        </div>

        {/* Left side complementary glow */}
        <div className="flex flex-col items-start absolute -left-40 top-[30%] blur-xl">
          <div className="h-[8rem] rounded-full w-[40rem] bg-gradient-to-b blur-[6rem] from-emerald-600/15 to-transparent" />
          <div className="h-[6rem] rounded-full w-[30rem] bg-gradient-to-b blur-[5rem] from-cyan-700/10 to-transparent" />
        </div>

        {/* Bottom center glow for terminal area */}
        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2">
          <div className="h-[15rem] w-[50rem] rounded-full bg-gradient-to-t blur-[8rem] from-emerald-600/10 via-teal-600/8 to-transparent" />
        </div>

        {/* Noise overlay */}
        <div className="absolute inset-0 bg-noise opacity-[0.25]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px",
          }}
        />

        {/* Dot pattern */}
        <div className="absolute inset-0 dot-pattern opacity-30" />
      </div>

      {/* Top edge accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent z-10" />

      {/* === CONTENT === */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5 }}
          className="mt-24 mb-8"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-md text-[13px] text-white/70 hover:bg-white/[0.09] transition-colors cursor-default">
            <Sparkles size={13} className="text-accent" />
            <span>v1.0 — Now open source</span>
            <ArrowRight size={13} className="text-white/40" />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="text-center text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] font-bold tracking-[-0.035em] leading-[1.05] max-w-5xl"
        >
          <span className="text-gradient-white">Rate Limiting</span>
          <br />
          <span className="text-gradient-white">Infrastructure for</span>
          <br />
          <span className="text-gradient">Modern APIs.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-7 text-center text-[16px] sm:text-[18px] text-white/50 leading-[1.7] max-w-xl"
        >
          Sub-millisecond decisions powered by atomic Redis Lua scripts.
          Sliding window, token bucket, multi-tenant isolation.
          Drop it in front of any API.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.26 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          {/* Primary */}
          <Link
            href="#"
            className="group relative inline-flex items-center gap-2.5 h-12 px-7 rounded-full text-[15px] font-semibold transition-all duration-300 btn-shimmer"
          >
            <div className="absolute inset-0 rounded-full bg-accent group-hover:bg-accent-hover transition-colors" />
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[0_0_40px_8px_rgba(0,229,153,0.25)]" />
            <span className="relative z-10 text-black font-semibold">Get Started Free</span>
            <ArrowRight size={16} className="relative z-10 text-black group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Secondary */}
          <a
            href="https://github.com/agnij-dutta/cerberus"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 h-12 px-7 rounded-full border border-white/[0.12] bg-white/[0.04] backdrop-blur-md text-[15px] text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.18] transition-all duration-300"
          >
            <Github size={16} />
            <span>Star on GitHub</span>
          </a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-3"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.06, duration: 0.4 }}
              className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] backdrop-blur-md hover:bg-white/[0.07] transition-colors cursor-default"
            >
              <span className="text-[15px] font-bold text-gradient">{s.value}</span>
              <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-white/30">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(16px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="mt-16 mb-8 w-full max-w-2xl"
        >
          <FloatingTerminal />
        </motion.div>
      </div>

      {/* Bottom fade to page bg */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-bg via-bg/80 to-transparent pointer-events-none z-10" />
    </section>
  );
}
