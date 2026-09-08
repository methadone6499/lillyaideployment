import { AdminUsersTable } from "@/features/platform-admin";
import { SuperAdminManagementPageShell } from "../_components/SuperAdminManagementPageShell";

export default function SuperAdminUsersPage() {
  return (
    <SuperAdminManagementPageShell
      title="User Management"
    >
      <AdminUsersTable />
    </SuperAdminManagementPageShell>
  );
}
