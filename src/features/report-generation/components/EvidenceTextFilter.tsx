"use client";

import { ChevronDownIcon, FilterLinesIcon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useEffect, useId, useRef, useState } from "react";
import type { TextAvailabilityFilter } from "../types";

const TEXT_AVAILABILITY_OPTIONS: {
  value: TextAvailabilityFilter;
  label: string;
}[] = [
  { value: "all", label: "Show All" },
  { value: "full_text", label: "Full Text" },
  { value: "abstract_only", label: "Abstract only" },
];

type EvidenceTextFilterProps = {
  value: TextAvailabilityFilter;
  onChange: (value: TextAvailabilityFilter) => void;
};

export function EvidenceTextFilter({
  value,
  onChange,
}: EvidenceTextFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const listboxId = `${id}-listbox`;

  const selectedOption = TEXT_AVAILABILITY_OPTIONS.find(
    (option) => option.value === value,
  );
  const displayLabel = selectedOption?.label ?? "Show All";

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

  const handleSelect = (optionValue: TextAvailabilityFilter) => {
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
        aria-label="Filter by text availability"
        className="flex items-center gap-2 rounded-card bg-[rgba(255,255,255,0.08)] px-3 py-2 text-label font-medium text-white outline-none"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <FilterLinesIcon className="size-4 shrink-0 text-white" />
        <span>{displayLabel}</span>
        <ChevronDownIcon
          className={cn(
            "shrink-0 text-white transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={id}
          className="absolute right-0 top-full z-50 mt-1 min-w-full overflow-hidden rounded-card border border-border-default bg-input-fill"
        >
          {TEXT_AVAILABILITY_OPTIONS.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={value === option.value}
              className={cn(
                "cursor-pointer whitespace-nowrap px-[17px] py-3 text-input font-medium text-white hover:bg-surface-elevated",
                index < TEXT_AVAILABILITY_OPTIONS.length - 1 &&
                  "border-b border-white",
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
