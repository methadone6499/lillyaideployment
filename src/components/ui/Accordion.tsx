"use client";

import { cn } from "@/lib/cn";
import { ChevronDownIcon, ChevronUpIcon } from "./icons";
import type { ReactNode } from "react";

type AccordionProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  trailing?: ReactNode;
  children?: ReactNode;
  variant?: "default" | "accent";
  className?: string;
  leading?: ReactNode;
};

export function Accordion({
  title,
  subtitle,
  expanded,
  onToggle,
  trailing,
  children,
  variant = "default",
  className,
  leading,
}: AccordionProps) {
  return (
    <div
      className={cn(
        "rounded-card border",
        variant === "accent"
          ? "border-brand-border bg-brand-bg"
          : "border-border-default bg-surface-default",
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-5 px-[31px] py-6 text-left"
      >
        {leading}
        <div className="min-w-0 flex-1">
          <div className="text-card-title font-medium text-white">{title}</div>
          {subtitle && (
            <p className="mt-4 text-helper text-text-muted">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-7">
          {trailing}
          {children !== undefined &&
            (expanded ? <ChevronUpIcon /> : <ChevronDownIcon className="size-6" />)}
        </div>
      </button>
      {expanded && children && (
        <div className="border-t border-border-default px-[31px] pb-8 pt-6">
          {children}
        </div>
      )}
    </div>
  );
}
