import { AdminCompaniesTable } from "@/features/platform-admin";

import { AdminManagementPageShell } from "../_components/AdminManagementPageShell";

export default function AdminCompaniesPage() {
  return (
    <AdminManagementPageShell title="Company Management">
      <AdminCompaniesTable />
    </AdminManagementPageShell>
  );
}
