import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type TextLinkProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "brand" | "white";
};

export function TextLink({
  variant = "brand",
  className,
  children,
  type = "button",
  ...props
}: TextLinkProps) {
  return (
    <button
      type={type}
      className={cn(
        "text-label font-medium no-underline transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:text-text-muted",
        variant === "brand" ? "text-brand" : "text-white",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
