"use client";

import { AppHeader } from "@/components/shared/AppHeader";
import { getActiveContext, useAuthUser } from "@/features/auth";
import {
  classifyBillingError,
  OperationLockBanner,
  resolvePaidActionFailurePath,
  resolvePaidFeatureDestination,
  useOperationLock,
  usePaidFeatureAccess,
} from "@/features/billing";
import {
  classifyQuotaQueryError,
  useOwnCompanyQuota,
} from "@/features/company-quota";
import { beginReportWizardSession } from "@/features/report-generation";
import { useRouter } from "next/navigation";
import { selectDashboardQuotaCard } from "../utils/selectDashboardQuotaCard";
import { DashboardActionCard } from "./DashboardActionCard";
import { DashboardGreeting } from "./DashboardGreeting";
import { DashboardHeaderActions } from "./DashboardHeaderActions";
import { RecentReportsTable } from "./RecentReportsTable";
import { ReportQuotaCard } from "./ReportQuotaCard";

export function DashboardShell() {
  const router = useRouter();
  const { displayName, userId, authMe } = useAuthUser();
  const role = getActiveContext(authMe)?.role;
  const paidAccess = usePaidFeatureAccess();
  const operationLock = useOperationLock();
  const isReportGenerationPaused = operationLock.isBlocked("report_generation");
  const canReadOwnQuota = paidAccess.quotaSource === "company_allocation";
  const ownQuotaQuery = useOwnCompanyQuota({
    enabled: canReadOwnQuota,
  });
  const overviewClassified = paidAccess.error
    ? classifyBillingError(paidAccess.error)
    : null;
  const quotaCard = selectDashboardQuotaCard({
    source: paidAccess.quotaSource,
    billingQuotaView: paidAccess.quotaView,
    overviewPending: paidAccess.isPending,
    overviewErrorMessage: overviewClassified?.message ?? null,
    ownQuota: ownQuotaQuery.data,
    ownQuotaPending: ownQuotaQuery.isPending,
    ownQuotaErrorMessage:
      canReadOwnQuota && ownQuotaQuery.isError
        ? classifyQuotaQueryError(ownQuotaQuery.error, "own")
        : null,
  });

  const handleGenerateReport = () => {
    if (isReportGenerationPaused) {
      return;
    }

    if (paidAccess.features?.report_generation === false) {
      router.push(
        resolvePaidActionFailurePath(
          "subscription_required",
          paidAccess.overview,
        ),
      );
      return;
    }

    if (userId) {
      beginReportWizardSession(userId);
    }
    router.push("/reports/new");
  };

  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader actions={<DashboardHeaderActions />} />

      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-[var(--layout-page-padding)] py-14">
        <div className="flex flex-col gap-7">
          <DashboardGreeting user={{ displayName }} />

          <OperationLockBanner />

          <section
            aria-label="Dashboard actions"
            className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3"
          >
            <ReportQuotaCard
              view={quotaCard.view}
              errorMessage={quotaCard.errorMessage}
              onRetry={
                canReadOwnQuota && ownQuotaQuery.isError
                  ? () => {
                      void ownQuotaQuery.refetch();
                    }
                  : paidAccess.isError
                    ? () => {
                        void paidAccess.refetch();
                      }
                    : undefined
              }
              showBuyAdditional={role !== "company_seat_user"}
            />

            <DashboardActionCard
              title="Dosage Calculator"
              description="Quickly verify dosage assumptions and dosing rationale for HTA submissions."
              ctaLabel="Use Dosage Calculator"
              href={resolvePaidFeatureDestination({
                overview: paidAccess.overview,
                me: authMe,
                feature: "dosage_calculator",
                allowedPath: "/dosage-calculator",
              })}
            />

            <DashboardActionCard
              variant="highlight"
              title="Generate Report"
              description="Generate a complete assessment report aligned with HTA compliance requirements."
              ctaLabel="Generate Report"
              onCtaClick={handleGenerateReport}
              disabled={isReportGenerationPaused}
              disabledReason="Report generation is paused while a Custom plan payment is in progress."
            />
          </section>

          <RecentReportsTable />
        </div>
      </main>
    </div>
  );
}
