import { AdminUserDetailView } from "@/features/platform-admin";

import { AdminManagementPageShell } from "../../_components/AdminManagementPageShell";

type AdminUserDetailPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { userId } = await params;

  return (
    <AdminManagementPageShell
      title="User Details"
      parentLabel="User Management"
      parentHref="/admin/users"
    >
      <AdminUserDetailView userId={userId} />
    </AdminManagementPageShell>
  );
}
