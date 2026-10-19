"use client";

import { storePlanIntent } from "@/features/billing";
import { cn } from "@/lib/cn";
import Image from "next/image";
import type { PricingPlanContent } from "../types";
import { CheckIcon } from "./LandingIcons";
import {
  LandingCtaButton,
  LandingSecondaryButton,
} from "./LandingCtaButton";

type PricingCardProps = {
  plan: PricingPlanContent;
};

function PlanBadge() {
  return (
    <span className="inline-flex h-[30px] shrink-0 items-center rounded-[var(--landing-radius-badge)] bg-brand-badge px-2.5 text-input leading-5 font-medium text-brand">
      Most popular
    </span>
  );
}

function ChecklistItem({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <CheckIcon className="mt-0.5 size-5" />
      <span className="text-label leading-6 text-white">
        {label}
      </span>
    </li>
  );
}

export function PricingCard({ plan }: PricingCardProps) {
  const persistPlanIntent = () => {
    storePlanIntent(plan.id);
  };

  return (
    <article
      className={cn(
        "flex w-full min-w-0 flex-col gap-8 rounded-[var(--landing-radius-card)] border p-6 lg:min-h-[512px]",
        plan.featured
          ? "border-brand-border bg-brand-bg"
          : "border-border-default bg-surface-default",
      )}
    >
      <div className="flex flex-col gap-6">
        <div className="flex size-12 items-center justify-center rounded-field bg-surface-elevated">
          <Image
            src={plan.iconSrc}
            alt=""
            width={24}
            height={24}
            className="size-6"
          />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-card-title leading-7 font-medium text-white">
                {plan.name}
              </h3>
              <p className="text-helper leading-4 text-text-muted">
                {plan.audience}
              </p>
            </div>
            <p className="text-helper leading-4 text-brand">
              {plan.highlight}
            </p>
          </div>
          {plan.featured && <PlanBadge />}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {plan.priceLabel ? (
          <p className="text-landing-price-size leading-[48px] font-medium tracking-[-0.01em] text-brand">
            {plan.priceLabel}
          </p>
        ) : (
          <p className="flex flex-wrap items-baseline gap-1 leading-[48px] font-medium tabular-nums text-brand">
            <span className="text-landing-price-size">{plan.price}</span>
            <span className="text-landing-price-suffix-size leading-7 text-text-muted">
              {plan.priceSuffix}
            </span>
          </p>
        )}

        <ul className="flex flex-col gap-4">
          {plan.features.map((feature) => (
            <ChecklistItem key={feature} label={feature} />
          ))}
        </ul>
      </div>

      {plan.ctaVariant === "primary" ? (
        <LandingCtaButton
          href={plan.ctaHref}
          onClick={persistPlanIntent}
          fullWidth
          showArrow={false}
          className="mt-auto"
        >
          {plan.ctaLabel}
        </LandingCtaButton>
      ) : (
        <LandingSecondaryButton
          variant="pricing"
          href={plan.ctaHref}
          onClick={persistPlanIntent}
          fullWidth
          className="mt-auto"
        >
          {plan.ctaLabel}
        </LandingSecondaryButton>
      )}
    </article>
  );
}
