import Link from "next/link";
import { getTopUpError } from "../utils/topUpErrors";
import { BillingRequestId } from "./BillingRequestId";

export function TopUpErrorNotice({ error }: { error: unknown }) {
  if (!error) return null;
  const info = getTopUpError(error);
  return <div role="alert" className="flex flex-col gap-2 text-helper text-status-running">
    <p>{info.message}</p>
    <BillingRequestId requestId={info.requestId} />
    {["paid_subscription_required", "subscription_cancellation_pending", "subscription_change_pending", "top_up_purchase_pending"].includes(info.code ?? "") ?
      <Link href="/settings/billing#purchased-reports" className="w-fit text-brand underline underline-offset-2">Review Billing</Link> : null}
    {info.code === "custom_subscription_payment_in_progress" ? <Link href="/settings/billing/custom" className="w-fit text-brand underline underline-offset-2">Manage Custom payment</Link> : null}
  </div>;
}
