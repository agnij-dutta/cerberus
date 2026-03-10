"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { ArrowRight, Github } from "lucide-react";

const links = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "/docs" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className={cn(
        "mx-auto max-w-5xl px-4 transition-all duration-500",
        scrolled ? "py-3" : "py-5"
      )}>
        <nav className={cn(
          "flex items-center justify-between px-5 transition-all duration-500 rounded-2xl",
          scrolled
            ? "glass-strong py-2.5 shadow-lg shadow-black/20"
            : "py-2"
        )}>
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-[13px] text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/[0.04] transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://github.com/agnij-dutta/cerberus"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/[0.04] transition-all duration-200"
            >
              <Github size={15} />
            </a>
          </div>

          <Link
            href="/login"
            className="group relative flex items-center gap-1.5 text-[13px] font-medium text-bg bg-accent hover:bg-accent-hover pl-4 pr-3 py-2 rounded-xl transition-all duration-200 btn-shimmer"
          >
            <span className="relative z-10">Dashboard</span>
            <ArrowRight size={14} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
