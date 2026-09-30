"use client";

import { Button } from "@/components/ui";

import { assignHostedBillingUrl } from "../utils/assignHostedBillingUrl";

type BillingHostedActionsProps = {
  checkoutUrl?: string | null;
  hostedInvoiceUrl?: string | null;
  disabled?: boolean;
};

export function BillingHostedActions({
  checkoutUrl,
  hostedInvoiceUrl,
  disabled = false,
}: BillingHostedActionsProps) {
  if (!checkoutUrl && !hostedInvoiceUrl) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {checkoutUrl ? (
        <Button
          type="button"
          disabled={disabled}
          onClick={() => {
            assignHostedBillingUrl(checkoutUrl);
          }}
        >
          Resume checkout
        </Button>
      ) : null}
      {hostedInvoiceUrl ? (
        <Button
          type="button"
          variant={checkoutUrl ? "secondary" : "primary"}
          disabled={disabled}
          onClick={() => {
            assignHostedBillingUrl(hostedInvoiceUrl);
          }}
        >
          Complete payment
        </Button>
      ) : null}
    </div>
  );
}
