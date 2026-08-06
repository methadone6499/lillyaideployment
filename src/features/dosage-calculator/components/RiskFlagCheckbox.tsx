"use client";

import { cn } from "@/lib/cn";

type RiskFlagCheckboxProps = {
  id: string;
  name?: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function RiskFlagCheckbox({
  id,
  name,
  label,
  checked,
  onChange,
  disabled = false,
  className,
}: RiskFlagCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "group inline-flex min-h-8 cursor-pointer items-center gap-2 text-input font-medium text-white",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="flex size-3 shrink-0 items-center justify-center rounded-[3px] border border-border-default bg-surface-default transition-colors peer-checked:border-brand peer-checked:bg-brand-bg peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-base-black"
      >
        {checked ? <span className="size-1.5 rounded-xs bg-brand" /> : null}
      </span>
      <span>{label}</span>
    </label>
  );
}
