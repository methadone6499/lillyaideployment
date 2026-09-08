import { Card } from "@/components/ui/Card";
import { ArrowNarrowRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ReactNode } from "react";

type DashboardActionCardVariant = "default" | "highlight" | "admin";

type DashboardActionCardProps = {
  variant?: DashboardActionCardVariant;
  title: string;
  description: string;
  ctaLabel: string;
  href?: string;
  onCtaClick?: () => void;
};

function ActionCardCta({
  ctaLabel,
  href,
  onCtaClick,
  variant,
}: {
  ctaLabel: string;
  href?: string;
  onCtaClick?: () => void;
  variant: DashboardActionCardVariant;
}) {
  const className = cn(
    "mt-auto flex h-[52px] w-full items-center justify-between rounded-step-badge px-5 text-label font-medium transition-colors",
    variant === "highlight" && "bg-brand text-white hover:bg-brand/90",
    variant === "admin" &&
      "border border-dashed border-brand/28 bg-brand/9 text-white hover:bg-brand/16",
    variant === "default" &&
      "border border-dashed border-white/28 bg-surface-default text-text-heading hover:bg-surface-elevated",
  );

  const content = (
    <>
      <span>{ctaLabel}</span>
      <ArrowNarrowRightIcon className="size-5 shrink-0" />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onCtaClick}>
      {content}
    </button>
  );
}

export function DashboardActionCard({
  variant = "default",
  title,
  description,
  ctaLabel,
  href,
  onCtaClick,
}: DashboardActionCardProps) {
  const titleNode: ReactNode = (
    <p
      className={cn(
        "text-[32px] font-medium leading-none tracking-[-0.02em]",
        variant === "default" ? "text-brand" : "text-text-heading",
      )}
    >
      {title}
    </p>
  );

  return (
    <Card
      className={cn(
        "flex min-h-[231px] flex-col rounded-button p-6",
        variant === "highlight" &&
          "border-2 border-brand/25 bg-brand-badge",
      )}
    >
      <div className="flex flex-col gap-6">
        {titleNode}
        <p className="text-label leading-6 text-text-step">{description}</p>
      </div>

      <ActionCardCta
        ctaLabel={ctaLabel}
        href={href}
        onCtaClick={onCtaClick}
        variant={variant}
      />
    </Card>
  );
}
