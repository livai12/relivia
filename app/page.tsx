"use client";

import LandingNavbar from "@/components/landing/LandingNavbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import InsightSection from "@/components/landing/InsightSection";
import Showcase from "@/components/landing/Showcase";
import Trust from "@/components/landing/Trust";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="font-sans min-h-screen bg-bg text-ink">
      <LandingNavbar />
      <Hero />
      <Features />
      <HowItWorks />
      <InsightSection />
      <Showcase />
      <Trust />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
