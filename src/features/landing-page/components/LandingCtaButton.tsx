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
};

export function LandingCtaButton({
  children,
  href,
  className,
  fullWidth = false,
  showArrow = true,
  onClick,
  type = "button",
}: LandingCtaButtonProps) {
  const classes = cn(
    "inline-flex h-[58px] items-center justify-center gap-1.5 rounded-field border-[1.75px] border-[rgba(1,176,89,0.72)] bg-landing-emerald-gradient px-6 text-label font-medium text-white shadow-landing-emerald-glow transition-opacity hover:opacity-95",
    fullWidth && "w-full",
    className,
  );

  const content = (
    <>
      {children}
      {showArrow && <ArrowNarrowRightSmallIcon />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
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
  featured = false,
  onClick,
}: Omit<LandingCtaButtonProps, "showArrow" | "type"> & {
  featured?: boolean;
}) {
  const classes = cn(
    "inline-flex h-[52px] items-center justify-center rounded-button px-5 text-label font-medium text-white transition-colors",
    featured
      ? "border border-border-subtle bg-landing-emerald-gradient shadow-landing-emerald-glow hover:opacity-95"
      : "border border-border-subtle bg-surface-default hover:bg-surface-elevated",
    fullWidth && "w-full",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
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
