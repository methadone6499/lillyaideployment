import { pricingPlans } from "../data/landingContent";
import { LandingSection } from "./LandingSection";
import { PricingCard } from "./PricingCard";
import { SectionHeading } from "./SectionHeading";

export function PricingSection() {
  return (
    <LandingSection id="pricing">
      <div className="flex flex-col items-center gap-[clamp(40px,2.917vw,56px)]">
        <SectionHeading
          title="Transparent Pricing for Every Organization"
          subtitle="Choose the plan that fits your institution's needs. All plans include comprehensive HTA evaluation capabilities."
        />

        <div className="mx-auto grid w-full grid-cols-1 gap-[clamp(8px,0.8333vw,16px)] md:grid-cols-2 lg:w-[min(75.1042vw,1442px)] lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
