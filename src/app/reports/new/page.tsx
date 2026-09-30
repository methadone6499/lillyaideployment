import { PaidFeatureGate } from "@/features/billing";
import { GenerateReportShell } from "@/features/report-generation";

export default function NewReportPage() {
  return (
    <PaidFeatureGate feature="report_generation">
      <GenerateReportShell />
    </PaidFeatureGate>
  );
}
