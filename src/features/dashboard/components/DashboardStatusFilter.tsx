"use client";

import { ChevronDownIcon, FilterLinesIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { DashboardStatusFilterValue } from "../types";

export type { DashboardStatusFilterValue };

export type DashboardStatusFilterOption<T extends string> = {
  value: T;
  label: string;
};

const STATUS_FILTER_OPTIONS: readonly DashboardStatusFilterOption<DashboardStatusFilterValue>[] =
  [
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
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const listboxId = `${id}-listbox`;
  const resolvedOptions = (options ??
    STATUS_FILTER_OPTIONS) as readonly DashboardStatusFilterOption<T>[];
  const selectedIndex = resolvedOptions.findIndex(
    (option) => option.value === value,
  );
  const selectedLabel = resolvedOptions[selectedIndex]?.label;

  const closeMenu = () => {
    setOpen(false);
  };

  const openMenu = () => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
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
    closeMenu();
    onChange(optionValue);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const lastIndex = resolvedOptions.length - 1;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      setActiveIndex((current) => Math.min(current + 1, lastIndex));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (open && event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (open && event.key === "End") {
      event.preventDefault();
      setActiveIndex(lastIndex);
      return;
    }

    if (open && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      const option = resolvedOptions[activeIndex];
      if (option) {
        handleSelect(option.value);
      }
      return;
    }

    if (open && event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === "Tab" && open) {
      closeMenu();
    }
  };

  const activeOptionId = open
    ? `${listboxId}-option-${activeIndex}`
    : undefined;

  return (
    <div className="relative w-full shrink-0 sm:inline-block sm:w-auto" ref={containerRef}>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        aria-label="Filter by status"
        className="flex h-14 w-full shrink-0 items-center justify-between gap-4 rounded-button bg-surface-subtle px-5 text-body-lg font-medium text-white/80 outline-none transition-colors hover:bg-surface-elevated focus-visible:ring-1 focus-visible:ring-border-default sm:w-auto"
        onClick={() => {
          if (open) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
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
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={value === option.value}
              className={cn(
                "cursor-pointer whitespace-nowrap px-[17px] py-3 text-input font-medium text-white hover:bg-surface-elevated",
                index < resolvedOptions.length - 1 &&
                  "border-b border-border-default",
                value === option.value && "bg-brand-badge",
                open &&
                  activeIndex === index &&
                  value !== option.value &&
                  "bg-surface-elevated",
              )}
              onMouseMove={() => setActiveIndex(index)}
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
