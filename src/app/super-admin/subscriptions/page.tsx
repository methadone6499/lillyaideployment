import {
  AdminSubscriptionSummaryCards,
  AdminSubscriptionsTable,
} from "@/features/platform-admin";
import { SuperAdminManagementPageShell } from "../_components/SuperAdminManagementPageShell";
import { SubscriptionAdminNavigation } from "./_components/SubscriptionAdminNavigation";

export default function SuperAdminSubscriptionsPage() {
  return (
    <SuperAdminManagementPageShell title="Subscription Management">
      <SubscriptionAdminNavigation activeHref="/super-admin/subscriptions" />
      <AdminSubscriptionSummaryCards />
      <AdminSubscriptionsTable />
    </SuperAdminManagementPageShell>
  );
}
