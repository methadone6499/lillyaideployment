import type { Ref } from "react";
import { DOSAGE_RESULT_PREVIEW_FIXTURE } from "../data/dosageCalculatorFixtures";
import { EconomicImpactCard } from "./EconomicImpactCard";
import { RecommendedDosageCard } from "./RecommendedDosageCard";
import { SafetyFlagsCard } from "./SafetyFlagsCard";

type DosageCalculatorResultsProps = {
  headingRef?: Ref<HTMLHeadingElement>;
};

/**
 * Static Figma preview for UI development. The displayed content is not a
 * calculated dosage or an API response.
 */
export function DosageCalculatorResults({
  headingRef,
}: DosageCalculatorResultsProps) {
  const preview = DOSAGE_RESULT_PREVIEW_FIXTURE;

  return (
    <section
      aria-labelledby="dosage-results-heading"
      className="flex w-full min-w-0 flex-col gap-4"
    >
      <h2
        ref={headingRef}
        id="dosage-results-heading"
        tabIndex={-1}
        className="sr-only outline-none"
      >
        Dosage calculation preview
      </h2>

      <RecommendedDosageCard recommendation={preview.recommendation} />
      <SafetyFlagsCard flags={preview.safetyFlags} />
      <EconomicImpactCard impact={preview.economicImpact} />

      <aside
        aria-label="Medical disclaimer"
        className="rounded-card bg-surface-default px-5 py-5"
      >
        <p className="text-input leading-5.5 text-text-muted">
          <span className="text-text-heading">Disclaimer:</span>{" "}
          {preview.disclaimer}
        </p>
      </aside>
    </section>
  );
}
