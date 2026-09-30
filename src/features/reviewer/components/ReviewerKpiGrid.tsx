import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { ReviewerDashboardStats } from "../schemas/reviewerSchemas";

type ReviewerKpiGridProps = {
  stats: ReviewerDashboardStats;
};

const kpis = [
  { key: "incoming_reports", label: "Incoming Assignments", className: "text-brand" },
  { key: "assigned_reports", label: "Pending Assignments", className: "text-status-in-queue" },
  { key: "in_review", label: "In Review", className: "text-status-running" },
  { key: "completed_reports", label: "Completed Assignments", className: "text-brand" },
  { key: "overdue_reports", label: "Overdue Assignments", className: "text-[#d92244]" },
] as const satisfies readonly {
  key: keyof ReviewerDashboardStats;
  label: string;
  className: string;
}[];

function formatKpiValue(value: number): string {
  return String(value).padStart(2, "0");
}

export function ReviewerKpiGrid({ stats }: ReviewerKpiGridProps) {
  return (
    <section
      aria-label="Reviewer summary"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      {kpis.map((kpi) => (
        <Card
          key={kpi.key}
          className="flex min-h-[150px] min-w-0 flex-col justify-between rounded-button p-6"
        >
          <p className="text-card-title font-medium text-white">{kpi.label}</p>
          <p
            className={cn(
              "text-[64px] font-medium leading-none tracking-[-0.02em]",
              kpi.className,
            )}
          >
            {formatKpiValue(stats[kpi.key])}
          </p>
        </Card>
      ))}
    </section>
  );
}
