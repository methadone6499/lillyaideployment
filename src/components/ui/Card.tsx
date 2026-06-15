import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type CardVariant = "default" | "accent" | "subtle";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

const variantClasses: Record<CardVariant, string> = {
  default: "bg-surface-default border-border-default",
  accent: "bg-brand-bg border-brand-border",
  subtle: "bg-surface-subtle border-border-subtle",
};

export function Card({
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
