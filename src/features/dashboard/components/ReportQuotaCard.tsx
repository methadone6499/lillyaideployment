import { Card } from "@/components/ui/Card";
import { additionalReportPrice } from "../data/dashboardData";
import type { DashboardQuotaView } from "../types";

type ReportQuotaCardProps = {
  view: DashboardQuotaView;
  errorMessage?: string | null;
  onRetry?: () => void;
  showBuyAdditional?: boolean;
};

function formatQuotaValue(value: number): string {
  return String(value);
}

export function ReportQuotaCard({
  view,
  errorMessage = null,
  onRetry,
  showBuyAdditional = true,
}: ReportQuotaCardProps) {
  const isLoading = view.kind === "loading";

  return (
    <Card
      aria-busy={isLoading}
      className="flex min-h-[231px] flex-col rounded-button p-6"
    >
      <p className="text-card-title font-medium text-text-heading">Report quota</p>

      {view.kind === "unlimited" ? (
        <>
          <p className="mt-4 text-[72px] font-medium leading-none tracking-[-0.02em] text-brand">
            Unlimited
          </p>
          <p className="mt-4 text-helper text-text-muted">
            This account is not quota-limited.
          </p>
        </>
      ) : null}

      {view.kind === "unavailable" ? (
        <>
          <p className="mt-4 text-[72px] font-medium leading-none tracking-[-0.02em] text-brand">
            Unavailable
          </p>
          {errorMessage ? null : (
            <p className="mt-4 text-helper text-text-muted">
              No matching quota period is available. This is not unlimited
              access.
            </p>
          )}
        </>
      ) : null}

      {view.kind === "loading" ? (
        <p className="mt-4 flex items-baseline font-medium leading-none">
          <span className="text-[72px] tracking-[-0.02em] text-brand">—</span>
          <span className="text-[36px] tracking-[0.1em] text-text-step">/</span>
          <span className="text-[36px] text-text-step">—</span>
        </p>
      ) : null}

      {view.kind === "known" ? (
        <p className="mt-4 flex items-baseline font-medium leading-none">
          <span className="text-[72px] tracking-[-0.02em] text-brand">
            {formatQuotaValue(view.used)}
          </span>
          <span className="text-[36px] tracking-[0.1em] text-text-step">/</span>
          <span className="text-[36px] text-text-step">
            {formatQuotaValue(view.total)}
          </span>
        </p>
      ) : null}

      {view.kind === "known" ? (
        <p className="mt-4 text-helper text-text-muted">
          {view.remaining} remaining. Remaining quota is informational; report
          generation is confirmed by the server.
        </p>
      ) : null}

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

      {showBuyAdditional && view.kind === "known" ? (
        <button
          type="button"
          className="mt-auto flex w-full items-center rounded-step-badge border border-dashed border-brand-chip-border bg-brand-bg px-5 py-5 text-left text-label font-medium text-brand transition-colors hover:bg-brand-bg/80"
        >
          + Buy additional reports ({additionalReportPrice} each)
        </button>
      ) : null}
    </Card>
  );
}
