import { cn } from "@/lib/cn";

import type { SubscriptionPurchaseRestriction } from "../schemas/billingSchemas";
import { SUBSCRIPTION_PURCHASE_SUSPENDED_MESSAGE } from "../utils/classifyBillingError";
import { formatLocalDateTime } from "../utils/formatBilling";

type SubscriptionPurchaseRestrictionNoticeProps = {
  restriction: SubscriptionPurchaseRestriction | null;
  className?: string;
};

export function SubscriptionPurchaseRestrictionNotice({
  restriction,
  className,
}: SubscriptionPurchaseRestrictionNoticeProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-3 rounded-surface border border-status-running/[0.12] bg-status-running/[0.08] p-4",
        className,
      )}
    >
      <h2 className="text-label font-medium text-status-running">
        Subscription changes suspended
      </h2>
      <p className="text-label text-text-body">
        {SUBSCRIPTION_PURCHASE_SUSPENDED_MESSAGE}
      </p>
      {restriction?.paid_access_ends_at ? (
        <p className="text-label text-text-body">
          Paid access end date:{" "}
          {formatLocalDateTime(restriction.paid_access_ends_at)}. This subscription
          will not renew.
        </p>
      ) : null}
    </div>
  );
}
