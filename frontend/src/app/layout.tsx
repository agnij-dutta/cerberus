import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Cerberus - Rate Limiting Infrastructure",
    template: "%s | Cerberus",
  },
  description:
    "Sub-millisecond rate limiting for modern APIs. Sliding window and token bucket algorithms, powered by atomic Redis Lua scripts.",
  keywords: [
    "rate limiting",
    "API protection",
    "Redis",
    "sliding window",
    "token bucket",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen antialiased font-sans">{children}</body>
    </html>
  );
}
