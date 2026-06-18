import { cn } from "@/lib/cn";

export type ReportSectionStatus =
  | "complete"
  | "running"
  | "in_queue"
  | "failed";

type StatusPillProps = {
  status: ReportSectionStatus;
  className?: string;
};

const statusConfig: Record<
  ReportSectionStatus,
  { label: string; className: string }
> = {
  complete: { label: "Complete", className: "text-status-success" },
  running: { label: "Running", className: "text-status-running" },
  in_queue: { label: "In Queue", className: "text-status-in-queue" },
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
