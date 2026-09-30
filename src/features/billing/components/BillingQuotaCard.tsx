import { Card } from "@/components/ui";

import { formatUtcDate } from "../utils/formatBilling";
import type { BillingQuotaView } from "../utils/selectBillingCapabilities";

type BillingQuotaCardProps = {
  quotaView: BillingQuotaView;
};

export function BillingQuotaCard({ quotaView }: BillingQuotaCardProps) {
  return (
    <Card className="flex min-h-[247px] flex-col rounded-button p-6">
      <h2 className="text-card-title font-medium text-white">Report quota</h2>

      {quotaView.kind === "unlimited" ? (
        <>
          <p className="mt-4 text-[42px] font-medium leading-none text-brand">
            Unlimited
          </p>
          <p className="mt-3 text-helper text-text-muted">
            This account is not quota-limited.
          </p>
        </>
      ) : null}

      {quotaView.kind === "unavailable" ? (
        <>
          <p className="mt-4 text-[42px] font-medium leading-none text-brand">
            Unavailable
          </p>
          <p className="mt-3 text-helper text-text-muted">
            No matching quota period is available. This is not unlimited access.
          </p>
        </>
      ) : null}

      {quotaView.kind === "known" ? (
        <>
          <p className="mt-4 flex items-baseline font-medium leading-none">
            <span className="text-[42px] text-brand">
              {quotaView.quota.quota_used}
            </span>
            <span className="text-card-title text-brand/40">
              /{quotaView.quota.quota_total}
            </span>
          </p>
          <p className="mt-3 text-input font-medium text-text-body">
            {quotaView.quota.quota_remaining} remaining · period{" "}
            {formatUtcDate(quotaView.quota.period_start)} to{" "}
            {formatUtcDate(quotaView.quota.period_end)}
          </p>
          <p className="mt-2 text-helper text-text-muted">
            Remaining quota is informational. Report generation is still
            confirmed by the server.
          </p>
        </>
      ) : null}
    </Card>
  );
}
