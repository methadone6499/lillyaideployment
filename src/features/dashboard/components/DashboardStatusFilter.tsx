"use client";

import { ChevronDownIcon, FilterLinesIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
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
    if (resolvedOptions.length === 0) return;

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const updatePosition = () => {
      const rect = trigger.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight;
      const gutter = 8;
      const gap = 4;
      const availableWidth = Math.max(0, viewportWidth - gutter * 2);

      menu.style.fontFamily = window.getComputedStyle(trigger).fontFamily;
      menu.style.minWidth = `${Math.min(rect.width, availableWidth)}px`;
      menu.style.maxWidth = `${availableWidth}px`;

      const menuHeight = menu.scrollHeight + 2;
      const spaceBelow = Math.max(0, viewportHeight - rect.bottom - gap - gutter);
      const spaceAbove = Math.max(0, rect.top - gap - gutter);
      const openAbove = menuHeight > spaceBelow && spaceAbove > spaceBelow;
      const availableHeight = openAbove ? spaceAbove : spaceBelow;

      menu.style.maxHeight = `${availableHeight}px`;
      const menuWidth = menu.getBoundingClientRect().width;
      menu.style.left = `${Math.max(
        gutter,
        Math.min(rect.right - menuWidth, viewportWidth - menuWidth - gutter),
      )}px`;
      menu.style.top = `${
        openAbove
          ? rect.top - gap - Math.min(menuHeight, availableHeight)
          : rect.bottom + gap
      }px`;
    };

    const handleScroll = (event: Event) => {
      if (menu.contains(event.target as Node)) return;

      const rect = trigger.getBoundingClientRect();
      if (
        rect.bottom <= 0 ||
        rect.top >= window.innerHeight ||
        rect.right <= 0 ||
        rect.left >= document.documentElement.clientWidth
      ) {
        closeMenu();
        return;
      }
      updatePosition();
    };

    updatePosition();
    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(trigger);
    resizeObserver.observe(menu);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("scroll", handleScroll, true);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    const menu = menuRef.current;
    const option = menu?.children[activeIndex];
    if (!menu || !(option instanceof HTMLElement)) return;

    if (option.offsetTop < menu.scrollTop) {
      menu.scrollTop = option.offsetTop;
    } else if (
      option.offsetTop + option.offsetHeight > menu.scrollTop + menu.clientHeight
    ) {
      menu.scrollTop = option.offsetTop + option.offsetHeight - menu.clientHeight;
    }
  }, [open, activeIndex]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        closeMenu();
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSelect = (optionValue: T) => {
    closeMenu();
    triggerRef.current?.focus();
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
        ref={triggerRef}
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        aria-label="Filter by status"
        className="flex h-14 w-full shrink-0 cursor-pointer items-center justify-between gap-4 rounded-surface bg-surface-subtle px-5 text-body-lg font-medium text-white/80 outline-none transition-[background-color,box-shadow] hover:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-brand/35 sm:w-auto"
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
            open && "rotate-180",
          )}
        />
      </button>
      {open ? createPortal(
        <ul
          ref={menuRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={id}
          className="fixed z-50 w-max overflow-x-hidden overflow-y-auto overscroll-contain rounded-surface border border-border-default bg-input-fill shadow-lg"
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
              onMouseDown={(event) => event.preventDefault()}
              onMouseMove={() => setActiveIndex(index)}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>,
        document.body,
      ) : null}
    </div>
  );
}
