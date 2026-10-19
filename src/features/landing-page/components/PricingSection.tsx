import { pricingPlans } from "../data/landingContent";
import { LandingSection } from "./LandingSection";
import { PricingCard } from "./PricingCard";
import { SectionHeading } from "./SectionHeading";
import styles from "./LandingPage.module.css";

export function PricingSection() {
  return (
    <LandingSection id="pricing" className={styles.pricingSection}>
      <div className="flex flex-col items-center gap-12">
        <SectionHeading
          title="Transparent pricing for every organization"
          subtitle="Choose the plan that fits your institution's needs. All plans include comprehensive HTA evaluation capabilities."
        />

        <div className="mx-auto grid w-full max-w-[var(--layout-landing-pricing-width)] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
