import { cn } from "@/lib/cn";
import type { DashboardStatusPillStatus } from "../types";

type DashboardStatusPillProps = {
  status: DashboardStatusPillStatus;
  className?: string;
};

const statusConfig: Record<
  DashboardStatusPillStatus,
  { label: string; className: string }
> = {
  completed: {
    label: "Completed",
    className: "bg-[rgba(16,185,129,0.12)] text-status-success",
  },
  generating: {
    label: "In Progress",
    className: "bg-[rgba(255,200,92,0.12)] text-status-running",
  },
  failed: {
    label: "Failed",
    className: "bg-[rgba(217,34,68,0.12)] text-[#d92244]",
  },
  unassigned: {
    label: "Unassigned",
    className: "bg-white/8 text-white/60",
  },
  pending: {
    label: "Pending Review",
    className: "bg-[rgba(0,101,248,0.12)] text-[#0065f8]",
  },
  in_review: {
    label: "In Review",
    className: "bg-[rgba(255,200,92,0.12)] text-status-running",
  },
  changes_requested: {
    label: "Changes Requested",
    className: "bg-[rgba(217,34,68,0.12)] text-[#d92244]",
  },
  approved: {
    label: "Approved",
    className: "bg-[rgba(165,147,224,0.12)] text-[#a593e0]",
  },
  reviewed: {
    label: "Reviewed",
    className: "bg-[rgba(165,147,224,0.12)] text-[#a593e0]",
  },
  sent_for_review: {
    label: "Sent for Review",
    className: "bg-[rgba(0,101,248,0.12)] text-[#0065f8]",
  },
};

function StatusPill({
  label,
  toneClassName,
  className,
}: {
  label: string;
  toneClassName: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-card p-2.5 text-input font-medium whitespace-nowrap",
        toneClassName,
        className,
      )}
    >
      {label}
    </span>
  );
}

export function DashboardStatusPill({
  status,
  className,
}: DashboardStatusPillProps) {
  const config = statusConfig[status];

  return (
    <StatusPill
      label={config.label}
      toneClassName={config.className}
      className={className}
    />
  );
}
