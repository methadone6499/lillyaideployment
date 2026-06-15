import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type GradientTextProps = {
  children: ReactNode;
  className?: string;
  as?: "span" | "p";
};

export function GradientText({
  children,
  className,
  as: Component = "span",
}: GradientTextProps) {
  return (
    <Component
      className={cn(
        "bg-landing-emerald-gradient bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </Component>
  );
}
