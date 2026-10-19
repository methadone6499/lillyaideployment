"use client";

import { EyeIcon, EyeOffIcon, TextField } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useState, type ComponentProps } from "react";

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
  type,
  disabled,
  ...props
}: AuthFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";
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
      <div className="relative">
        <TextField
          id={inputId}
          required={required}
          type={isPassword ? (passwordVisible ? "text" : "password") : type}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-[var(--layout-auth-field-height)] rounded-[10.5px] border-0 bg-landing-surface-input px-[var(--layout-auth-field-padding-x)] text-input font-normal text-white placeholder:text-text-muted [--autofill-background:var(--landing-surface-input)] [--autofill-text:var(--text-heading)] focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-brand/40",
            error ? "ring-1 ring-red-400/80" : null,
            className,
            isPassword ? "pr-14" : null,
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            disabled={disabled}
            aria-label={`${passwordVisible ? "Hide" : "Show"} ${label.toLowerCase()}`}
            aria-controls={inputId}
            aria-pressed={passwordVisible}
            title={passwordVisible ? "Hide password" : "Show password"}
            onClick={() => setPasswordVisible((visible) => !visible)}
            className="absolute top-1/2 right-2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-field text-white/72 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-muted"
          >
            {passwordVisible ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        ) : null}
      </div>
      {description ? (
        <p
          id={descriptionId}
          className="text-[length:var(--text-auth-label)] leading-normal text-text-body"
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
