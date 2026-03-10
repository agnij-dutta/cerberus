import { Hero } from "@/components/marketing/Hero";
import { Features } from "@/components/marketing/Features";
import { CodeDemo } from "@/components/marketing/CodeDemo";
import { Pricing } from "@/components/marketing/Pricing";
import { Footer } from "@/components/marketing/Footer";
import { Navbar } from "@/components/shared/Navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="relative">
        <Hero />
        <Features />
        <CodeDemo />
        <Pricing />
        <Footer />
      </main>
    </>
  );
}
