"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { AuthPageShell, AuthSessionLoading } from "@/features/auth";
import { usePendingTopUpIntent, useTopUpOverview } from "../hooks/useTopUps";
import { useSubscriptionOverview } from "../hooks/useSubscriptionOverview";
import type { PendingTopUpIntent } from "../store/useTopUpPurchaseStore";
import { TopUpPaymentStatus } from "./TopUpPaymentStatus";
import { TopUpErrorNotice } from "./TopUpErrorNotice";
import { Button } from "@/components/ui";

function MissingOrderReturn() {
  const overview = useTopUpOverview(true, true);
  const subscription = useSubscriptionOverview({ staleTime: 0 });
  return <AuthPageShell title="Payment return received"><div className="flex flex-col gap-5">
    <p role="status" className="text-label text-text-body">We cannot identify this top-up payment in this tab. Your current balances are being refreshed; this return does not confirm payment.</p>
    <p className="text-helper text-text-muted">Use the original payment tab to check its status, or review your additional report balance on your dashboard. Contact support if the payment remains unresolved.</p>
    <TopUpErrorNotice error={overview.error ?? subscription.error} />
    <Button variant="secondary" disabled={overview.isFetching || subscription.isFetching} onClick={() => { void overview.refetch(); void subscription.refetch(); }}>Refresh balances</Button>
    <Link href="/settings/billing" className="text-label text-brand underline underline-offset-2">Review Billing</Link>
  </div></AuthPageShell>;
}
function ResolvedReturn({ intent, topUpReturn, children }: { intent: PendingTopUpIntent | undefined; topUpReturn: boolean; children: ReactNode }) {
  // Retain the receipt while completion clears the persisted pending intent.
  const [returnIntent] = useState(() => intent?.redirected ? intent : null);
  if (!returnIntent) return topUpReturn ? <MissingOrderReturn /> : children;
  return <AuthPageShell title="Report top-up payment"><div className="flex flex-col gap-6">
    <TopUpPaymentStatus intent={returnIntent} />
    <Link href="/settings/billing" className="text-center text-label text-brand underline underline-offset-2">Return to Billing</Link>
  </div></AuthPageShell>;
}
export function TopUpCheckoutReturnBoundary({ children }: { children: ReactNode }) {
  const pending = usePendingTopUpIntent();
  if (!pending.hydrated) return <AuthSessionLoading />;
  return <ResolvedReturn key={pending.contextKey} intent={pending.intent} topUpReturn={pending.returnKind === "top-up"}>{children}</ResolvedReturn>;
}
