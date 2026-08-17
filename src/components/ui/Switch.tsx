"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type SwitchTone = "brand" | "danger";
type SwitchSize = "default" | "large";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  tone?: SwitchTone;
  size?: SwitchSize;
  checkedIcon?: ReactNode;
  uncheckedIcon?: ReactNode;
  disabled?: boolean;
  "aria-label"?: string;
};

const switchSizeClasses: Record<
  SwitchSize,
  { track: string; thumb: string }
> = {
  default: { track: "h-8 w-[52px] p-1", thumb: "size-6" },
  large: { track: "h-9 w-[58px] p-[4.5px]", thumb: "size-[27px]" },
};

export function Switch({
  checked,
  onChange,
  className,
  tone = "brand",
  size = "default",
  checkedIcon,
  uncheckedIcon,
  disabled = false,
  "aria-label": ariaLabel,
}: SwitchProps) {
  const sizeClasses = switchSizeClasses[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative flex shrink-0 items-center rounded-toggle-track transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        sizeClasses.track,
        checked ? "justify-end" : "justify-start",
        checked && tone === "brand" && "bg-brand-badge",
        checked && tone === "danger" && "bg-[rgba(251,65,65,0.16)]",
        !checked && "bg-surface-elevated",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-toggle-knob shadow-toggle-knob transition-colors",
          sizeClasses.thumb,
          checked && tone === "brand" && "bg-brand",
          checked && tone === "danger" && "bg-[#fb4141]",
          !checked && "bg-white/80",
        )}
      >
        {checked ? checkedIcon : uncheckedIcon}
      </span>
    </button>
  );
}
