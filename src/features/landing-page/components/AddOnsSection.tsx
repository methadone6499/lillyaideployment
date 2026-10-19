import {
  addOnFeaturesLeft,
  addOnFeaturesRight,
} from "../data/landingContent";
import { BellIcon, CheckIcon } from "./LandingIcons";
import { LandingSecondaryButton } from "./LandingCtaButton";
import { LandingSection } from "./LandingSection";
import { SectionHeading } from "./SectionHeading";
import styles from "./LandingPage.module.css";

function AddOnChecklist({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <CheckIcon className="mt-0.5" />
          <span className="text-label leading-6 text-white">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function AddOnsSection() {
  return (
    <LandingSection id="add-ons" className={styles.addOnsSection}>
      <div className="flex flex-col items-center gap-12">
        <SectionHeading
          title="Premium add-on services"
          subtitle="Enhance HTA evaluation process with expert validation & support"
        />

        <div className="w-full max-w-[760px] rounded-[var(--landing-radius-card)] border border-border-default bg-surface-default p-6">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-[10px] bg-surface-elevated">
                <BellIcon />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <h3 className="text-card-title leading-7 font-medium text-white">
                  Expert HTA review & validation
                </h3>
                <p className="text-helper leading-4 text-text-muted">
                  Professional oversight by certified HTA experts
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <AddOnChecklist items={addOnFeaturesLeft} />
              <AddOnChecklist items={addOnFeaturesRight} />
            </div>
          </div>

          <div className="my-8 h-px w-full bg-border-default" />

          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-helper leading-4 text-text-muted">
                Interested in volume discounts or human-in-the-loop options?
              </p>
              <p className="text-label leading-6 font-medium text-white">
                Contact us for custom contract pricing
              </p>
            </div>
            <LandingSecondaryButton href="#contact" className="w-full sm:w-auto">
              Contact sales
            </LandingSecondaryButton>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
