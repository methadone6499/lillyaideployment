"use client";

import { AppHeader } from "@/components/shared/AppHeader";
import { useAuthUser } from "@/features/auth";
import {
  DashboardGreeting,
  DashboardHeaderActions,
} from "@/features/dashboard";
import type { ReviewerDashboardSnapshot } from "../types";
import { ReviewerKpiGrid } from "./ReviewerKpiGrid";
import { ReviewerReportsTable } from "./ReviewerReportsTable";

type ReviewerDashboardShellProps = {
  snapshot: ReviewerDashboardSnapshot;
};

export function ReviewerDashboardShell({
  snapshot,
}: ReviewerDashboardShellProps) {
  const { displayName } = useAuthUser();

  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader
        actions={
          <DashboardHeaderActions notifications={snapshot.notifications} />
        }
      />

      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-4 pt-10 pb-14 sm:px-6 lg:px-12 lg:pt-[57px]">
        <DashboardGreeting user={{ displayName }} />

        <div className="mt-10 xl:mt-[55px]">
          <ReviewerKpiGrid kpis={snapshot.kpis} />
        </div>

        <div className="mt-10 xl:mt-[60px]">
          <ReviewerReportsTable reports={snapshot.reports} />
        </div>
      </main>
    </div>
  );
}
