"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className }: LogoProps) {
  const sizes = {
    sm: { icon: 20, text: "text-base" },
    md: { icon: 26, text: "text-xl" },
    lg: { icon: 36, text: "text-3xl" },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Three-headed gate guardian — stylized geometric Cerberus */}
        <path
          d="M16 2L4 10v12l12 8 12-8V10L16 2z"
          stroke="var(--color-cyan)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.3"
        />
        <path
          d="M16 6l-8 5v10l8 5 8-5V11l-8-5z"
          stroke="var(--color-cyan)"
          strokeWidth="1.5"
          fill="var(--color-cyan-glow)"
        />
        {/* Three dots — the three heads */}
        <circle cx="11" cy="15" r="2" fill="var(--color-cyan)" />
        <circle cx="16" cy="12" r="2.5" fill="var(--color-cyan)" />
        <circle cx="21" cy="15" r="2" fill="var(--color-cyan)" />
        {/* Shield line */}
        <path
          d="M16 18v6"
          stroke="var(--color-cyan)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={cn(
          "font-bold tracking-tight",
          s.text
        )}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <span className="text-gradient">Cerberus</span>
      </span>
    </div>
  );
}
