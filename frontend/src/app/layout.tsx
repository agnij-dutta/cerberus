import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cerberus — Rate Limiting as a Service",
    template: "%s | Cerberus",
  },
  description:
    "Protect your APIs with sub-millisecond rate limiting. Sliding window and token bucket algorithms, powered by Redis.",
  keywords: [
    "rate limiting",
    "API protection",
    "rate limiter",
    "Redis",
    "sliding window",
    "token bucket",
    "API gateway",
  ],
  authors: [{ name: "Agnij Dutta" }],
  openGraph: {
    title: "Cerberus — Rate Limiting as a Service",
    description: "Sub-millisecond API rate limiting. Guard your gates.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-theme="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
