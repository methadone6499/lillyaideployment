"use client";

import { cn } from "@/lib/cn";

type RadioCircleProps = {
  selected?: boolean;
  className?: string;
  onClick?: () => void;
  "aria-label"?: string;
};

export function RadioCircle({
  selected = false,
  className,
  onClick,
  "aria-label": ariaLabel,
}: RadioCircleProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-radio border-2 border-border-default bg-surface-default",
        className,
      )}
    >
      {selected && (
        <span className="size-4 rounded-radio bg-brand" />
      )}
    </button>
  );
}
