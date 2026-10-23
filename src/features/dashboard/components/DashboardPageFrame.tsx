import type { ReactNode } from "react";

import { AppHeader } from "@/components/shared/AppHeader";
import { cn } from "@/lib/cn";

import { DashboardGreeting } from "./DashboardGreeting";
import { DashboardHeaderActions } from "./DashboardHeaderActions";

type DashboardPageFrameProps = {
  displayName: string;
  summary: ReactNode;
  notices?: ReactNode;
  fullWidthSummary?: boolean;
  compactSpacing?: boolean;
  children: ReactNode;
};

export function DashboardPageFrame({
  displayName,
  summary,
  notices,
  fullWidthSummary = false,
  compactSpacing = false,
  children,
}: DashboardPageFrameProps) {
  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader actions={<DashboardHeaderActions />} />
      <main
        className={cn(
          "mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-4 pb-14 sm:px-6 lg:px-12",
          compactSpacing ? "pt-8" : "pt-10 lg:pt-[57px]",
        )}
      >
        <DashboardGreeting user={{ displayName }} />
        {notices ? (
          <div className="min-w-0 xl:max-w-[1624px]">{notices}</div>
        ) : null}
        <div className={cn(
          "min-w-0",
          compactSpacing ? "mt-6" : "mt-10 xl:mt-[55px]",
          fullWidthSummary ? "w-full" : "xl:max-w-[1624px]",
        )}>
          {summary}
        </div>
        <div className={cn("min-w-0", compactSpacing ? "mt-8" : "mt-10 xl:mt-[60px]")}>
          {children}
        </div>
      </main>
    </div>
  );
}

export function DashboardActionGrid({
  label,
  children,
  columns = 3,
}: {
  label: string;
  children: ReactNode;
  columns?: 3 | 4;
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        "grid grid-cols-1 gap-5 md:grid-cols-2",
        // Match Tailwind's rem breakpoints so this rule sorts after md.
        columns === 4 ? "min-[106.25rem]:grid-cols-4" : "xl:grid-cols-3",
      )}
    >
      {children}
    </section>
  );
}
