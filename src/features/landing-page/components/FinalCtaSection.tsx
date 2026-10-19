import Image from "next/image";
import { GradientText } from "./GradientText";
import { LandingCtaButton } from "./LandingCtaButton";
import { LandingSection } from "./LandingSection";
import { BRAND } from "@/lib/brand";

export function FinalCtaSection() {
  return (
    <LandingSection className="py-0">
      <div className="relative overflow-hidden rounded-none">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <Image
            src="/landing/reimbursement-cta-background.jpg"
            alt=""
            fill
            sizes="(min-width: 1504px) 1440px, 100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-black/56" aria-hidden />

        <div className="relative flex min-h-[420px] flex-col items-center justify-center gap-8 px-6 py-16 text-center md:py-24">
          <div className="flex w-full flex-col items-center gap-6">
            <h2 className="text-landing-hero-size leading-landing-hero-line font-medium tracking-[-0.02em] text-balance text-landing-text-heading">
              <span className="block">
                Ready to <GradientText>streamline</GradientText> your
              </span>
              <span className="block">
                reimbursement decisions?
              </span>
            </h2>
            <p className="max-w-[70ch] text-landing-body-lg-size leading-landing-body-lg-line text-landing-text-subtle">
              {`Join HTA committees and formulary decision-makers who rely on ${BRAND.name} for comprehensive, evidence-based evaluation packages.`}
            </p>
          </div>

          <LandingCtaButton href="/reports/new">Get started now</LandingCtaButton>
        </div>
      </div>
    </LandingSection>
  );
}
