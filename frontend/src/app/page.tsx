import { Hero } from "@/components/marketing/Hero";
import { Features } from "@/components/marketing/Features";
import { CodeDemo } from "@/components/marketing/CodeDemo";
import { Pricing } from "@/components/marketing/Pricing";
import { CTA } from "@/components/marketing/CTA";
import { Footer } from "@/components/marketing/Footer";
import { Navbar } from "@/components/shared/Navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="relative">
        {/* Persistent ambient glow throughout page */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[20%] -right-60 w-[50rem] h-[50rem] rounded-full bg-emerald-600/[0.03] blur-[10rem]" />
          <div className="absolute top-[50%] -left-40 w-[40rem] h-[40rem] rounded-full bg-teal-600/[0.025] blur-[8rem]" />
          <div className="absolute top-[75%] right-[10%] w-[35rem] h-[35rem] rounded-full bg-cyan-700/[0.02] blur-[8rem]" />
        </div>
        <Hero />
        <Features />
        <CodeDemo />
        <Pricing />
        <CTA />
        <Footer />
      </main>
    </>
  );
}
