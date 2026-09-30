"use client";

import Image from "next/image";

import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";

import type { PlanType } from "../schemas/billingSchemas";
import type {
  BillingPlanCardAction,
  BillingPlanCardModel,
} from "../utils/selectBillingPlanCards";

type BillingPlanCardProps = {
  plan: BillingPlanCardModel;
  onAction: (action: BillingPlanCardAction, plan: PlanType) => void;
};

export function BillingPlanCard({ plan, onAction }: BillingPlanCardProps) {
  const helperId = `billing-plan-${plan.id}-helper`;

  return (
    <Card
      variant={plan.current ? "accent" : "default"}
      className="flex min-h-[512px] min-w-0 flex-col rounded-button p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-label font-medium text-white">{plan.name}</h3>
          <p className="mt-4 text-helper text-text-muted">{plan.audience}</p>
        </div>
        {plan.current ? (
          <span className="shrink-0 rounded-card bg-brand/12 px-2.5 py-2 text-helper font-medium leading-none text-brand">
            Current
          </span>
        ) : null}
      </div>

      <p className="mt-6 leading-none font-medium text-brand">
        <span className="text-[42px]">{plan.priceLabel}</span>
        {plan.priceSuffix ? (
          <span className="text-card-title text-brand/40">{plan.priceSuffix}</span>
        ) : null}
      </p>

      <p className="mt-6 rounded-card bg-surface-default px-3 py-3 text-helper text-text-muted">
        {plan.allowance}
      </p>

      <ul className="mt-8 flex flex-col gap-4">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2.5 text-input text-white"
          >
            <Image
              src="/billing/check.svg"
              alt=""
              width={18}
              height={18}
              className="size-[18px] shrink-0 object-contain"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        {plan.helper ? (
          <p id={helperId} className="mb-3 text-helper text-text-muted">
            {plan.helper}
          </p>
        ) : null}
        <Button
          variant={plan.action === "upgrade" ? "primary" : "secondary"}
          disabled={plan.disabled}
          aria-describedby={plan.helper ? helperId : undefined}
          onClick={() => onAction(plan.action, plan.id)}
          className={cn(
            "h-14 w-full text-label",
            plan.current && "border-white/8 bg-white/8",
          )}
        >
          {plan.ctaLabel}
        </Button>
      </div>
    </Card>
  );
}
