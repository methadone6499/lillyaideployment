import { Card } from "@/components/ui/Card";
import { ArrowNarrowRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ReactNode } from "react";

type DashboardActionCardVariant = "default" | "highlight" | "admin";

type DashboardActionCardProps = {
  className?: string;
  variant?: DashboardActionCardVariant;
  title: string;
  description: string;
  ctaLabel: string;
  href?: string;
  onCtaClick?: () => void;
  disabled?: boolean;
  disabledReason?: string;
  children?: ReactNode;
};

function ActionCardCta({
  ctaLabel,
  href,
  onCtaClick,
  variant,
  disabled,
  disabledReason,
}: {
  ctaLabel: string;
  href?: string;
  onCtaClick?: () => void;
  variant: DashboardActionCardVariant;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const className = cn(
    "flex h-[52px] w-full shrink-0 items-center justify-between gap-2.5 rounded-button px-5 text-label font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:border disabled:border-border-subtle disabled:bg-surface-default disabled:text-text-muted",
    variant === "highlight" && "bg-brand text-brand-foreground hover:bg-[#059669]",
    variant === "admin" &&
      "border border-border-default bg-surface-default text-white hover:border-white/20 hover:bg-surface-elevated",
    variant === "default" &&
      "border border-border-default bg-surface-default text-text-heading hover:border-white/20 hover:bg-surface-elevated",
  );

  const content = (
    <>
      <span>{ctaLabel}</span>
      <ArrowNarrowRightIcon className="size-5 shrink-0" />
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
      onClick={onCtaClick}
    >
      {content}
    </button>
  );
}

export function DashboardActionCard({
  className,
  variant = "default",
  title,
  description,
  ctaLabel,
  href,
  onCtaClick,
  disabled = false,
  disabledReason,
  children,
}: DashboardActionCardProps) {
  const titleNode: ReactNode = (
    <p
      className={cn(
        "text-dashboard-card-title font-medium leading-none tracking-[-0.02em]",
        variant === "default" ? "text-brand" : "text-text-heading",
      )}
    >
      {title}
    </p>
  );

  return (
    <Card
      className={cn(
        "flex min-h-[231px] min-w-0 flex-col p-6",
        variant === "highlight" &&
          "border-brand/25 bg-brand-badge",
        className,
      )}
    >
      <div className="flex flex-col gap-6">
        {titleNode}
        <p className="text-label leading-6 text-text-step">{description}</p>
        {disabled && disabledReason ? (
          <p className="text-helper text-status-running">{disabledReason}</p>
        ) : null}
      </div>

      <div className="mt-auto flex flex-col gap-4 pt-4">
        {children}
        <ActionCardCta
          ctaLabel={ctaLabel}
          href={href}
          onCtaClick={onCtaClick}
          variant={variant}
          disabled={disabled}
          disabledReason={disabledReason}
        />
      </div>
    </Card>
  );
}
