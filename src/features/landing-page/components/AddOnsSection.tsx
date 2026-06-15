import {
  addOnFeaturesLeft,
  addOnFeaturesRight,
} from "../data/landingContent";
import { BellIcon, CheckIcon } from "./LandingIcons";
import { LandingSecondaryButton } from "./LandingCtaButton";
import { LandingSection } from "./LandingSection";
import { SectionHeading } from "./SectionHeading";

function AddOnChecklist({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <CheckIcon className="mt-0.5" />
          <span className="text-input leading-6 text-white">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function AddOnsSection() {
  return (
    <LandingSection id="add-ons">
      <div className="flex flex-col items-center gap-14">
        <SectionHeading
          title="Premium Add-on Services"
          subtitle="Enhance HTA evaluation process with expert validation & support"
          titleClassName="text-[42px] leading-[72px]"
        />

        <div className="w-full max-w-[723px] rounded-button border border-border-default bg-surface-default p-6">
          <div className="flex flex-col gap-10">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-[10px] bg-surface-elevated">
                <BellIcon />
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-label font-medium text-white">
                  Expert HTA Review & Validation
                </h3>
                <p className="text-helper text-text-muted">
                  Professional oversight by certified HTA experts
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-24">
              <AddOnChecklist items={addOnFeaturesLeft} />
              <AddOnChecklist items={addOnFeaturesRight} />
            </div>
          </div>

          <div className="my-8 h-px w-full bg-border-default" />

          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-4">
              <p className="text-helper text-text-muted">
                Interested in volume discounts or human-in-the-loop options?
              </p>
              <p className="text-label font-medium text-white">
                Contact us for custom contract pricing
              </p>
            </div>
            <LandingSecondaryButton href="#contact" className="w-full sm:w-[259px]">
              Contact Sales
            </LandingSecondaryButton>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
