"use client";

import { TextField } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";

type AuthFieldProps = Omit<
  ComponentProps<typeof TextField>,
  "label" | "helper" | "error"
> & {
  label: string;
  required?: boolean;
  showRequiredIndicator?: boolean;
  error?: string | null;
  description?: string;
};

export function AuthField({
  label,
  required,
  showRequiredIndicator,
  error = null,
  description,
  id,
  className,
  ...props
}: AuthFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const showIndicator = showRequiredIndicator ?? Boolean(required);
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex w-full flex-col gap-[var(--layout-auth-field-label-gap)]">
      <label
        htmlFor={inputId}
        className="text-[length:var(--text-auth-label)] leading-normal font-normal tracking-[-0.01em] text-white/48"
      >
        {label}
        {showIndicator ? <span className="text-brand">*</span> : null}
      </label>
      <TextField
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-[var(--layout-auth-field-height)] rounded-[10.5px] border-0 bg-landing-surface-input px-[var(--layout-auth-field-padding-x)] text-input font-normal text-white placeholder:text-[#686868] focus:border-transparent focus:ring-1 focus:ring-brand-chip-border",
          error ? "ring-1 ring-red-400/80" : null,
          className,
        )}
        {...props}
      />
      {description ? (
        <p
          id={descriptionId}
          className="text-[length:var(--text-auth-label)] leading-normal text-white/40"
        >
          {description}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-[length:var(--text-auth-label)] leading-normal text-red-400"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
