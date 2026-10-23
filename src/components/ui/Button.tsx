"use client";

import { cn } from "@/lib/cn";
import type { ComponentProps, ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "destructiveSolid"
  | "table"
  | "dashed"
  | "ghost";

type ButtonSize =
  | "default"
  | "table"
  | "compact"
  | "small"
  | "toolbar"
  | "auth"
  | "icon"
  | "headerIcon";

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-brand text-brand-foreground hover:bg-[#059669] disabled:border-border-subtle disabled:bg-surface-default disabled:text-text-muted disabled:shadow-none",
  secondary:
    "border border-border-default bg-surface-default text-white hover:border-white/20 hover:bg-surface-elevated disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-text-muted disabled:shadow-none",
  destructive:
    "border border-transparent bg-[rgba(217,34,68,0.16)] text-status-danger hover:bg-[rgba(217,34,68,0.24)] disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-text-muted",
  destructiveSolid:
    "border border-transparent bg-[#d92244] text-white hover:bg-[#bd1d3a] disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-text-muted",
  table:
    "border border-border-default bg-surface-subtle text-white hover:border-white/20 hover:bg-surface-elevated disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-text-muted",
  dashed:
    "border border-dashed border-brand/56 bg-brand-bg text-brand hover:border-brand hover:bg-brand-badge disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-text-muted",
  ghost:
    "border border-transparent bg-transparent text-brand hover:underline disabled:text-text-muted",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-[52px] rounded-button px-5 text-label",
  table: "h-12 rounded-button px-5 text-label",
  compact: "h-10 rounded-button px-4 text-label",
  small: "h-11 rounded-button px-5 text-label",
  toolbar: "h-14 rounded-surface px-5 text-label",
  auth: "h-[var(--layout-auth-button-height)] rounded-[10.5px] px-5 text-label",
  icon: "size-10 rounded-field p-0 text-label",
  headerIcon: "size-12 rounded-header-control p-0 text-label",
};

export function Button({
  variant = "primary",
  size = "default",
  leadingIcon,
  trailingIcon,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2.5 font-medium transition-[color,background-color,border-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-100",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
