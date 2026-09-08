import { SuperAdminReportsTable } from "@/features/dashboard";
import { AdminReportAnalytics } from "@/features/platform-admin";
import { SuperAdminManagementPageShell } from "../_components/SuperAdminManagementPageShell";

export default function SuperAdminReportsPage() {
  return (
    <SuperAdminManagementPageShell
      title="Reports Management"
    >
      <AdminReportAnalytics />
      <div className="mt-9 lg:mt-14">
        <SuperAdminReportsTable />
      </div>
    </SuperAdminManagementPageShell>
  );
}
