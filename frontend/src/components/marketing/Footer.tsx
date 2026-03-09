"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Github, Twitter } from "lucide-react";

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Changelog", href: "/docs" },
    ],
  },
  {
    title: "Documentation",
    links: [
      { label: "Getting Started", href: "/docs/guides/quickstart" },
      { label: "API Reference", href: "/docs/api-reference" },
      { label: "Architecture", href: "/docs/architecture" },
      { label: "Self-Hosting", href: "/docs/guides/self-hosting" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "GitHub", href: "https://github.com/agnijdutta/cerberus" },
      { label: "Contributing", href: "https://github.com/agnijdutta/cerberus/blob/main/CONTRIBUTING.md" },
      { label: "Discussions", href: "https://github.com/agnijdutta/cerberus/discussions" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-obsidian-light/30">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo size="sm" className="mb-4" />
            <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
              Open-source rate limiting as a service. Protect your APIs with
              sub-millisecond enforcement powered by Redis.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href="https://github.com/agnijdutta/cerberus"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                aria-label="GitHub"
              >
                <Github size={16} />
              </a>
              <a
                href="https://twitter.com/cerberusdev"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={16} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-mono uppercase tracking-widest text-text-muted mb-4">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Agnij Dutta. MIT License.
          </p>
          <p className="text-xs text-text-muted font-mono">
            Built with FastAPI, Redis, and Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
