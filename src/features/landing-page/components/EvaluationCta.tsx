import { LandingCtaButton } from "./LandingCtaButton";
import { LandingSection } from "./LandingSection";

export function EvaluationCta() {
  return (
    <LandingSection containerClassName="relative flex justify-center">
      <div
        className="pointer-events-none absolute inset-x-0 top-[calc(50%+44px)] h-[312px] -translate-y-1/2 overflow-hidden"
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landing/evaluation-cta-background.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/8" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-(--layout-landing-cta-panel-width) flex-col items-center gap-[clamp(28px,2.083vw,40px)] rounded-panel border border-white/20 bg-landing-surface-panel px-[23px] py-[clamp(32px,2.135vw,41px)] text-center">
        <h2 className="text-landing-cta-size leading-landing-cta-line font-medium tracking-[-0.01em] text-balance text-text-heading">
          Start your evaluation
        </h2>
        <p className="max-w-[779px] text-body-lg leading-8 text-landing-text-subtle">
          Built for HTA committees and formulary decision-makers to generate
          comprehensive clinical, economic, and technical evaluation dossiers for
          therapies under consideration.
        </p>
        <LandingCtaButton href="/reports/new" fullWidth size="hero">
          Generate evidence report
        </LandingCtaButton>
      </div>
    </LandingSection>
  );
}
