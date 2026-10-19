import { featureCards } from "../data/landingContent";
import { FeatureCard } from "./FeatureCard";
import { LandingSection } from "./LandingSection";

export function EvaluationCoverageSection() {
  const rows = [
    featureCards.slice(0, 2),
    featureCards.slice(2, 4),
    featureCards.slice(4, 6),
  ];

  return (
    <LandingSection>
      <div className="flex flex-col gap-12">
        <div className="flex w-full flex-col gap-4">
          <h2 className="text-landing-section-size leading-landing-section-line font-medium tracking-[-0.01em] text-balance text-landing-text-heading">
            Drug and indication specific evaluation
          </h2>
          <p className="max-w-[70ch] text-landing-body-lg-size leading-landing-body-lg-line text-landing-text-subtle">
            Automated searching and comprehensive reporting with GRADE and CASP
            quality assessment
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-[var(--layout-landing-grid-width)] flex-col gap-6">
          {rows.map((row, index) => (
            <div
              key={row[0]?.title ?? index}
              className="grid grid-cols-1 gap-6 lg:grid-cols-2"
            >
              {row.map((card) => (
                <FeatureCard key={card.title} card={card} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
