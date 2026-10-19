import { formatDisplayCount } from "@/lib/formatDisplay";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { additionalReportPrice } from "../data/dashboardData";
import type { DashboardQuotaView } from "../types";

type ReportQuotaCardProps = {
  view: DashboardQuotaView;
  errorMessage?: string | null;
  onRetry?: () => void;
  showBuyAdditional?: boolean;
};

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
      className="flex min-h-[231px] min-w-0 flex-col p-6"
    >
      <p className="text-card-title font-medium text-text-heading">Report quota</p>

      {view.kind === "unlimited" ? (
        <>
          <p className="mt-4 break-words text-dashboard-card-title font-medium leading-10 tracking-[-0.02em] text-brand">
            Unlimited
          </p>
          <p className="mt-4 text-helper text-text-muted">
            This account is not quota-limited.
          </p>
        </>
      ) : null}

      {view.kind === "unavailable" ? (
        <>
          <p className="mt-4 break-words text-dashboard-card-title font-medium leading-10 tracking-[-0.02em] text-brand">
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
        <p className="mt-4 flex items-baseline tabular-nums font-medium leading-none">
          <span className="text-quota tracking-[-0.02em] text-brand">—</span>
          <span className="text-quota-suffix tracking-[0.1em] text-text-step">/</span>
          <span className="text-quota-suffix text-text-step">—</span>
        </p>
      ) : null}

      {view.kind === "known" ? (
        <p className="mt-4 flex items-baseline tabular-nums font-medium leading-none">
          <span className="text-quota tracking-[-0.02em] text-brand">
            {formatDisplayCount(view.used)}
          </span>
          <span className="text-quota-suffix tracking-[0.1em] text-text-step">/</span>
          <span className="text-quota-suffix text-text-step">
            {formatDisplayCount(view.total)}
          </span>
        </p>
      ) : null}

      {errorMessage ? (
        <div
          className="mt-4 flex flex-col gap-2 text-helper text-status-running"
          role="alert"
        >
          <p>{errorMessage}</p>
          {onRetry ? (
            <Button variant="table" size="table" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}

      {showBuyAdditional && view.kind === "known" ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-auto w-full justify-start"
        >
          + Buy additional reports ({additionalReportPrice} each)
        </Button>
      ) : null}
    </Card>
  );
}
