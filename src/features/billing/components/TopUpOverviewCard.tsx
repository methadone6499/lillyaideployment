"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { formatDisplayCount } from "@/lib/formatDisplay";
import { usePendingTopUpIntent, useTopUpOrder, useTopUpOverview } from "../hooks/useTopUps";
import { useSubscriptionOverview } from "../hooks/useSubscriptionOverview";
import type { PendingTopUpIntent } from "../store/useTopUpPurchaseStore";
import { formatAmountMinor } from "../utils/formatBilling";
import { isTopUpOrderPending } from "../utils/topUpPolicy";
import { PurchaseReportTopUpsDialog } from "./PurchaseReportTopUpsDialog";
import { TopUpErrorNotice } from "./TopUpErrorNotice";
import { TopUpPaymentStatus } from "./TopUpPaymentStatus";

function PendingTopUpPaymentLink({ intent }: { intent: PendingTopUpIntent }) {
  const [pollUntil] = useState(() => Date.now() + 60_000);
  const query = useTopUpOrder(intent, pollUntil);
  const order = query.data ?? intent.order;
  if (order && !isTopUpOrderPending(order.status)) return null;
  const label = !intent.order ? "Recover top-up payment"
    : !query.isFetchedAfterMount ? "Checking payment status…"
    : query.isError ? "Review top-up payment"
    : "Review pending top-up payment";
  return <Link href="/settings/billing#purchased-reports" className="text-brand underline underline-offset-2">{label}</Link>;
}

export function TopUpBalanceDetails({ compact = false, companyWide = false }: { compact?: boolean; companyWide?: boolean }) {
  const query = useTopUpOverview();
  const pending = usePendingTopUpIntent();
  const { data: subscriptionOverview } = useSubscriptionOverview();
  const [open, setOpen] = useState(false);
  const data = query.data;
  const isSeat = pending.context?.role === "company_seat_user";
  const showCompanyBalance = companyWide && !isSeat && data?.scope_type === "company" && data.can_manage_allocations;
  const canPurchase = !isSeat && !query.isError && data?.can_purchase === true;
  if (!pending.supported) return null;
  const purchaseButton = canPurchase && data ? <Button
    variant={compact ? "dashed" : "secondary"}
    size={compact ? "default" : "compact"}
    className={compact ? "w-full shrink-0" : "w-fit"}
    onClick={() => setOpen(true)}
  >
    {compact ? <span className="w-full text-left">+ Buy additional reports ({formatAmountMinor(data.unit_amount_minor, data.currency)} each)</span> : "Buy report top-ups"}
  </Button> : null;
  return <div className="flex flex-col gap-3 text-helper text-text-muted" aria-busy={query.isPending}>
    {data ? <>
      <p className="tabular-nums">{showCompanyBalance ? "Additional Company Reports" : isSeat ? "Assigned additional reports" : data.scope_type === "company" ? "Your usable additional reports" : "Additional reports"}: <span className="font-medium text-white">{formatDisplayCount(showCompanyBalance ? data.pool_balance + data.assigned_balance : data.scope_type === "user" ? data.pool_balance : isSeat ? data.assigned_balance : data.usable_balance)}</span></p>
      {!compact && !isSeat && data.scope_type === "company" && data.can_manage_allocations ? <>
        <p>Unallocated company pool: <span className="font-medium tabular-nums text-white">{formatDisplayCount(data.pool_balance)}</span></p>
        <p>Assigned and remaining with members: <span className="font-medium tabular-nums text-white">{formatDisplayCount(data.assigned_balance)}</span></p>
      </> : null}
      {!compact ? <>
        {!data.credits_expire ? <p>Additional reports do not expire and are used after monthly quota.</p> : null}
        {data.requires_paid_subscription ? <p>{subscriptionOverview?.can_use_paid_features && subscriptionOverview.subscription?.status === "active"
          ? "Your paid subscription is active. Additional reports require ongoing paid access."
          : "Usage policy: additional reports require an active paid subscription."}</p> : null}
        {data.scope_type === "user" && data.pool_balance > data.usable_balance ? <p>Currently usable additional reports: {formatDisplayCount(data.usable_balance)}</p> : null}
      </> : null}
      {!compact ? purchaseButton : null}
      {isSeat && data.usable_balance === 0 ? <p>Ask your company admin for additional report allocation when your monthly quota runs out.</p> : null}
      {!compact && !isSeat && !data.can_purchase ? <p>Top-ups are currently unavailable.</p> : null}
    </> : query.isError ? <><TopUpErrorNotice error={query.error} /><Button variant="ghost" size="compact" className="w-fit" disabled={query.isFetching} onClick={() => void query.refetch()}>Retry additional report balance</Button></> : <p role="status">Loading additional reports…</p>}
    {!compact && pending.hydrated && pending.intent ? <TopUpPaymentStatus key={pending.intent.idempotencyKey} intent={pending.intent} onNewPurchase={canPurchase ? () => setOpen(true) : undefined} /> : null}
    {compact && !open && pending.hydrated && pending.intent && (!pending.intent.order || isTopUpOrderPending(pending.intent.order.status)) ? <PendingTopUpPaymentLink key={pending.intent.idempotencyKey} intent={pending.intent} /> : null}
    {compact ? purchaseButton : null}
    {open ? <PurchaseReportTopUpsDialog key={pending.contextKey} onClose={() => setOpen(false)} /> : null}
  </div>;
}
export function PendingTopUpPaymentCard() {
  const pending = usePendingTopUpIntent();
  const intent = pending.intent;
  if (!pending.supported || !pending.hydrated || !intent || (intent.order && !isTopUpOrderPending(intent.order.status))) return null;
  return <Card id="purchased-reports" role="region" aria-label="Report top-up payment" className="mt-8 flex max-w-[1488px] scroll-mt-8 flex-col p-6">
    <TopUpPaymentStatus key={intent.idempotencyKey} intent={intent} />
  </Card>;
}
