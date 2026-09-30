import { AdminReviewDashboardView } from "@/features/reviewer";
import { SuperAdminManagementPageShell } from "../_components/SuperAdminManagementPageShell";

export default function SuperAdminReviewAssignmentsPage() {
  return (
    <SuperAdminManagementPageShell title="Review Dashboard">
      <AdminReviewDashboardView />
    </SuperAdminManagementPageShell>
  );
}
