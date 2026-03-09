import { Hero } from "@/components/marketing/Hero";
import { Features } from "@/components/marketing/Features";
import { CodeDemo } from "@/components/marketing/CodeDemo";
import { Pricing } from "@/components/marketing/Pricing";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <CodeDemo />
      <Pricing />
    </>
  );
}
