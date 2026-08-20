import { Card } from "@/components/ui/Card";
import type { DashboardQuota } from "../types";

type ReportQuotaCardProps = {
  quota: DashboardQuota;
  isLoading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
};

function formatQuotaValue(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return String(value);
}

export function ReportQuotaCard({
  quota,
  isLoading = false,
  errorMessage = null,
  onRetry,
}: ReportQuotaCardProps) {
  return (
    <Card
      aria-busy={isLoading}
      className="flex min-h-[231px] flex-col rounded-button p-6"
    >
      <p className="text-card-title font-medium text-text-heading">Report quota</p>

      <p className="mt-4 flex items-baseline font-medium leading-none">
        <span className="text-[72px] tracking-[-0.02em] text-brand">
          {formatQuotaValue(quota.used)}
        </span>
        <span className="text-[36px] tracking-[0.1em] text-text-step">/</span>
        <span className="text-[36px] text-text-step">
          {formatQuotaValue(quota.total)}
        </span>
      </p>

      {errorMessage ? (
        <div
          className="mt-4 flex flex-col gap-2 text-helper text-status-running"
          role="alert"
        >
          <p>{errorMessage}</p>
          {onRetry ? (
            <button
              type="button"
              className="self-start rounded-button border border-border-default px-3 py-1.5 text-label font-medium text-white transition-colors hover:bg-surface-elevated"
              onClick={onRetry}
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        className="mt-auto flex w-full items-center rounded-step-badge border border-dashed border-brand-chip-border bg-brand-bg px-5 py-5 text-left text-label font-medium text-brand transition-colors hover:bg-brand-bg/80"
      >
        + Buy additional reports ({quota.additionalReportPrice} each)
      </button>
    </Card>
  );
}
