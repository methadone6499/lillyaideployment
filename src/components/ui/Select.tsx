"use client";

import { cn } from "@/lib/cn";
import { ChevronDownIcon } from "./icons";
import type { SelectHTMLAttributes } from "react";

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label?: string;
  helper?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
};

export function Select({
  label,
  helper,
  options,
  placeholder = "Select an Option",
  className,
  containerClassName,
  value,
  ...props
}: SelectProps) {
  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label && (
        <span className="text-label font-medium text-white">{label}</span>
      )}
      <div className="relative">
        <select
          value={value}
          className={cn(
            "h-12 w-full appearance-none rounded-card border border-border-default bg-surface-default px-[17px] pr-10 text-input font-medium outline-none focus:border-brand-chip-border",
            !value ? "text-text-muted" : "text-white",
            className,
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-[15px] top-1/2 -translate-y-1/2 text-white" />
      </div>
      {helper && (
        <p className="text-helper text-text-muted">{helper}</p>
      )}
    </div>
  );
}
