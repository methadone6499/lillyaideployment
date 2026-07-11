import { Card } from "@/components/ui/Card";
import type { DashboardQuota } from "../types";

type ReportQuotaCardProps = {
  quota: DashboardQuota;
};

export function ReportQuotaCard({ quota }: ReportQuotaCardProps) {
  return (
    <Card className="flex min-h-[231px] flex-col rounded-button p-6">
      <p className="text-card-title font-medium text-text-heading">Report quota</p>

      <p className="mt-4 flex items-baseline font-medium leading-none">
        <span className="text-[72px] tracking-[-0.02em] text-brand">
          {quota.used}
        </span>
        <span className="text-[36px] tracking-[0.1em] text-text-step">/</span>
        <span className="text-[36px] text-text-step">{quota.total}</span>
      </p>

      <button
        type="button"
        className="mt-auto flex w-full items-center rounded-step-badge border border-dashed border-brand-chip-border bg-brand-bg px-5 py-5 text-left text-label font-medium text-brand transition-colors hover:bg-brand-bg/80"
      >
        + Buy additional reports ({quota.additionalReportPrice} each)
      </button>
    </Card>
  );
}
