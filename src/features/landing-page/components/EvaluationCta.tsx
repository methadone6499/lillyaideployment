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

      <div className="relative z-10 mx-auto flex w-full max-w-(--layout-landing-cta-panel-width) flex-col items-center gap-10 rounded-panel border border-white/20 bg-landing-surface-panel px-[23px] py-10 text-center sm:py-[41px]">
        <h2 className="text-landing-cta-size leading-landing-cta-line font-medium text-text-heading">
          Start Your Evaluation
        </h2>
        <p className="max-w-[779px] text-landing-body-size leading-landing-body-line text-landing-text-subtle">
          Built for HTA committees and formulary decision-makers to generate
          comprehensive clinical, economic, and technical evaluation dossiers for
          therapies under consideration.
        </p>
        <LandingCtaButton href="/reports/new" fullWidth className="max-w-none">
          Generate Evidence Report
        </LandingCtaButton>
      </div>
    </LandingSection>
  );
}
