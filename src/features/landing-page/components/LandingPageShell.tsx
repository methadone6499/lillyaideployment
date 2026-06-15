import { AddOnsSection } from "./AddOnsSection";
import { ContactSection } from "./ContactSection";
import { EvaluationCoverageSection } from "./EvaluationCoverageSection";
import { EvaluationCta } from "./EvaluationCta";
import { FinalCtaSection } from "./FinalCtaSection";
import { HeroSection } from "./HeroSection";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { PricingSection } from "./PricingSection";
import { WhyChooseSection } from "./WhyChooseSection";

export function LandingPageShell() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-landing-background font-[family-name:var(--font-inter)] text-white">
      <LandingHeader />
      <main className="mx-auto flex w-full max-w-layout-max flex-col">
        <HeroSection />
        <EvaluationCta />
        <EvaluationCoverageSection />
        <WhyChooseSection />
        <PricingSection />
        <AddOnsSection />
        <FinalCtaSection />
        <ContactSection />
        <LandingFooter />
      </main>
    </div>
  );
}
