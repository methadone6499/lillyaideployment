"use client";

import { useAuthUser } from "@/features/auth";
import {
  ActivateEnterpriseDialog,
  canActivateEnterprise,
} from "@/features/enterprise-activation";
import { useState } from "react";
import type { BillingPlan } from "../schemas/billingSchemas";
import { BillingPlanCard } from "./BillingPlanCard";

type BillingPlansSectionProps = {
  plans: BillingPlan[];
};

function plansForActivation(
  plans: BillingPlan[],
  canActivate: boolean,
): BillingPlan[] {
  if (!canActivate) {
    return plans;
  }

  return plans.map((plan) =>
    plan.id === "enterprise"
      ? {
          ...plan,
          current: false,
          ctaLabel: "Activate Enterprise",
        }
      : plan,
  );
}

export function BillingPlansSection({ plans }: BillingPlansSectionProps) {
  const { authMe } = useAuthUser();
  const canActivate = canActivateEnterprise(authMe);
  const [dialogOpen, setDialogOpen] = useState(false);
  const resolvedPlans = plansForActivation(plans, canActivate);

  return (
    <>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resolvedPlans.map((plan) => (
          <BillingPlanCard
            key={plan.id}
            plan={plan}
            onCtaClick={
              canActivate && plan.id === "enterprise"
                ? () => setDialogOpen(true)
                : undefined
            }
          />
        ))}
      </div>
      {canActivate && dialogOpen ? (
        <ActivateEnterpriseDialog
          open
          onClose={() => setDialogOpen(false)}
        />
      ) : null}
    </>
  );
}
