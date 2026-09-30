"use client";

import { useId, type ReactNode, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type CustomTextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
};

/** Multi-line counterpart of the `TextField` primitive, with the same styling. */
export function CustomTextArea({
  label,
  helper,
  error,
  className,
  id: idProp,
  required,
  rows = 4,
  ...props
}: CustomTextAreaProps) {
  const generatedId = useId();
  const inputId = idProp ?? generatedId;
  const hasError = Boolean(error);
  const helperId = helper && !hasError ? `${inputId}-helper` : undefined;
  const errorId = hasError ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-label font-medium text-white">
        {label}
        {required && <span className="text-brand"> *</span>}
      </label>
      <textarea
        id={inputId}
        required={required}
        rows={rows}
        aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={hasError || undefined}
        className={cn(
          "w-full rounded-card border border-border-default bg-input-fill px-[19px] py-3 text-input text-white placeholder:text-text-muted outline-none focus:border-brand-chip-border",
          hasError && "border-status-running",
          className,
        )}
        {...props}
      />
      {helper && !error ? (
        <p id={helperId} className="text-helper text-text-muted">
          {helper}
        </p>
      ) : null}
      {hasError ? (
        <p id={errorId} role="alert" className="text-helper text-status-running">
          {error}
        </p>
      ) : null}
    </div>
  );
}
