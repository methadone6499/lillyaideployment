"use client";

import { ChevronDownIcon, FilterLinesIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useEffect, useId, useRef, useState } from "react";
import type { DashboardStatusFilterValue } from "../types";

export type { DashboardStatusFilterValue };

export type DashboardStatusFilterOption<T extends string> = {
  value: T;
  label: string;
};

const STATUS_FILTER_OPTIONS: readonly DashboardStatusFilterOption<DashboardStatusFilterValue>[] = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "generating", label: "In Progress" },
  { value: "failed", label: "Failed" },
];

type DashboardStatusFilterProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options?: readonly DashboardStatusFilterOption<T>[];
  showSelectedLabel?: boolean;
};

export function DashboardStatusFilter<
  T extends string = DashboardStatusFilterValue,
>({
  value,
  onChange,
  options,
  showSelectedLabel = false,
}: DashboardStatusFilterProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const listboxId = `${id}-listbox`;
  const resolvedOptions = (options ??
    STATUS_FILTER_OPTIONS) as readonly DashboardStatusFilterOption<T>[];
  const selectedLabel = resolvedOptions.find(
    (option) => option.value === value,
  )?.label;

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

  const handleSelect = (optionValue: T) => {
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
          <span>{showSelectedLabel ? selectedLabel ?? "Status" : "Status"}</span>
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
          {resolvedOptions.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={value === option.value}
              className={cn(
                "cursor-pointer whitespace-nowrap px-[17px] py-3 text-input font-medium text-white hover:bg-surface-elevated",
                index < resolvedOptions.length - 1 &&
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
