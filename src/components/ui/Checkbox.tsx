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
        "flex size-7 shrink-0 items-center justify-center rounded-step-badge border-2 transition-[color,background-color,border-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        checked
          ? "border-brand bg-brand text-base-black"
          : "border-border-default bg-surface-default text-transparent hover:border-white/30",
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="size-4"
        fill="none"
      >
        <path
          d="m3.25 8.25 3 3 6.5-6.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
