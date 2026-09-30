import { AdminReviewerManagement } from "@/features/reviewer";
import { SuperAdminManagementPageShell } from "../_components/SuperAdminManagementPageShell";

export default function SuperAdminReviewersPage() {
  return (
    <SuperAdminManagementPageShell title="Reviewer Management">
      <AdminReviewerManagement />
    </SuperAdminManagementPageShell>
  );
}
