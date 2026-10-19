import type { ReactNode } from "react";

import { AppHeader } from "@/components/shared/AppHeader";

import { DashboardGreeting } from "./DashboardGreeting";
import { DashboardHeaderActions } from "./DashboardHeaderActions";

type DashboardPageFrameProps = {
  displayName: string;
  summary: ReactNode;
  notices?: ReactNode;
  children: ReactNode;
};

export function DashboardPageFrame({
  displayName,
  summary,
  notices,
  children,
}: DashboardPageFrameProps) {
  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader actions={<DashboardHeaderActions />} />
      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-4 pt-10 pb-14 sm:px-6 lg:px-12 lg:pt-[57px]">
        <DashboardGreeting user={{ displayName }} />
        {notices ? (
          <div className="min-w-0 xl:max-w-[1624px]">{notices}</div>
        ) : null}
        <div className="mt-10 min-w-0 xl:mt-[55px] xl:max-w-[1624px]">
          {summary}
        </div>
        <div className="mt-10 min-w-0 xl:mt-[60px]">{children}</div>
      </main>
    </div>
  );
}

export function DashboardActionGrid({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      {children}
    </section>
  );
}
