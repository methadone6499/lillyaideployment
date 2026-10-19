"use client";

import { formatDisplayCount } from "@/lib/formatDisplay";

import { Button, Card } from "@/components/ui";

import type { SubscriptionSummary } from "../schemas/billingSchemas";
import {
  formatAmountMinor,
  formatBillingIntervalCopy,
  formatBillingIntervalSuffix,
  formatCountLabel,
  formatPlanName,
  formatStatusLabel,
  formatLocalDate,
} from "../utils/formatBilling";
import type { BillingOwnerCapabilities } from "../utils/selectBillingCapabilities";
import type { BillingPageQuotaView } from "../utils/selectBillingPageQuota";
import { ResumeSubscriptionAction } from "./ResumeSubscriptionAction";

type CurrentSubscriptionCardProps = {
  subscription: SubscriptionSummary;
  canUsePaidFeatures: boolean;
  quotaView: BillingPageQuotaView;
  isQuotaFetching?: boolean;
  onRetryQuota?: () => void;
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
  isQuotaFetching = false,
  onRetryQuota,
  capabilities,
  disabled,
  isPortalPending,
  onOpenPortal,
  onUpgrade,
  onRequestCustom,
}: CurrentSubscriptionCardProps) {
  const periodLabel = subscription.cancel_at_period_end
    ? `Cancels on ${formatLocalDate(subscription.current_period_end)}`
    : `Renews on ${formatLocalDate(subscription.current_period_end)}`;
  const quotaLabel = subscription.scope_type === "company"
    ? "Company report quota"
    : "Report quota";
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
        : "Manage billing";
  const primaryAction = capabilities.canUpgradeToEnterprise
    ? onUpgrade
    : showSalesAction
      ? onRequestCustom
      : onOpenPortal;

  return (
    <Card className="flex min-h-[247px] flex-col p-6">
      <h2 className="sr-only">Current subscription</h2>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-field bg-brand/12 px-2.5 py-2 text-input font-medium leading-none text-brand">
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
        {formatCountLabel(subscription.limits.seats, "seat")} ·{" "}
        {formatCountLabel(subscription.limits.reports, "report")} / period
      </p>
      <p
        className="mt-2 text-input tabular-nums text-text-muted"
        role={quotaView.kind === "error" ? "alert" : quotaView.kind === "loading" ? "status" : undefined}
      >
        {quotaLabel}:{" "}
        {quotaView.kind === "known"
          ? `${formatDisplayCount(quotaView.quota.quota_remaining)} of ${formatCountLabel(quotaView.quota.quota_total, "report")} remaining · ${formatDisplayCount(quotaView.quota.quota_used)} used`
          : quotaView.kind === "unlimited"
            ? "Unlimited report quota"
            : quotaView.kind === "loading"
              ? "Loading…"
              : quotaView.kind === "error"
                ? quotaView.message
                : "Currently unavailable"}
      </p>
      {onRetryQuota && (quotaView.kind === "error" || quotaView.kind === "unavailable") ? (
        <Button
          variant="table"
          size="table"
          className="mt-2 w-fit"
          disabled={isQuotaFetching}
          onClick={onRetryQuota}
        >
          {isQuotaFetching ? "Refreshing…" : "Retry quota"}
        </Button>
      ) : null}
      {quotaView.kind === "known" ? (
        <p className="mt-2 text-helper text-text-muted">
          Quota period: {formatLocalDate(quotaView.quota.period_start)} to{" "}
          {formatLocalDate(quotaView.quota.period_end)}
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
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <ResumeSubscriptionAction key={`${subscription.id}:${subscription.current_period_end}`} subscription={subscription} disabled={disabled} />
          <Button
            disabled={disabled}
            onClick={primaryAction}
          >
            {primaryLabel}
          </Button>
          {showSalesAction || capabilities.canUpgradeToEnterprise ? (
            <Button
              variant="secondary"
              disabled={disabled}
              onClick={onOpenPortal}
            >
              {subscription.cancel_at_period_end
                ? "Manage billing"
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
