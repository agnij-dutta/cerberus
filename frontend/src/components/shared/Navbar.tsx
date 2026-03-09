"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Determine which nav context we're in
  const isDocs = pathname.startsWith("/docs");
  const isDashboard = pathname.startsWith("/dashboard");
  const links = isDashboard
    ? NAV_LINKS.dashboard
    : isDocs
    ? NAV_LINKS.docs
    : NAV_LINKS.marketing;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-50",
          "w-[calc(100%-2rem)] max-w-5xl",
          "rounded-2xl border transition-all duration-300",
          scrolled
            ? "bg-obsidian/80 backdrop-blur-xl border-border shadow-lg shadow-black/20"
            : "bg-transparent border-transparent"
        )}
      >
        <div className="flex items-center justify-between h-14 px-5">
          {/* Left: Logo */}
          <Link href="/" className="shrink-0">
            <Logo size="sm" />
          </Link>

          {/* Center: Nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href.length > 1 && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "text-cyan bg-cyan-glow"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {!isDashboard && (
              <Link
                href="/dashboard"
                className={cn(
                  "hidden md:flex items-center gap-1.5",
                  "px-4 py-1.5 rounded-lg text-sm font-medium",
                  "bg-cyan text-obsidian hover:bg-cyan-dim",
                  "transition-colors duration-200"
                )}
              >
                Dashboard
                <ArrowRight size={14} />
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-20 z-40 mx-4"
          >
            <div className="rounded-2xl border border-border bg-obsidian-light/95 backdrop-blur-xl p-4 shadow-2xl">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "block px-4 py-3 rounded-lg text-sm font-medium",
                    pathname === link.href
                      ? "text-cyan bg-cyan-glow"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 pt-3 border-t border-border">
                <Link
                  href="/dashboard"
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-center bg-cyan text-obsidian"
                >
                  Open Dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
