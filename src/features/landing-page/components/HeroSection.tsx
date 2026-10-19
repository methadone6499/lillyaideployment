import { GradientText } from "./GradientText";
import { LandingSection } from "./LandingSection";

export function HeroSection() {
  return (
    <LandingSection
      className="pt-12 pb-0 md:pt-16"
      containerClassName="flex justify-center"
    >
      <div className="flex w-full max-w-3xl flex-col items-center gap-[var(--layout-landing-hero-gap)] text-center">
        <div className="flex flex-col items-center gap-[var(--layout-landing-hero-title-gap)]">
          <p className="text-landing-body-size font-medium">
            <span className="text-brand">Drug evaluation assistant</span>
          </p>
          <h1 className="text-landing-hero-size leading-landing-hero-line font-medium tracking-[-0.02em] text-balance text-landing-text-heading">
            <span className="block">
              Comprehensive <GradientText>HTA</GradientText>
            </span>
            <span className="block">
              <GradientText>evaluation</GradientText> platform
            </span>
          </h1>
        </div>
        <p className="max-w-[70ch] text-landing-body-lg-size leading-landing-body-lg-line text-landing-text-subtle">
          Eliminate evidence gaps and streamline collaborative HTA and
          formulary decision-making with comprehensive, committee-ready
          evaluations.
        </p>
      </div>
    </LandingSection>
  );
}
