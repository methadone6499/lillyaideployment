"use client";

import { cn } from "@/lib/cn";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  "aria-label"?: string;
};

export function Checkbox({
  checked,
  onChange,
  className,
  "aria-label": ariaLabel,
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-radio border-2 border-border-default bg-surface-default",
        className,
      )}
    >
      {checked && (
        <span className="size-4 rounded-radio bg-brand" />
      )}
    </button>
  );
}
