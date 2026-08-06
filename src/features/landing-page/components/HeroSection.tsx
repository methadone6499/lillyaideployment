import { GradientText } from "./GradientText";
import { LandingSection } from "./LandingSection";

export function HeroSection() {
  return (
    <LandingSection
      className="pt-[clamp(32px,2.5vw,48px)] pb-0"
      containerClassName="flex justify-center"
    >
      <div className="flex w-full max-w-3xl flex-col items-center gap-[var(--layout-landing-hero-gap)] text-center">
        <div className="flex flex-col items-center gap-[var(--layout-landing-hero-title-gap)]">
          <p className="text-landing-body-size font-medium tracking-[-0.01em]">
            <GradientText>Drug Evaluation Assistant</GradientText>
          </p>
          <h1 className="text-landing-hero-size leading-landing-hero-line text-landing-text-heading">
            <span className="block">
              Comprehensive <GradientText>HTA</GradientText>
            </span>
            <span className="block">
              <GradientText>Evaluation</GradientText> Platform
            </span>
          </h1>
        </div>
        <p className="max-w-2xl text-landing-body-size leading-landing-body-line text-landing-text-subtle">
          Eliminate evidence gaps and streamline collaborative HTA and
          formulary decision-making with comprehensive, committee-ready
          evaluations.
        </p>
      </div>
    </LandingSection>
  );
}
