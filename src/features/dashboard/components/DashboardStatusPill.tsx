import { cn } from "@/lib/cn";
import type { DashboardReportStatus } from "../types";

type DashboardStatusPillProps = {
  status: DashboardReportStatus;
  className?: string;
};

const statusConfig: Record<
  DashboardReportStatus,
  { label: string; className: string }
> = {
  completed: {
    label: "Completed",
    className: "bg-[rgba(16,185,129,0.12)] text-status-success",
  },
  sent_for_review: {
    label: "Sent for Review",
    className: "bg-[rgba(0,101,248,0.12)] text-[#0065f8]",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-[rgba(255,200,92,0.12)] text-status-running",
  },
  reviewed: {
    label: "Reviewed",
    className: "bg-[rgba(165,147,224,0.12)] text-[#a593e0]",
  },
  failed: {
    label: "Failed",
    className: "bg-[rgba(217,34,68,0.12)] text-[#d92244]",
  },
};

export function DashboardStatusPill({
  status,
  className,
}: DashboardStatusPillProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-card p-2.5 text-input font-medium whitespace-nowrap",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
