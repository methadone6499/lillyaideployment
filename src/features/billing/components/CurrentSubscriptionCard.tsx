"use client";

import { Button, Card } from "@/components/ui";

import type { SubscriptionSummary } from "../schemas/billingSchemas";
import {
  formatAmountMinor,
  formatBillingIntervalCopy,
  formatBillingIntervalSuffix,
  formatPlanName,
  formatStatusLabel,
  formatUtcDate,
} from "../utils/formatBilling";
import type {
  BillingOwnerCapabilities,
  BillingQuotaView,
} from "../utils/selectBillingCapabilities";

type CurrentSubscriptionCardProps = {
  subscription: SubscriptionSummary;
  canUsePaidFeatures: boolean;
  quotaView: BillingQuotaView;
  capabilities: BillingOwnerCapabilities;
  disabled: boolean;
  isPortalPending: boolean;
  onOpenPortal: () => void;
  onUpgrade: () => void;
  onRequestCustom: () => void;
};

export function CurrentSubscriptionCard({
  subscription,
  canUsePaidFeatures,
  quotaView,
  capabilities,
  disabled,
  isPortalPending,
  onOpenPortal,
  onUpgrade,
  onRequestCustom,
}: CurrentSubscriptionCardProps) {
  const periodLabel = subscription.cancel_at_period_end
    ? `Cancels on ${formatUtcDate(subscription.current_period_end)}`
    : `Renews on ${formatUtcDate(subscription.current_period_end)}`;
  const seatLabel = subscription.limits.seats === 1 ? "seat" : "seats";
  const showSalesAction =
    subscription.plan_type !== "standard" && capabilities.canRequestCustom;
  const primaryLabel = isPortalPending
    ? "Opening portal..."
    : capabilities.canUpgradeToEnterprise
      ? "Upgrade to Enterprise"
      : showSalesAction
        ? subscription.plan_type === "custom"
          ? "Request new terms"
          : "Request Custom plan"
        : subscription.cancel_at_period_end
          ? "Resume plan"
          : "Manage billing";
  const primaryAction = capabilities.canUpgradeToEnterprise
    ? onUpgrade
    : showSalesAction
      ? onRequestCustom
      : onOpenPortal;

  return (
    <Card className="flex min-h-[247px] flex-col rounded-button p-6">
      <h2 className="sr-only">Current subscription</h2>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-card bg-brand/12 px-2.5 py-2 text-input font-medium leading-none text-brand">
          {formatPlanName(subscription.plan_type)}
        </span>
        <span className="text-input font-medium text-white">{periodLabel}</span>
        <span className="text-input text-text-muted">
          {formatStatusLabel(subscription.status)}
        </span>
      </div>

      <p className="mt-4 leading-none font-medium text-brand">
        <span className="text-[42px]">
          {formatAmountMinor(subscription.amount_minor, subscription.currency)}
        </span>
        <span className="text-card-title text-brand/40">
          {formatBillingIntervalSuffix(subscription.billing_interval)}
        </span>
      </p>

      <p className="mt-3 text-input font-medium text-text-body">
        Billed {formatBillingIntervalCopy(subscription.billing_interval)} ·{" "}
        {subscription.limits.seats} {seatLabel} · {subscription.limits.reports}{" "}
        reports / period
      </p>
      <p className="mt-2 text-input text-text-muted">
        {quotaView.kind === "known"
          ? `${quotaView.quota.quota_remaining} of ${quotaView.quota.quota_total} reports remaining · ${quotaView.quota.quota_used} used`
          : quotaView.kind === "unlimited"
            ? "Unlimited report quota"
            : "Report quota is currently unavailable"}
      </p>
      {quotaView.kind === "known" ? (
        <p className="mt-2 text-helper text-text-muted">
          Quota period: {formatUtcDate(quotaView.quota.period_start)} to{" "}
          {formatUtcDate(quotaView.quota.period_end)}
        </p>
      ) : null}
      {!canUsePaidFeatures ? (
        <p className="mt-3 text-helper text-status-running" role="status">
          Paid features are currently unavailable.{" "}
          {capabilities.canOpenPortal
            ? "Manage billing to review your subscription."
            : "Contact your billing owner to review the subscription."}
        </p>
      ) : null}
      {capabilities.canOpenPortal ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            className="h-12 text-label"
            disabled={disabled}
            onClick={primaryAction}
          >
            {primaryLabel}
          </Button>
          {showSalesAction || capabilities.canUpgradeToEnterprise ? (
            <Button
              variant="secondary"
              className="h-12 text-label"
              disabled={disabled}
              onClick={onOpenPortal}
            >
              {subscription.cancel_at_period_end
                ? "Resume plan"
                : canUsePaidFeatures
                  ? "Cancel plan"
                  : "Manage billing"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
