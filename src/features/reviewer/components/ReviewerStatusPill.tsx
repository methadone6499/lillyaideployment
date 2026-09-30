import { cn } from "@/lib/cn";
import type { ReviewAssignmentStatus } from "../schemas/reviewerSchemas";

type ReviewerStatusPillProps = {
  status: ReviewAssignmentStatus | "overdue";
  className?: string;
};

const statusConfig: Record<
  ReviewAssignmentStatus | "overdue",
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
  pending: {
    label: "Pending",
    className: "bg-white/8 text-status-in-queue",
  },
  superseded: {
    label: "Superseded",
    className: "bg-white/8 text-text-muted",
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
