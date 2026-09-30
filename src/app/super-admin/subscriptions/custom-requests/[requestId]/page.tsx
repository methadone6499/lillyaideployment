import { AdminCustomRequestDetailView } from "@/features/custom-subscriptions";
import { SuperAdminManagementPageShell } from "../../../_components/SuperAdminManagementPageShell";

type CustomRequestDetailRoutePageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function SuperAdminCustomRequestDetailPage({
  params,
}: CustomRequestDetailRoutePageProps) {
  const { requestId } = await params;

  return (
    <SuperAdminManagementPageShell title="Custom Plan Request">
      <AdminCustomRequestDetailView requestId={requestId} />
    </SuperAdminManagementPageShell>
  );
}
