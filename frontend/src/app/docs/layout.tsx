"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Zap,
  Shield,
  Key,
  Code2,
  Settings,
  BarChart3,
  Terminal,
  Layers,
  ArrowLeft,
  Search,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, createContext, useContext, useCallback } from "react";

// --- Scroll-spy context ---
const ActiveSectionContext = createContext<{
  activeId: string;
  setActiveId: (id: string) => void;
}>({ activeId: "introduction", setActiveId: () => {} });

export function useActiveSection() {
  return useContext(ActiveSectionContext);
}

// All section IDs in document order — used by the observer
const sectionIds = [
  "introduction",
  "quickstart",
  "installation",
  "rate-limiting",
  "policies",
  "algorithms",
  "authentication",
  "check-endpoint",
  "analytics",
];

const sections = [
  {
    title: "Getting Started",
    items: [
      { label: "Introduction", id: "introduction", href: "/docs#introduction", icon: BookOpen },
      { label: "Quickstart", id: "quickstart", href: "/docs#quickstart", icon: Zap },
      { label: "Installation", id: "installation", href: "/docs#installation", icon: Terminal },
    ],
  },
  {
    title: "Core Concepts",
    items: [
      { label: "Rate Limiting", id: "rate-limiting", href: "/docs#rate-limiting", icon: Shield },
      { label: "Policies", id: "policies", href: "/docs#policies", icon: Layers },
      { label: "Algorithms", id: "algorithms", href: "/docs#algorithms", icon: Settings },
    ],
  },
  {
    title: "API Reference",
    items: [
      { label: "Authentication", id: "authentication", href: "/docs#authentication", icon: Key },
      { label: "Check Endpoint", id: "check-endpoint", href: "/docs#check-endpoint", icon: Code2 },
      { label: "Analytics", id: "analytics", href: "/docs#analytics", icon: BarChart3 },
    ],
  },
];

function useScrollSpy() {
  const [activeId, setActiveId] = useState("introduction");

  useEffect(() => {
    const headings = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Collect all currently-visible headings
        const visible: { id: string; top: number }[] = [];
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visible.push({ id: entry.target.id, top: entry.boundingClientRect.top });
          }
        });

        if (visible.length > 0) {
          // Pick the one closest to top of viewport
          visible.sort((a, b) => Math.abs(a.top) - Math.abs(b.top));
          setActiveId(visible[0].id);
        }
      },
      {
        // Trigger when heading enters the top 30% of the viewport
        rootMargin: "0px 0px -65% 0px",
        threshold: 0,
      }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, []);

  // Also listen to scroll for edge cases (top of page, bottom of page)
  useEffect(() => {
    function handleScroll() {
      // At top of page → Introduction
      if (window.scrollY < 100) {
        setActiveId("introduction");
        return;
      }

      // At bottom of page → last section
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 100) {
        setActiveId(sectionIds[sectionIds.length - 1]);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { activeId, setActiveId };
}

function Sidebar() {
  const { activeId } = useActiveSection();

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

  return (
    <aside className="fixed top-0 left-0 h-screen w-72 border-r border-border-default bg-bg/80 backdrop-blur-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-border-default shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[12px] text-text-tertiary hover:text-text-secondary transition-colors"
        >
          <ArrowLeft size={12} />
          Home
        </Link>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-border-default text-text-tertiary text-[13px]">
          <Search size={14} />
          <span>Search docs...</span>
          <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] border border-border-default">
            /
          </kbd>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="px-3 mb-2 text-[10px] font-mono uppercase tracking-[0.14em] text-text-tertiary">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeId === item.id;
                return (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      onClick={(e) => handleClick(e, item.id)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200",
                        isActive
                          ? "bg-accent/10 text-accent border border-accent/15"
                          : "text-text-secondary hover:text-text-primary hover:bg-white/[0.03] border border-transparent"
                      )}
                    >
                      <Icon size={14} className={cn("transition-colors duration-200", isActive ? "text-accent" : "text-text-tertiary")} />
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border-subtle shrink-0">
        <a
          href="https://github.com/AgnijDutta/cerberus"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[12px] text-text-tertiary hover:text-text-secondary transition-colors"
        >
          <Code2 size={13} />
          View on GitHub
          <ChevronRight size={12} className="ml-auto" />
        </a>
      </div>
    </aside>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const { activeId } = useActiveSection();

  return (
    <div className="lg:hidden">
      <div className="fixed top-0 inset-x-0 h-14 bg-bg/90 backdrop-blur-xl border-b border-border-default z-50 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg glass text-text-secondary"
        >
          <BookOpen size={16} />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 bg-bg/95 backdrop-blur-xl pt-14 overflow-y-auto">
          <nav className="p-4">
            {sections.map((section) => (
              <div key={section.title} className="mb-6">
                <p className="px-3 mb-2 text-[10px] font-mono uppercase tracking-[0.14em] text-text-tertiary">
                  {section.title}
                </p>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeId === item.id;
                    return (
                      <li key={item.label}>
                        <a
                          href={item.href}
                          onClick={(e) => {
                            e.preventDefault();
                            setOpen(false);
                            setTimeout(() => {
                              const el = document.getElementById(item.id);
                              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                            }, 100);
                          }}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] transition-colors",
                            isActive
                              ? "bg-accent/10 text-accent"
                              : "text-text-secondary hover:text-text-primary hover:bg-white/[0.03]"
                          )}
                        >
                          <Icon size={15} className={isActive ? "text-accent" : "text-text-tertiary"} />
                          {item.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const scrollSpy = useScrollSpy();

  return (
    <ActiveSectionContext.Provider value={scrollSpy}>
      <div className="min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Nav */}
        <MobileNav />

        {/* Content */}
        <main className="lg:pl-72 pt-14 lg:pt-0">
          <div className="max-w-4xl mx-auto px-6 sm:px-10 py-12 lg:py-16">
            {children}
          </div>
        </main>
      </div>
    </ActiveSectionContext.Provider>
  );
}
