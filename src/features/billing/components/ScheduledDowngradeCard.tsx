"use client";

import { Button, Card } from "@/components/ui";
import { formatDisplayCount } from "@/lib/formatDisplay";

import type {
  PlanChangeState,
  SubscriptionSummary,
} from "../schemas/billingSchemas";
import { formatLocalDate } from "../utils/formatBilling";

type ScheduledDowngradeCardProps = {
  planChange: PlanChangeState;
  subscription: SubscriptionSummary | null;
  canCancel: boolean;
  isCancelPending: boolean;
  disabled: boolean;
  onCancelDowngrade: () => void;
};

export function ScheduledDowngradeCard({
  planChange,
  subscription,
  canCancel,
  isCancelPending,
  disabled,
  onCancelDowngrade,
}: ScheduledDowngradeCardProps) {
  const effectiveLabel = planChange.effective_at
    ? formatLocalDate(planChange.effective_at)
    : "your next renewal";

  return (
    <Card className="mt-12 flex max-w-[1488px] flex-col gap-4 p-6">
      <h2 className="text-card-title font-medium text-white">
        Enterprise downgrade scheduled
      </h2>
      <p className="text-input text-text-body" role="status">
        Your downgrade to Enterprise is scheduled for {effectiveLabel}. Your
        Custom plan remains active until then.
      </p>
      <dl className="grid gap-3 text-input sm:grid-cols-2">
        <div className="rounded-surface bg-surface-subtle p-4">
          <dt className="text-helper text-text-muted">Active now (Custom)</dt>
          <dd className="mt-1 tabular-nums font-medium text-white">
            {subscription
              ? `${formatDisplayCount(subscription.limits.seats)} seats · ${formatDisplayCount(subscription.limits.reports)} reports / month`
              : "Custom limits"}
          </dd>
        </div>
        <div className="rounded-surface bg-surface-subtle p-4">
          <dt className="text-helper text-text-muted">
            From {effectiveLabel} (Enterprise)
          </dt>
          <dd className="mt-1 font-medium text-white">
            10 seats · 100 reports / month
          </dd>
        </div>
      </dl>
      <p className="text-helper text-text-muted">
        Until the switch, new invitations cannot take occupied and pending
        seats above 10, and quota allocations cannot exceed 100 reports.
      </p>
      {canCancel ? (
        <Button
          type="button"
          variant="secondary"
          size="table" className="w-fit text-label"
          disabled={disabled}
          onClick={onCancelDowngrade}
        >
          {isCancelPending ? "Cancelling..." : "Cancel downgrade"}
        </Button>
      ) : null}
    </Card>
  );
}
