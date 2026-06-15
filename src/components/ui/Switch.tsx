"use client";

import { cn } from "@/lib/cn";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  "aria-label"?: string;
};

export function Switch({
  checked,
  onChange,
  className,
  "aria-label": ariaLabel,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative flex h-[32px] w-[52px] shrink-0 items-center rounded-toggle-track px-1 transition-colors",
        checked ? "bg-brand-badge pl-6" : "bg-surface-elevated pr-6",
        className,
      )}
    >
      <span
        className={cn(
          "size-6 rounded-toggle-knob shadow-toggle-knob transition-colors",
          checked ? "bg-brand" : "bg-white/80",
        )}
      />
    </button>
  );
}
