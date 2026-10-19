"use client";

import { cn } from "@/lib/cn";
import { useId } from "react";
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
  id: idProp,
  required,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = idProp ?? generatedId;
  const hasError = Boolean(error);
  const helperId = helper && !hasError ? `${inputId}-helper` : undefined;
  const errorId = hasError ? `${inputId}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, helperId, errorId].filter(Boolean).join(" ") || undefined;

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
        required={required}
        aria-describedby={describedBy}
        aria-invalid={hasError ? true : ariaInvalid}
        className={cn(
          "h-12 w-full rounded-field border border-border-default bg-input-fill px-[19px] text-input font-medium text-white placeholder:text-text-placeholder outline-none transition-[border-color,box-shadow] focus-visible:border-brand-chip-border focus-visible:ring-2 focus-visible:ring-brand/35",
          hasError && "border-status-danger",
          className,
        )}
        {...props}
      />
      {helper && !error && (
        <p id={helperId} className="text-helper text-text-muted">
          {helper}
        </p>
      )}
      {hasError && (
        <p
          id={errorId}
          role="alert"
          className="text-helper text-status-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
