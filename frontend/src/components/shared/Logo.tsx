"use client";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative w-7 h-7">
        {/* Glow */}
        <div className="absolute inset-0 rounded-lg bg-accent/20 blur-md" />
        {/* Icon container */}
        <div className="relative w-full h-full rounded-lg bg-gradient-to-br from-accent/90 to-accent/60 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-bg">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
      </div>
      <span className="text-[16px] font-semibold tracking-[-0.02em] text-text-primary">
        Cerberus
      </span>
    </div>
  );
}
