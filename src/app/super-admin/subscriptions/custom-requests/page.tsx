import { AdminCustomRequestQueue } from "@/features/custom-subscriptions";
import { SuperAdminManagementPageShell } from "../../_components/SuperAdminManagementPageShell";
import { SubscriptionAdminNavigation } from "../_components/SubscriptionAdminNavigation";

export default function SuperAdminCustomRequestsPage() {
  return (
    <SuperAdminManagementPageShell title="Subscription Management">
      <SubscriptionAdminNavigation activeHref="/super-admin/subscriptions/custom-requests" />
      <AdminCustomRequestQueue />
    </SuperAdminManagementPageShell>
  );
}
