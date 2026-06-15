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
        "text-card-title font-medium underline underline-offset-2",
        variant === "brand" ? "text-brand" : "text-white",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
