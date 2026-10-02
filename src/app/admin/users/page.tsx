import { AdminUsersTable } from "@/features/platform-admin";

import { AdminManagementPageShell } from "../_components/AdminManagementPageShell";

export default function AdminUsersPage() {
  return (
    <AdminManagementPageShell title="User Management">
      <AdminUsersTable />
    </AdminManagementPageShell>
  );
}
