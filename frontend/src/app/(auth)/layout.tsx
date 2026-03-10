"use client";

import Link from "next/link";
import { AuthProvider } from "@/lib/auth-context";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
        {/* Ambient gradient glow */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[60rem] h-[40rem] rounded-full bg-emerald-600/[0.04] blur-[12rem]" />
          <div className="absolute bottom-[10%] left-[20%] w-[30rem] h-[30rem] rounded-full bg-teal-700/[0.03] blur-[10rem]" />
        </div>

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2.5 mb-10">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-lg bg-accent/20 blur-md" />
            <div className="relative w-full h-full rounded-lg bg-gradient-to-br from-accent/90 to-accent/60 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-bg">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>
          <span className="text-lg font-semibold tracking-[-0.02em] text-text-primary">
            Cerberus
          </span>
        </Link>

        <div className="relative z-10 w-full max-w-[420px]">{children}</div>

        <p className="relative z-10 mt-10 text-[12px] text-text-tertiary">
          Rate limiting infrastructure for modern APIs
        </p>
      </div>
    </AuthProvider>
  );
}
