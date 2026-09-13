import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { ReviewerKpiCard, ReviewerKpiId } from "../types";

type ReviewerKpiGridProps = {
  kpis: readonly ReviewerKpiCard[];
};

const kpiValueClassName: Record<ReviewerKpiId, string> = {
  total_assigned: "text-brand",
  in_queue: "text-status-in-queue",
  in_review: "text-status-running",
  overdue: "text-[#d92244]",
  completed: "text-brand",
};

function formatKpiValue(value: number): string {
  return String(value).padStart(2, "0");
}

export function ReviewerKpiGrid({ kpis }: ReviewerKpiGridProps) {
  return (
    <section
      aria-label="Reviewer summary"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      {kpis.map((kpi) => (
        <Card
          key={kpi.id}
          className="flex min-h-[150px] min-w-0 flex-col justify-between rounded-button p-6"
        >
          <p className="text-card-title font-medium text-white">{kpi.label}</p>
          <p
            className={cn(
              "text-[64px] font-medium leading-none tracking-[-0.02em]",
              kpiValueClassName[kpi.id],
            )}
          >
            {formatKpiValue(kpi.value)}
          </p>
        </Card>
      ))}
    </section>
  );
}
