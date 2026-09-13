import { cn } from "@/lib/cn";
import type { ReviewerReportStatus } from "../types";

type ReviewerStatusPillProps = {
  status: ReviewerReportStatus;
  className?: string;
};

const statusConfig: Record<
  ReviewerReportStatus,
  { label: string; className: string }
> = {
  completed: {
    label: "Completed",
    className: "bg-[rgba(16,185,129,0.12)] text-status-success",
  },
  in_review: {
    label: "In Review",
    className: "bg-[rgba(255,200,92,0.12)] text-status-running",
  },
  overdue: {
    label: "Overdue",
    className: "bg-[rgba(217,34,68,0.12)] text-[#d92244]",
  },
  in_queue: {
    label: "In Queue",
    className: "bg-white/8 text-status-in-queue",
  },
};

export function ReviewerStatusPill({
  status,
  className,
}: ReviewerStatusPillProps) {
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
