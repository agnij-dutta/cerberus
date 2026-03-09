"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Code2,
  Boxes,
  Rocket,
  Server,
  Package,
} from "lucide-react";

const sections = [
  {
    title: "Getting Started",
    items: [
      { label: "Introduction", href: "/docs", icon: BookOpen },
      { label: "Quickstart", href: "/docs/guides/quickstart", icon: Rocket },
      { label: "Self-Hosting", href: "/docs/guides/self-hosting", icon: Server },
    ],
  },
  {
    title: "Reference",
    items: [
      { label: "API Reference", href: "/docs/api-reference", icon: Code2 },
      { label: "Architecture", href: "/docs/architecture", icon: Boxes },
      { label: "SDKs", href: "/docs/sdks", icon: Package },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <nav className="sticky top-24 space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h4 className="text-xs font-mono uppercase tracking-widest text-text-muted mb-3 px-3">
              {section.title}
            </h4>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                        active
                          ? "text-cyan bg-cyan-glow font-medium"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                      )}
                    >
                      <Icon size={15} className="shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
