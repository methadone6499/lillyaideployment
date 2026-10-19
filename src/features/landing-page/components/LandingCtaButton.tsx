import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowNarrowRightSmallIcon } from "./LandingIcons";

type LandingCtaButtonProps = {
  children: ReactNode;
  href?: string;
  className?: string;
  fullWidth?: boolean;
  showArrow?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  size?: "default" | "compact" | "hero";
};

const buttonClasses =
  "inline-flex min-w-0 items-center justify-center gap-2 px-5 text-label font-medium leading-6 transition-[color,background-color,border-color,opacity] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-surface-default disabled:text-text-muted";

const sizeClasses = {
  default: "h-[52px] rounded-[var(--landing-radius-button)]",
  compact: "h-10 rounded-[10.5px]",
  hero: "h-[58px] rounded-field",
} as const;

export function LandingCtaButton({
  children,
  href,
  className,
  fullWidth = false,
  showArrow = true,
  onClick,
  type = "button",
  size = "default",
}: LandingCtaButtonProps) {
  const classes = cn(
    buttonClasses,
    sizeClasses[size],
    "border-[1.75px] border-[rgba(1,176,89,0.72)] bg-[image:var(--landing-emerald-gradient)] text-brand-foreground shadow-[var(--landing-emerald-glow)] hover:opacity-95 disabled:bg-none disabled:shadow-none disabled:hover:opacity-100",
    fullWidth ? "w-full" : "shrink-0",
    className,
  );

  const content = (
    <>
      {children}
      {showArrow && <ArrowNarrowRightSmallIcon className="size-5" />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

export function LandingSecondaryButton({
  children,
  href,
  className,
  fullWidth = false,
  onClick,
  size = "default",
  variant = "default",
}: Omit<LandingCtaButtonProps, "showArrow" | "type"> & {
  variant?: "default" | "pricing";
}) {
  const classes = cn(
    buttonClasses,
    variant === "pricing" ? "h-[52px] rounded-button" : sizeClasses[size],
    variant === "pricing" ? "border-white/8" : "border-border-default",
    "border bg-none bg-surface-default text-white shadow-none hover:border-white/20 hover:bg-surface-elevated",
    fullWidth ? "w-full" : "shrink-0",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
