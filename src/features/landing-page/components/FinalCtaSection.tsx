import { GradientText } from "./GradientText";
import { LandingCtaButton } from "./LandingCtaButton";
import { LandingSection } from "./LandingSection";

export function FinalCtaSection() {
  return (
    <LandingSection className="py-0">
      <div className="relative overflow-hidden rounded-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.12), transparent 35%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.08), transparent 25%), radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "auto, auto, 28px 28px",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-black/56" aria-hidden />

        <div className="relative flex min-h-[420px] flex-col items-center justify-center gap-16 px-6 py-24 text-center sm:min-h-[560px]">
          <div className="flex w-full flex-col items-center gap-12">
            <div className="flex flex-col items-center gap-8">
              <div className="flex flex-wrap items-center justify-center gap-5 text-landing-hero-size leading-landing-hero-line text-landing-text-heading">
                <span>Ready to</span>
                <GradientText>Streamline</GradientText>
                <span>Your</span>
              </div>
              <p className="text-landing-hero-size leading-landing-hero-line text-landing-text-heading">
                Reimbursement Decisions?
              </p>
            </div>
            <p className="max-w-[711px] text-[20px] leading-8 text-landing-text-subtle">
              Join HTA committees and formulary decision-makers who rely on
              Lilly HTA for comprehensive, evidence-based evaluation packages.
            </p>
          </div>

          <LandingCtaButton href="/reports/new">Get Started Now</LandingCtaButton>
        </div>
      </div>
    </LandingSection>
  );
}
