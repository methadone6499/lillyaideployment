"use client";

import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, ReactNode } from "react";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
};

export function TextField({
  label,
  helper,
  error,
  className,
  containerClassName,
  id,
  required,
  ...props
}: TextFieldProps) {
  const inputId = id ?? (typeof label === "string" ? label : undefined);

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-label font-medium text-white"
        >
          {label}
          {required && <span className="text-brand"> *</span>}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "h-12 w-full rounded-card border border-border-default bg-input-fill px-[19px] text-input font-medium text-white placeholder:text-text-muted outline-none focus:border-brand-chip-border",
          className,
        )}
        {...props}
      />
      {helper && !error && (
        <p className="text-helper text-text-muted">{helper}</p>
      )}
      {error && <p className="text-helper text-status-running">{error}</p>}
    </div>
  );
}
