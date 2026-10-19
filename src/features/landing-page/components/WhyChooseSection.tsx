import { Fragment } from "react";
import { whyCards } from "../data/landingContent";
import type { WhyCardContent } from "../types";
import { LandingSection } from "./LandingSection";
import { SectionHeading } from "./SectionHeading";
import { BRAND } from "@/lib/brand";

function WhyCard({ card }: { card: WhyCardContent }) {
  return (
    <article className="flex min-w-0 flex-1 flex-col items-center gap-6 text-center lg:text-left">
      <div className="relative h-[280px] w-[270px] max-w-full shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.imageUrl}
          alt=""
          className={`absolute max-w-none object-contain ${card.imageClassName ?? "inset-0 h-full w-full"}`}
        />
        <div className="absolute inset-0 bg-landing-background/40" aria-hidden />
      </div>
      <div className="flex w-full max-w-[400px] flex-col gap-4">
        <h3 className="text-section-heading leading-8 font-medium text-landing-text-heading">{card.title}</h3>
        <p className="text-landing-body-size leading-landing-body-line text-landing-text-subtle">
          {card.description}
        </p>
      </div>
    </article>
  );
}

export function WhyChooseSection() {
  return (
    <LandingSection id="why-us">
      <div className="flex flex-col items-center gap-12">
        <SectionHeading
          title={`Why choose ${BRAND.name}?`}
          subtitle="Purpose-built for HTA committees and formulary decision-makers to streamline reimbursement evaluation with evidence-based automation."
        />

        <div className="flex w-full flex-col gap-12 lg:flex-row lg:items-stretch lg:justify-between">
          {whyCards.map((card, index) => (
            <Fragment key={card.title}>
              <WhyCard card={card} />
              {index < whyCards.length - 1 && (
                <div
                  className="hidden w-px shrink-0 self-stretch bg-border-default lg:mx-6 lg:block"
                  aria-hidden
                />
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
