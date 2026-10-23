"use client";

import { useEffect, useState } from "react";
import { Button, ModalDialog, TextField } from "@/components/ui";
import { useRetryCooldown } from "@/hooks/useRetryCooldown";
import { ApiRequestError } from "@/services/ApiRequestError";
import { usePendingTopUpIntent, useTopUpCheckoutMutation, useTopUpOverview } from "../hooks/useTopUps";
import { navigateToTopUpCheckout, useTopUpPurchaseStore, type PendingTopUpIntent } from "../store/useTopUpPurchaseStore";
import { formatAmountMinor } from "../utils/formatBilling";
import { parseTopUpInput } from "../utils/topUpPolicy";
import { getTopUpError } from "../utils/topUpErrors";
import { TopUpErrorNotice } from "./TopUpErrorNotice";
import { TopUpPaymentStatus } from "./TopUpPaymentStatus";
import { emitTopUpEvent } from "../utils/topUpTelemetry";

export function PurchaseReportTopUpsDialog({ onClose }: { onClose: () => void }) {
  const overview = useTopUpOverview();
  const pending = usePendingTopUpIntent();
  const mutation = useTopUpCheckoutMutation();
  const [quantityText, setQuantityText] = useState("1");
  const [payment, setPayment] = useState<PendingTopUpIntent | null>(() => pending.intent ?? null);
  const [error, setError] = useState<unknown>(null);
  const [retryAt, setRetryAt] = useState(0);
  const cooldown = useRetryCooldown(retryAt);
  const data = overview.data;
  const scopeType = data?.scope_type;
  useEffect(() => { if (scopeType) emitTopUpEvent({ name: "top_up_dialog_opened", scopeType }); }, [scopeType]);
  const quantity = data ? parseTopUpInput(quantityText, 1, data.max_purchase_quantity) : null;
  const total = quantity !== null && data ? quantity * data.unit_amount_minor : null;
  const eligible = pending.supported && pending.context?.role !== "company_seat_user" && !overview.isError && data?.can_purchase === true;
  const confirm = async () => {
    if (!data || !eligible || quantity === null || total === null || !Number.isSafeInteger(total) || !pending.userId) return;
    setError(null);
    const intent: PendingTopUpIntent = {
      userId: pending.userId, contextKey: pending.contextKey, quantity,
      idempotencyKey: crypto.randomUUID(), order: null, redirected: false,
      quotedUnitAmount: data.unit_amount_minor, quotedCurrency: data.currency,
    };
    try {
      // Persist before POST so an unknown network result can reuse this exact intent.
      useTopUpPurchaseStore.getState().put(pending.contextKey, intent);
      emitTopUpEvent({ name: "top_up_checkout_requested", quantity });
      const order = await mutation.mutateAsync({ intent });
      const saved = { ...intent, order };
      setPayment(saved);
      const unchangedPrice = order.quantity === quantity && order.unit_amount_minor === data.unit_amount_minor && order.currency === data.currency && order.total_amount_minor === total;
      if (unchangedPrice && order.status === "open") navigateToTopUpCheckout(saved);
    } catch (failure) {
      setError(failure);
      const saved = useTopUpPurchaseStore.getState().intents[pending.contextKey];
      // A known rejected request did not create a checkout; transport/5xx results remain recoverable.
      if (failure instanceof ApiRequestError && failure.status >= 400 && failure.status < 500 && !["idempotency_key_reused", "top_up_state_conflict"].includes(failure.code ?? "")) {
        useTopUpPurchaseStore.getState().remove(pending.contextKey);
      } else if (saved) setPayment(saved);
      if (failure instanceof ApiRequestError) setRetryAt(Date.now() + (failure.retryAfterSeconds ?? 0) * 1000);
    }
  };
  return <ModalDialog title="Buy report top-ups" busy={mutation.isPending} onClose={onClose}>
    <div className="flex flex-col gap-5">
      <TopUpErrorNotice error={error} />
      {payment ? <TopUpPaymentStatus intent={payment} initialRetryAt={retryAt} onNewPurchase={eligible ? () => { setPayment(null); setError(null); } : undefined} /> : data ? <>
        <TextField label="Number of reports" data-autofocus type="number" inputMode="numeric" min={1} max={data.max_purchase_quantity} step={1}
          value={quantityText} disabled={mutation.isPending || !eligible} onChange={(event) => setQuantityText(event.target.value)}
          helper={`Choose 1–${data.max_purchase_quantity} reports.`}
          error={quantity === null ? `Enter a whole number from 1 to ${data.max_purchase_quantity}.` : getTopUpError(error).fieldErrors.quantity} />
        <div className="flex flex-wrap justify-between gap-3 text-label text-text-body">
          <p>{formatAmountMinor(data.unit_amount_minor, data.currency)} per report</p>
          <p className="font-medium tabular-nums text-white">Total: {total !== null && Number.isSafeInteger(total) ? formatAmountMinor(total, data.currency) : "—"}</p>
        </div>
        <div className="space-y-2 text-helper text-text-muted">
          {!data.credits_expire ? <p>Additional reports do not expire.</p> : null}
          {data.requires_paid_subscription ? <p>An active paid subscription is required to use additional reports. Buying reports does not replace or extend your subscription.</p> : null}
          {data.scope_type === "company" ? <p>Reports enter the unallocated company pool and must be assigned to members, including yourself, before use.</p> : null}
          {data.scope_type === "user" && data.personal_credits_forfeited_on_company_upgrade ? <p>Unused personal top-ups will be permanently removed if you move to an Enterprise or Custom company subscription.</p> : null}
        </div>
        {!eligible ? <p role="status" className="text-helper text-text-muted">Top-ups are currently unavailable.</p> : null}
        <Button disabled={!eligible || !pending.hydrated || mutation.isPending || quantity === null || total === null || !Number.isSafeInteger(total) || cooldown > 0}
          onClick={() => void confirm()}>{mutation.isPending ? "Preparing checkout…" : cooldown ? `Retry in ${cooldown}s` : "Continue to payment"}</Button>
      </> : <><TopUpErrorNotice error={overview.error} /><p role="status" className="text-helper text-text-muted">{overview.isPending ? "Loading top-up pricing…" : "Pricing is unavailable."}</p>
        <Button variant="secondary" size="compact" disabled={overview.isFetching} onClick={() => void overview.refetch()}>Retry pricing</Button></>}
    </div>
  </ModalDialog>;
}
