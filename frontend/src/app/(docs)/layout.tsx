"use client";

import { Navbar } from "@/components/shared/Navbar";
import { DocsSidebar } from "@/components/docs/Sidebar";
import { Footer } from "@/components/marketing/Footer";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        <div className="flex gap-12">
          <DocsSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
      <Footer />
    </>
  );
}
