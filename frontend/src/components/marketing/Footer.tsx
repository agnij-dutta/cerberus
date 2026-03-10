import Link from "next/link";
import { Logo } from "../shared/Logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: "#" },
      { label: "API Reference", href: "#" },
      { label: "SDKs", href: "#" },
      { label: "Self-Hosting", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "GitHub", href: "https://github.com/AgnijDutta/cerberus", external: true },
      { label: "Contributing", href: "#" },
      { label: "Discussions", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border-default bg-bg-raised">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo className="mb-4" />
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
              Open-source rate limiting infrastructure. Protect your APIs with
              sub-millisecond enforcement powered by Redis.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[12px] font-mono uppercase tracking-wider text-text-tertiary mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mt-14 pt-8 border-t border-border-subtle text-xs text-text-tertiary">
          <p>&copy; {new Date().getFullYear()} Agnij Dutta. MIT License.</p>
          <p className="mt-2 sm:mt-0">
            Built with FastAPI + Redis + Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
