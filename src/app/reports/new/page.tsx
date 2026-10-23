import { PaidFeatureGate } from "@/features/billing";
import { DashboardHeaderActions } from "@/features/dashboard";
import { GenerateReportShell } from "@/features/report-generation";

export default function NewReportPage() {
  return (
    <PaidFeatureGate feature="report_generation">
      <GenerateReportShell headerActions={<DashboardHeaderActions />} />
    </PaidFeatureGate>
  );
}
