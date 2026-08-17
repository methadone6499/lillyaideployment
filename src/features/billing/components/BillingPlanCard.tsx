import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import Image from "next/image";
import type { BillingPlan } from "../schemas/billingSchemas";

type BillingPlanCardProps = {
  plan: BillingPlan;
};

export function BillingPlanCard({ plan }: BillingPlanCardProps) {
  return (
    <Card
      variant={plan.current ? "accent" : "default"}
      className="flex min-h-[546px] min-w-0 flex-col rounded-button p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-label font-medium text-white">{plan.name}</h3>
          <p className="mt-4 text-helper text-text-muted">{plan.audience}</p>
        </div>
        {plan.current ? (
          <span className="rounded-card bg-brand/12 px-2.5 py-2 text-helper font-medium leading-none text-brand">
            Current
          </span>
        ) : null}
      </div>

      <p className="mt-6 leading-none font-medium text-brand">
        {plan.priceLabel ? (
          <span className="text-[42px]">{plan.priceLabel}</span>
        ) : (
          <>
            <span className="text-[42px]">{plan.price}</span>
            <span className="text-card-title text-brand/40">
              {plan.priceSuffix}
            </span>
          </>
        )}
      </p>

      <p
        className={cn(
          "mt-6 rounded-card px-3 py-3 text-helper text-text-muted",
          plan.current ? "bg-white/8" : "bg-surface-default",
        )}
      >
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
              className="size-[18px] shrink-0"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        disabled={plan.current}
        className={cn(
          "mt-auto h-14 w-full text-label",
          plan.current && "border-white/8 bg-white/8",
        )}
        title={
          plan.current
            ? undefined
            : "Available when billing services are connected"
        }
      >
        {plan.ctaLabel}
      </Button>
    </Card>
  );
}
