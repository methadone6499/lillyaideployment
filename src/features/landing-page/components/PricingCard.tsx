import { cn } from "@/lib/cn";
import type { PricingPlanContent } from "../types";
import { BellIcon, CheckIcon } from "./LandingIcons";
import {
  LandingCtaButton,
  LandingSecondaryButton,
} from "./LandingCtaButton";

type PricingCardProps = {
  plan: PricingPlanContent;
};

function PlanBadge() {
  return (
    <span className="rounded-card bg-brand-badge px-2.5 py-2.5 text-[14px] font-medium text-brand">
      Most Popular
    </span>
  );
}

function ChecklistItem({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <CheckIcon className="mt-0.5" />
      <span className="text-input leading-normal text-white">{label}</span>
    </li>
  );
}

export function PricingCard({ plan }: PricingCardProps) {
  const ctaHref = "#contact";

  return (
    <article
      className={cn(
        "flex w-full max-w-[470px] flex-col gap-10 rounded-button border p-6",
        plan.featured
          ? "border-brand-border bg-brand-bg"
          : "border-border-default bg-surface-default",
      )}
    >
      <div className="flex flex-col gap-6">
        <div className="flex size-12 items-center justify-center rounded-[10px] bg-surface-elevated">
          <BellIcon />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <h3 className="text-label font-medium text-white">{plan.name}</h3>
              <p className="text-helper text-text-muted">{plan.audience}</p>
            </div>
            <p className="text-helper text-brand">{plan.highlight}</p>
          </div>
          {plan.featured && <PlanBadge />}
        </div>
      </div>

      <div className="flex flex-col gap-7">
        {plan.priceLabel ? (
          <p className="text-landing-price-size font-medium tracking-[-0.01em] text-brand">
            {plan.priceLabel}
          </p>
        ) : (
          <p className="font-medium text-brand">
            <span className="text-landing-price-size">{plan.price}</span>
            <span className="text-landing-price-suffix-size text-brand/40">
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
          href={ctaHref}
          fullWidth
          showArrow={false}
          className="h-[52px] rounded-button shadow-landing-emerald-glow"
        >
          Contact Sales
        </LandingCtaButton>
      ) : (
        <LandingSecondaryButton href={ctaHref} fullWidth>
          Contact Sales
        </LandingSecondaryButton>
      )}
    </article>
  );
}
