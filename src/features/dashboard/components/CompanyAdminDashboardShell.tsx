"use client";

import { AppHeader } from "@/components/shared/AppHeader";
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
import { DashboardGreeting } from "./DashboardGreeting";
import { DashboardHeaderActions } from "./DashboardHeaderActions";

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
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader actions={<DashboardHeaderActions />} />

      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-4 pt-10 pb-14 sm:px-6 lg:px-12 lg:pt-[57px]">
        <DashboardGreeting user={{ displayName }} />

        <OperationLockBanner className="mt-8 xl:max-w-[1624px]" />
        <QuotaRedistributionPrompt
          assignQuotaHref="/company-admin/seats"
          className="mt-4 xl:max-w-[1624px]"
        />

        <section
          aria-label="Company administrator actions"
          className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:mt-[55px] xl:max-w-[1624px] xl:grid-cols-3"
        >
          <DashboardActionCard
            title="Manage Seats"
            description="Quickly create seats, manage users, enable/disable accounts, and control report quotas."
            ctaLabel="Manage Seats"
            href="/company-admin/seats"
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

        <div className="mt-10 xl:mt-[60px]">
          <CompanyReportsTable />
        </div>
      </main>
    </div>
  );
}
