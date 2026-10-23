import { CustomAwareBillingSuccessPage } from "@/features/custom-subscriptions";
import { TopUpCheckoutReturnBoundary } from "@/features/billing";

export const dynamic = "force-dynamic";

export default function BillingSuccessRoutePage() {
  return <TopUpCheckoutReturnBoundary><CustomAwareBillingSuccessPage /></TopUpCheckoutReturnBoundary>;
}
