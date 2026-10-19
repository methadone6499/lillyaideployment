"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui";
import { hasPermission, useAuthUser } from "@/features/auth";
import { cn } from "@/lib/cn";
import { formatDisplayCount } from "@/lib/formatDisplay";

import { useCompanyQuota } from "../hooks/useCompanyQuota";
import { useDismissQuotaRedistributionMutation } from "../hooks/useDismissQuotaRedistributionMutation";
import { classifyQuotaRedistributionError } from "../utils/classifyQuotaError";

type QuotaRedistributionPromptProps = {
  /** Where to assign quota; omit when already on the seat management page. */
  assignQuotaHref?: string;
  className?: string;
};

/**
 * Persistent after a plan change until a quota manager explicitly dismisses
 * it; assigning quota alone does not complete it.
 */
export function QuotaRedistributionPrompt({
  assignQuotaHref,
  className,
}: QuotaRedistributionPromptProps) {
  const { authMe } = useAuthUser();
  const canManageQuota = hasPermission(authMe, "company:quota_manage");
  const quotaQuery = useCompanyQuota({ enabled: canManageQuota });
  const dismissMutation = useDismissQuotaRedistributionMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const summary = quotaQuery.data;

  if (!canManageQuota || !summary?.redistribution?.required) {
    return null;
  }

  const handleDismiss = async () => {
    setErrorMessage(null);

    try {
      await dismissMutation.mutateAsync(summary.quota_period_id);
    } catch (error) {
      const classified = classifyQuotaRedistributionError(error);
      setErrorMessage(classified.refetch ? null : classified.message);
    }
  };

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-3 rounded-surface border border-brand-border bg-brand-bg p-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="text-label font-medium text-white">
          {summary.redistribution.trigger_type === "custom_offer"
            ? "Your Custom plan terms changed."
            : "Your plan changed."}{" "}
          Redistribute report quota to your seat users.
        </p>
        <p className="text-helper tabular-nums text-text-muted">
          You hold {formatDisplayCount(summary.quota_unallocated)} of {formatDisplayCount(summary.quota_total)}{" "}
          {summary.quota_total === 1 ? "report" : "reports"}
          for this period. Seat users can only generate reports after you
          assign quota to them.
        </p>
        {errorMessage ? (
          <p role="alert" className="text-helper text-status-running">
            {errorMessage}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {assignQuotaHref ? (
          <Link
            href={assignQuotaHref}
            className="inline-flex h-[52px] items-center justify-center rounded-button bg-brand px-5 text-label font-medium text-brand-foreground transition-colors hover:bg-[#059669]"
          >
            Assign quota
          </Link>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          size="small" className="text-label"
          disabled={dismissMutation.isPending}
          onClick={() => {
            void handleDismiss();
          }}
        >
          {dismissMutation.isPending ? "Dismissing..." : "Dismiss"}
        </Button>
      </div>
    </div>
  );
}
