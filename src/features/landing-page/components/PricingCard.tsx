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
    <span className="shrink-0 rounded-card bg-brand-badge p-[clamp(8px,0.5208vw,10px)] text-[clamp(12px,0.7292vw,14px)] leading-none font-medium text-brand">
      Most Popular
    </span>
  );
}

function ChecklistItem({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-[clamp(8px,0.5208vw,10px)]">
      <CheckIcon className="size-[clamp(16px,0.9375vw,18px)]" />
      <span className="text-[clamp(12px,0.7292vw,14px)] leading-[18px] text-white">
        {label}
      </span>
    </li>
  );
}

export function PricingCard({ plan }: PricingCardProps) {
  const ctaHref = "#contact";

  return (
    <article
      className={cn(
        "flex w-full min-w-0 flex-col gap-[clamp(32px,2.0833vw,40px)] overflow-hidden rounded-button border p-[clamp(18px,1.25vw,24px)] lg:min-h-[clamp(480px,31.1979vw,599px)]",
        plan.featured
          ? "border-brand-border bg-brand-bg"
          : "border-border-default bg-surface-default",
      )}
    >
      <div className="flex flex-col gap-[clamp(18px,1.25vw,24px)]">
        <div className="flex size-[clamp(40px,2.5vw,48px)] items-center justify-center rounded-[clamp(8px,0.5208vw,10px)] bg-surface-elevated">
          <Image
            src={plan.iconSrc}
            alt=""
            width={24}
            height={24}
            className="size-[clamp(20px,1.25vw,24px)]"
          />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-[clamp(15px,1.0417vw,20px)]">
            <div className="flex flex-col gap-[clamp(12px,0.8333vw,16px)]">
              <h3 className="text-label leading-3 font-medium text-white">
                {plan.name}
              </h3>
              <p className="text-helper leading-[9px] text-text-muted">
                {plan.audience}
              </p>
            </div>
            <p className="text-helper leading-[9px] text-brand">
              {plan.highlight}
            </p>
          </div>
          {plan.featured && <PlanBadge />}
        </div>
      </div>

      <div className="flex flex-col gap-[clamp(22px,1.4583vw,28px)]">
        {plan.priceLabel ? (
          <p className="text-landing-price-size leading-[clamp(27px,1.6146vw,31px)] font-medium tracking-[-0.01em] text-brand">
            {plan.priceLabel}
          </p>
        ) : (
          <p className="leading-[clamp(27px,1.6146vw,31px)] font-medium text-brand">
            <span className="text-landing-price-size">{plan.price}</span>
            <span className="text-landing-price-suffix-size text-brand/40">
              {plan.priceSuffix}
            </span>
          </p>
        )}

        <ul className="flex flex-col gap-[clamp(12px,0.8333vw,16px)]">
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
          className="mt-auto h-[clamp(44px,2.7083vw,52px)] rounded-button shadow-landing-emerald-glow"
        >
          Contact Sales
        </LandingCtaButton>
      ) : (
        <LandingSecondaryButton
          href={ctaHref}
          fullWidth
          className="mt-auto h-[clamp(44px,2.7083vw,52px)]"
        >
          Contact Sales
        </LandingSecondaryButton>
      )}
    </article>
  );
}
