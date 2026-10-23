"use client";

import { useAuthUser } from "@/features/auth";
import {
  canReadCompanyBillingQuota,
  classifyBillingError,
  OperationLockBanner,
  selectBillingPageQuotaView,
  useReportQuotaAccess,
  resolvePaidActionFailurePath,
  resolvePaidFeatureDestination,
  useOperationLock,
  usePaidFeatureAccess,
} from "@/features/billing";
import { classifyQuotaQueryError, QuotaRedistributionPrompt, useCompanyQuota } from "@/features/company-quota";
import { beginReportWizardSession } from "@/features/report-generation";
import { useRouter } from "next/navigation";
import type { DashboardQuotaView } from "../types";
import { CompanyReportsTable } from "./CompanyReportsTable";
import { DashboardActionCard } from "./DashboardActionCard";
import { DashboardActionGrid, DashboardPageFrame } from "./DashboardPageFrame";
import { ReportQuotaCard } from "./ReportQuotaCard";

export function CompanyAdminDashboardShell() {
  const router = useRouter();
  const { displayName, userId, authMe } = useAuthUser();
  const paidAccess = usePaidFeatureAccess();
  const reportQuota = useReportQuotaAccess();
  const operationLock = useOperationLock();
  const isReportGenerationPaused = operationLock.isBlocked("report_generation");
  const canReadCompanyQuota = canReadCompanyBillingQuota(paidAccess.overview, authMe);
  const companyQuotaQuery = useCompanyQuota({
    enabled: canReadCompanyQuota,
    refetchOnMount: "always",
  });
  const companyQuota = canReadCompanyQuota && paidAccess.overview
    ? selectBillingPageQuotaView(paidAccess.overview, authMe, {
        data: companyQuotaQuery.data,
        isPending: companyQuotaQuery.isPending,
        errorMessage: companyQuotaQuery.isError
          ? classifyQuotaQueryError(companyQuotaQuery.error, "company")
          : null,
      })
    : null;
  const quotaView: DashboardQuotaView = paidAccess.isPending || companyQuota?.kind === "loading"
    ? { kind: "loading" }
    : companyQuota?.kind === "known"
      ? {
          kind: "known",
          used: companyQuota.quota.quota_used,
          total: companyQuota.quota.quota_total,
          remaining: companyQuota.quota.quota_remaining,
        }
      : { kind: "unavailable" };
  const quotaError = companyQuota?.kind === "error"
    ? companyQuota.message
    : paidAccess.error
      ? classifyBillingError(paidAccess.error).message
      : quotaView.kind === "unavailable"
        ? "Company quota is currently unavailable. Refresh to try again."
        : null;

  const handleGenerateReport = () => {
    if (isReportGenerationPaused || !reportQuota.canGenerate) {
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
      fullWidthSummary
      compactSpacing
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
        <DashboardActionGrid label="Company administrator actions" columns={4}>
          <ReportQuotaCard
            companyWide
            view={quotaView}
            errorMessage={quotaError}
            onRetry={() => {
              void paidAccess.refetch();
              if (canReadCompanyQuota) void companyQuotaQuery.refetch();
            }}
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
            disabled={!reportQuota.canGenerate}
            disabledReason={reportQuota.reason ?? undefined}
          />

          <DashboardActionCard
            title="Manage Seats"
            description="Quickly create seats, manage users, enable/disable accounts, and control report quotas."
            ctaLabel="Manage Seats"
            href="/company-admin/seats"
          />
        </DashboardActionGrid>
      }
    >
      <CompanyReportsTable />
    </DashboardPageFrame>
  );
}
