"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type AuthFormAlertProps = {
  children: ReactNode;
  variant: "error" | "success" | "info";
  role?: "alert" | "status";
  className?: string;
};

const variantClasses: Record<AuthFormAlertProps["variant"], string> = {
  error: "text-red-400",
  success: "text-brand",
  info: "text-landing-text-heading",
};

export function AuthFormAlert({
  children,
  variant,
  role = "alert",
  className,
}: AuthFormAlertProps) {
  return (
    <p
      role={role}
      className={cn(
        "text-center text-label leading-normal",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </p>
  );
}
