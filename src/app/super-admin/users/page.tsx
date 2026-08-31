import { AdminUsersTable } from "@/features/platform-admin";
import { SuperAdminManagementPageShell } from "../_components/SuperAdminManagementPageShell";

export default function SuperAdminUsersPage() {
  return (
    <SuperAdminManagementPageShell
      title="User Management"
      description="View registered users, their access roles, organization, and account status."
    >
      <AdminUsersTable />
    </SuperAdminManagementPageShell>
  );
}
