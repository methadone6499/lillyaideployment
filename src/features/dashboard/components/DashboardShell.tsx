"use client";

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
import { DashboardActionGrid, DashboardPageFrame } from "./DashboardPageFrame";
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
    <DashboardPageFrame
      displayName={displayName}
      notices={<OperationLockBanner className="mt-8" />}
      summary={
        <DashboardActionGrid label="Dashboard actions">
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
            title="Budget Impact Calculator"
            description="Model dosing, treatment costs, and multi-year budget impact analysis for HTA submissions."
            ctaLabel="Open Calculator"
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
        </DashboardActionGrid>
      }
    >
      <RecentReportsTable />
    </DashboardPageFrame>
  );
}
