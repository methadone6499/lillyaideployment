"use client";

import { ChevronDownIcon, FilterLinesIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useEffect, useId, useRef, useState } from "react";
import type { DashboardReportStatus } from "../types";

export type DashboardStatusFilterValue = DashboardReportStatus | "all";

const STATUS_FILTER_OPTIONS: {
  value: DashboardStatusFilterValue;
  label: string;
}[] = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "sent_for_review", label: "Sent for Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "reviewed", label: "Reviewed" },
  { value: "failed", label: "Failed" },
];

type DashboardStatusFilterProps = {
  value: DashboardStatusFilterValue;
  onChange: (value: DashboardStatusFilterValue) => void;
};

export function DashboardStatusFilter({
  value,
  onChange,
}: DashboardStatusFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const listboxId = `${id}-listbox`;

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSelect = (optionValue: DashboardStatusFilterValue) => {
    setOpen(false);
    onChange(optionValue);
  };

  return (
    <div className="relative inline-block shrink-0" ref={containerRef}>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label="Filter by status"
        className="flex h-14 shrink-0 items-center justify-between gap-4 rounded-button bg-surface-subtle px-5 text-body-lg font-medium text-white/80 outline-none transition-colors hover:bg-surface-elevated"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span className="flex items-center gap-2">
          <FilterLinesIcon className="size-5 shrink-0" />
          <span>Status</span>
        </span>
        <ChevronDownIcon
          className={cn(
            "size-5 shrink-0 transition-transform",
            !open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={id}
          className="absolute right-0 top-full z-50 mt-1 min-w-full overflow-hidden rounded-card border border-border-default bg-input-fill shadow-lg"
        >
          {STATUS_FILTER_OPTIONS.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={value === option.value}
              className={cn(
                "cursor-pointer whitespace-nowrap px-[17px] py-3 text-input font-medium text-white hover:bg-surface-elevated",
                index < STATUS_FILTER_OPTIONS.length - 1 &&
                  "border-b border-border-default",
                value === option.value && "bg-brand-badge",
              )}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
