import { AdminCompanyDetailView } from "@/features/platform-admin";

import { AdminManagementPageShell } from "../../_components/AdminManagementPageShell";

type AdminCompanyDetailPageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function AdminCompanyDetailPage({
  params,
}: AdminCompanyDetailPageProps) {
  const { companyId } = await params;

  return (
    <AdminManagementPageShell
      title="Company Details"
      parentLabel="Company Management"
      parentHref="/admin/companies"
    >
      <AdminCompanyDetailView companyId={companyId} />
    </AdminManagementPageShell>
  );
}
