"use client";

import { useAuthUser } from "@/features/auth";
import {
  OperationLockBanner,
  resolvePaidActionFailurePath,
  resolvePaidFeatureDestination,
  useOperationLock,
  usePaidFeatureAccess,
} from "@/features/billing";
import { QuotaRedistributionPrompt } from "@/features/company-quota";
import { beginReportWizardSession } from "@/features/report-generation";
import { useRouter } from "next/navigation";
import { CompanyReportsTable } from "./CompanyReportsTable";
import { DashboardActionCard } from "./DashboardActionCard";
import { DashboardActionGrid, DashboardPageFrame } from "./DashboardPageFrame";

export function CompanyAdminDashboardShell() {
  const router = useRouter();
  const { displayName, userId, authMe } = useAuthUser();
  const paidAccess = usePaidFeatureAccess();
  const operationLock = useOperationLock();
  const isReportGenerationPaused = operationLock.isBlocked("report_generation");

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
      notices={
        <>
          <OperationLockBanner className="mt-8" />
          <QuotaRedistributionPrompt
            assignQuotaHref="/company-admin/seats"
            className="mt-4"
          />
        </>
      }
      summary={
        <DashboardActionGrid label="Company administrator actions">
          <DashboardActionCard
            title="Manage Seats"
            description="Quickly create seats, manage users, enable/disable accounts, and control report quotas."
            ctaLabel="Manage Seats"
            href="/company-admin/seats"
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
      <CompanyReportsTable />
    </DashboardPageFrame>
  );
}
