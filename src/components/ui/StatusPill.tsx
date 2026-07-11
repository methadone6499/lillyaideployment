import { cn } from "@/lib/cn";

export type ReportSectionStatus =
  | "pending"
  | "blocked"
  | "running"
  | "processing"
  | "partially_completed"
  | "completed"
  | "failed";

type StatusPillProps = {
  status: ReportSectionStatus;
  className?: string;
};

const statusConfig: Record<
  ReportSectionStatus,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "text-status-in-queue" },
  blocked: { label: "Blocked", className: "text-status-blocked" },
  running: { label: "Running", className: "text-status-running" },
  processing: { label: "Processing", className: "text-status-running" },
  partially_completed: {
    label: "Partially completed",
    className: "text-status-partial",
  },
  completed: { label: "Completed", className: "text-status-success" },
  failed: { label: "Failed", className: "text-red-400" },
};

export function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "text-card-title font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
