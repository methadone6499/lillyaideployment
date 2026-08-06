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
      <div className="flex flex-col gap-[clamp(36px,2.5vw,48px)]">
        <div className="mb-4 flex w-full flex-col gap-4 pl-0">
          <h2 className="text-landing-section-size leading-landing-section-line text-landing-text-heading">
            Drug and Indication Specific Evaluation
          </h2>
          <p className="text-[clamp(20px,1.458vw,28px)] leading-[clamp(30px,1.875vw,36px)] text-text-body">
            Automated searching and comprehensive reporting with GRADE and CASP
            quality assessment
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-landing-grid flex-col gap-[clamp(24px,1.667vw,32px)]">
          {rows.map((row, index) => (
            <div
              key={row[0]?.title ?? index}
              className="grid grid-cols-1 gap-[clamp(24px,1.667vw,32px)] lg:grid-cols-2"
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
