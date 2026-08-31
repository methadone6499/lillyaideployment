import { Button, PlusIcon } from "@/components/ui";
import {
  AdminSubscriptionSummaryCards,
  AdminSubscriptionsTable,
} from "@/features/platform-admin";
import { SuperAdminManagementPageShell } from "../_components/SuperAdminManagementPageShell";

export default function SuperAdminSubscriptionsPage() {
  return (
    <SuperAdminManagementPageShell
      title="Subscription Management"
      description="Create and manage custom subscriptions with report quotas, seats, billing, and status controls"
      action={
        <Button
          leadingIcon={<PlusIcon />}
          disabled
          title="Creating subscriptions is not available yet."
          className="w-full pl-3 pr-5 sm:w-auto"
        >
          Create Custom Subscription
        </Button>
      }
    >
      <AdminSubscriptionSummaryCards />
      <AdminSubscriptionsTable />
    </SuperAdminManagementPageShell>
  );
}
