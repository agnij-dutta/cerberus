export const SITE_NAME = "Cerberus";
export const SITE_DESCRIPTION = "Rate limiting as a service. Protect your APIs with sub-millisecond enforcement.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cerberus.dev";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const NAV_LINKS = {
  marketing: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Docs", href: "/docs" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  docs: [
    { label: "Getting Started", href: "/docs" },
    { label: "API Reference", href: "/docs/api-reference" },
    { label: "Architecture", href: "/docs/architecture" },
    { label: "SDKs", href: "/docs/sdks" },
  ],
  dashboard: [
    { label: "Overview", href: "/dashboard" },
    { label: "Policies", href: "/dashboard/policies" },
    { label: "API Keys", href: "/dashboard/api-keys" },
    { label: "Analytics", href: "/dashboard/analytics" },
    { label: "Playground", href: "/dashboard/playground" },
  ],
} as const;

export const ALGORITHMS = {
  sliding_window: {
    label: "Sliding Window",
    description: "Tracks individual request timestamps for smooth, accurate rate limiting.",
  },
  token_bucket: {
    label: "Token Bucket",
    description: "Allows controlled bursts while maintaining an average rate over time.",
  },
} as const;

export const TIERS = {
  free: { label: "Free", color: "text-text-secondary" },
  pro: { label: "Pro", color: "text-cyan" },
  enterprise: { label: "Enterprise", color: "text-amber" },
} as const;
