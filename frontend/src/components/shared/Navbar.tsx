"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

const links = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#" },
  { label: "GitHub", href: "https://github.com/AgnijDutta/cerberus", external: true },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-bg/80 backdrop-blur-xl border-b border-border-default"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="#"
            className="group flex items-center gap-1.5 text-[13px] font-medium text-bg bg-accent hover:bg-accent-hover px-4 py-1.5 rounded-full transition-colors"
          >
            Dashboard
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
