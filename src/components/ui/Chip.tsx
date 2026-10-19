"use client";

import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
};

export function Chip({
  selected = false,
  className,
  children,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-field border px-[18px] text-input font-medium transition-[color,background-color,border-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-text-muted disabled:opacity-100",
        selected
          ? "border-brand-chip-border bg-brand-bg text-brand"
          : "border-border-default bg-surface-default text-white hover:bg-surface-elevated",
        className,
      )}
      aria-pressed={selected}
      {...props}
    >
      {selected ? (
        <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none">
          <path
            d="m3.25 8.25 3 3 6.5-6.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
