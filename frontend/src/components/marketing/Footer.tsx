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
      { label: "Documentation", href: "/docs" },
      { label: "API Reference", href: "/docs#check-endpoint" },
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
    <footer className="relative border-t border-border-subtle">
      {/* Top glow line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/15 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Logo className="mb-5" />
            <p className="text-[13px] text-text-secondary leading-[1.7] max-w-xs">
              Open-source rate limiting infrastructure.
              Protect your APIs with sub-millisecond enforcement powered by Redis.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.12em] text-text-tertiary mb-5">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-200"
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

        <div className="flex flex-col sm:flex-row items-center justify-between mt-16 pt-8 border-t border-border-subtle text-[12px] text-text-tertiary">
          <p>&copy; {new Date().getFullYear()} Agnij Dutta. MIT License.</p>
          <p className="mt-2 sm:mt-0 font-mono text-[11px]">
            Built with FastAPI + Redis + Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
