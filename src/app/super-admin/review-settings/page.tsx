import { AdminReviewerSettings } from "@/features/reviewer";
import { SuperAdminManagementPageShell } from "../_components/SuperAdminManagementPageShell";

export default function SuperAdminReviewSettingsPage() {
  return (
    <SuperAdminManagementPageShell title="Reviewer Assignment Settings">
      <AdminReviewerSettings />
    </SuperAdminManagementPageShell>
  );
}
