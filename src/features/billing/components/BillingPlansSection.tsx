import type { PlanType } from "../schemas/billingSchemas";
import type {
  BillingPlanCardAction,
  BillingPlanCardModel,
} from "../utils/selectBillingPlanCards";
import { BillingPlanCard } from "./BillingPlanCard";

type BillingPlansSectionProps = {
  plans: BillingPlanCardModel[];
  onAction: (action: BillingPlanCardAction, plan: PlanType) => void;
};

export function BillingPlansSection({ plans, onAction }: BillingPlansSectionProps) {
  return (
    <section
      aria-labelledby="change-plan-heading"
      className="mt-12 max-w-[1488px]"
    >
      <h2
        id="change-plan-heading"
        className="text-card-title font-medium text-white"
      >
        Change plan
      </h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <BillingPlanCard key={plan.id} plan={plan} onAction={onAction} />
        ))}
      </div>
    </section>
  );
}
