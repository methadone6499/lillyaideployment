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
        "inline-flex h-10 items-center rounded-card border px-[18px] text-input font-medium transition-colors",
        selected
          ? "border-brand-chip-border bg-brand-bg text-brand"
          : "border-border-default bg-surface-default text-white hover:bg-surface-elevated",
        className,
      )}
      aria-pressed={selected}
      {...props}
    >
      {children}
    </button>
  );
}
