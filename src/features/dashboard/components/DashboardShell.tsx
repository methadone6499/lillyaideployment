"use client";

import { AppHeader } from "@/components/shared/AppHeader";
import { getActiveContext, hasPermission, useAuthUser } from "@/features/auth";
import {
  classifyQuotaQueryError,
  useOwnCompanyQuota,
} from "@/features/company-quota";
import { beginReportWizardSession } from "@/features/report-generation";
import { useRouter } from "next/navigation";
import { additionalReportPrice } from "../data/dashboardData";
import { DashboardActionCard } from "./DashboardActionCard";
import { DashboardGreeting } from "./DashboardGreeting";
import { DashboardHeaderActions } from "./DashboardHeaderActions";
import { RecentReportsTable } from "./RecentReportsTable";
import { ReportQuotaCard } from "./ReportQuotaCard";

export function DashboardShell() {
  const router = useRouter();
  const { displayName, userId, authMe } = useAuthUser();
  const role = getActiveContext(authMe)?.role;
  const canReadOwnQuota = hasPermission(authMe, "company:quota_read_own");
  const ownQuotaQuery = useOwnCompanyQuota({
    enabled: canReadOwnQuota,
  });

  const handleGenerateReport = () => {
    if (userId) {
      beginReportWizardSession(userId);
    }
    router.push("/reports/new");
  };

  const quota = canReadOwnQuota
    ? {
        used: ownQuotaQuery.data?.quota_used ?? null,
        total: ownQuotaQuery.data?.quota_total ?? null,
        additionalReportPrice,
      }
    : {
        used: 0,
        total: 0,
        additionalReportPrice,
      };

  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader actions={<DashboardHeaderActions />} />

      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-[var(--layout-page-padding)] py-14">
        <div className="flex flex-col gap-7">
          <DashboardGreeting user={{ displayName }} />

          <section
            aria-label="Dashboard actions"
            className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3"
          >
            <ReportQuotaCard
              quota={quota}
              isLoading={canReadOwnQuota && ownQuotaQuery.isLoading}
              errorMessage={
                canReadOwnQuota && ownQuotaQuery.isError
                  ? classifyQuotaQueryError(ownQuotaQuery.error, "own")
                  : null
              }
              onRetry={
                canReadOwnQuota && ownQuotaQuery.isError
                  ? () => {
                      void ownQuotaQuery.refetch();
                    }
                  : undefined
              }
              showBuyAdditional={role !== "company_seat_user"}
            />

            <DashboardActionCard
              title="Dosage Calculator"
              description="Quickly verify dosage assumptions and dosing rationale for HTA submissions."
              ctaLabel="Use Dosage Calculator"
              href="/dosage-calculator"
            />

            <DashboardActionCard
              variant="highlight"
              title="Generate Report"
              description="Generate a complete assessment report aligned with HTA compliance requirements."
              ctaLabel="Generate Report"
              onCtaClick={handleGenerateReport}
            />
          </section>

          <RecentReportsTable />
        </div>
      </main>
    </div>
  );
}
