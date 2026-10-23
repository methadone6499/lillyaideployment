"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui";
import { useRetryCooldown } from "@/hooks/useRetryCooldown";
import { ApiRequestError } from "@/services/ApiRequestError";
import { useTopUpCheckoutMutation, useTopUpOrder } from "../hooks/useTopUps";
import { navigateToTopUpCheckout, useTopUpPurchaseStore, type PendingTopUpIntent } from "../store/useTopUpPurchaseStore";
import { formatAmountMinor } from "../utils/formatBilling";
import { getTopUpCheckoutUrl, isTopUpOrderPending, TOP_UP_STATUS_COPY } from "../utils/topUpPolicy";
import { TopUpErrorNotice } from "./TopUpErrorNotice";
import { isTopUpOrderNotFound } from "../utils/topUpErrors";

export function TopUpPaymentStatus({ intent: originalIntent, onNewPurchase, initialRetryAt = 0 }: {
  intent: PendingTopUpIntent;
  onNewPurchase?: () => void;
  initialRetryAt?: number;
}) {
  const [intent, setIntent] = useState(originalIntent);
  const [pollUntil] = useState(() => Date.now() + 60_000);
  const pollingSeconds = useRetryCooldown(pollUntil);
  const query = useTopUpOrder(intent, pollUntil);
  const recovery = useTopUpCheckoutMutation();
  const [error, setError] = useState<unknown>(null);
  const [retryAt, setRetryAt] = useState(0);
  const cooldown = useRetryCooldown(Math.max(retryAt, initialRetryAt,
    query.error instanceof ApiRequestError ? query.errorUpdatedAt + (query.error.retryAfterSeconds ?? 0) * 1000 : 0));
  const unavailable = isTopUpOrderNotFound(query.error);
  const order = unavailable ? null : query.data ?? intent.order;
  const checkingOrder = Boolean(intent.order) && !query.isFetchedAfterMount;
  const canContinue = !checkingOrder && !query.isError && order && getTopUpCheckoutUrl(order);
  const recover = async () => {
    setError(null);
    try {
      const result = await recovery.mutateAsync({ intent });
      setIntent({ ...intent, order: result });
    } catch (failure) {
      setError(failure);
      if (failure instanceof ApiRequestError) setRetryAt(Date.now() + (failure.retryAfterSeconds ?? 0) * 1000);
    }
  };
  const priceChanged = order && (order.quantity !== intent.quantity || order.unit_amount_minor !== intent.quotedUnitAmount || order.currency !== intent.quotedCurrency ||
    order.total_amount_minor !== intent.quantity * intent.quotedUnitAmount);
  return <div className="flex flex-col gap-4" aria-busy={query.isFetching || recovery.isPending}>
    <p role="status" className="text-label text-text-body">{unavailable ? "This payment is no longer available to your account. Review your refreshed balance on your dashboard." : checkingOrder ? "Checking the latest payment status…" : query.isError && order && isTopUpOrderPending(order.status) ? "We could not refresh this payment's status. Check again below." : order ? TOP_UP_STATUS_COPY[order.status] : "We could not confirm whether checkout was created. Recover this same payment request before starting another."}</p>
    {order ? <p className="text-helper text-text-muted">{order.quantity} reports · {formatAmountMinor(order.total_amount_minor, order.currency)}</p> : null}
    {priceChanged && order?.status === "open" ? <p className="text-helper text-status-running">Pricing changed since your preview. Review the total above before continuing.</p> : null}
    {order && isTopUpOrderPending(order.status) && !pollingSeconds ? <p className="text-helper text-text-muted">Automatic checking has stopped. Bank confirmation can take longer; you can check again below.</p> : null}
    {!checkingOrder && !query.isError && order?.status === "open" ? <p className="text-helper text-text-muted">Returning from checkout does not cancel the payment session. It remains open until it expires and can block a personal-to-company plan change.</p> : null}
    <TopUpErrorNotice error={error ?? query.error} />
    <div className="flex flex-wrap gap-3">
      {canContinue && order ? <Button size="compact" onClick={() => {
        try { navigateToTopUpCheckout({ ...intent, order }); } catch (failure) { setError(failure); }
      }}>{priceChanged ? "Confirm total and continue payment" : "Continue payment"}</Button> : null}
      {!unavailable && (!order || order.status === "creating") ? <Button size="compact" disabled={checkingOrder || recovery.isPending || cooldown > 0} onClick={() => void recover()}>
        {recovery.isPending ? "Recovering checkout…" : cooldown ? `Retry in ${cooldown}s` : "Recover checkout"}
      </Button> : null}
      {order && isTopUpOrderPending(order.status) ? <Button variant="secondary" size="compact" disabled={query.isFetching || cooldown > 0} onClick={() => void query.refetch()}>
        {query.isFetching ? "Checking…" : "Check payment status"}
      </Button> : null}
      {(unavailable || (order && ["failed", "expired"].includes(order.status))) && onNewPurchase ? <Button size="compact" onClick={() => {
        useTopUpPurchaseStore.getState().remove(intent.contextKey, intent.idempotencyKey); onNewPurchase();
      }}>Start a new purchase</Button> : null}
    </div>
    {order?.status === "completed" && order.scope_type === "company" ? <p className="text-helper text-text-muted">The reports are in the company pool. <Link href="/company-admin/seats#purchased-report-allocations" className="text-brand underline underline-offset-2">Assign reports to yourself or members</Link> before using them.</p> : null}
  </div>;
}
