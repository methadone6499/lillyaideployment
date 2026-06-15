import { Fragment } from "react";
import { whyCards } from "../data/landingContent";
import type { WhyCardContent } from "../types";
import { LandingSection } from "./LandingSection";
import { SectionHeading } from "./SectionHeading";

function WhyCard({ card }: { card: WhyCardContent }) {
  return (
    <article className="flex flex-1 flex-col items-center gap-16 text-center lg:gap-[99px] lg:text-left">
      <div className="relative h-[220px] w-[220px] shrink-0 overflow-hidden sm:h-[280px] sm:w-[270px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.imageUrl}
          alt=""
          className={`absolute max-w-none object-cover ${card.imageClassName ?? "inset-0 h-full w-full"}`}
        />
        <div className="absolute inset-0 bg-landing-background/40" aria-hidden />
      </div>
      <div className="flex w-full max-w-[400px] flex-col gap-9">
        <h3 className="text-[28px] text-landing-text-heading">{card.title}</h3>
        <p className="text-landing-body-size leading-landing-body-line text-landing-text-subtle">
          {card.description}
        </p>
      </div>
    </article>
  );
}

export function WhyChooseSection() {
  return (
    <LandingSection id="why-us" className="pt-[105px]">
      <div className="flex flex-col items-center gap-[63px] px-0 lg:px-[60px]">
        <SectionHeading
          title="Why Choose Lilly HTA?"
          subtitle="Purpose-built for HTA committees and formulary decision-makers to streamline reimbursement evaluation with evidence-based automation."
        />

        <div className="flex w-full flex-col gap-12 lg:flex-row lg:items-stretch lg:justify-between">
          {whyCards.map((card, index) => (
            <Fragment key={card.title}>
              <WhyCard card={card} />
              {index < whyCards.length - 1 && (
                <div
                  className="hidden w-px shrink-0 self-stretch bg-border-default lg:mx-[30px] lg:block"
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
