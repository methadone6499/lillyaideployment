import { pricingPlans } from "../data/landingContent";
import { LandingSection } from "./LandingSection";
import { PricingCard } from "./PricingCard";
import { SectionHeading } from "./SectionHeading";

export function PricingSection() {
  return (
    <LandingSection id="pricing">
      <div className="flex flex-col items-center gap-14">
        <SectionHeading
          title="Transparent Pricing for Every Organization"
          subtitle="Choose the plan that fits your institution's needs. All plans include comprehensive HTA evaluation capabilities."
        />

        <div className="grid w-full max-w-landing-pricing grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:justify-center">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
