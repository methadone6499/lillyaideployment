"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { useRetryCooldown } from "@/hooks/useRetryCooldown";
import { ApiRequestError } from "@/services/ApiRequestError";
import { useResumeSubscriptionMutation } from "../hooks/useBillingMutations";
import type { SubscriptionSummary } from "../schemas/billingSchemas";
import { classifyBillingError } from "../utils/classifyBillingError";
import { BillingRequestId } from "./BillingRequestId";
export function ResumeSubscriptionAction({ subscription, disabled }: {
  subscription: SubscriptionSummary;
  disabled: boolean;
}) {
  const mutation = useResumeSubscriptionMutation();
  const [expired, setExpired] = useState(() => Date.parse(subscription.current_period_end) <= Date.now());
  const [retryAt, setRetryAt] = useState(0);
  const cooldown = useRetryCooldown(retryAt);
  const end = Date.parse(subscription.current_period_end);
  useEffect(() => {
    let timer: number;
    const schedule = () => {
      const delay = end - Date.now();
      if (delay <= 0) {
        setExpired(true);
        return;
      }
      timer = window.setTimeout(schedule, Math.min(delay, 2147483647));
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [end]);
  const classified = mutation.error ? classifyBillingError(mutation.error) : null;
  const available = !expired && subscription.cancel_at_period_end && ["trialing", "active", "past_due"].includes(subscription.status);
  const resume = async () => {
    if (!available || disabled || mutation.isPending || cooldown)
      return;
    if (end <= Date.now()) {
      setExpired(true);
      return;
    }
    try {
      await mutation.mutateAsync();
    }
    catch (error) {
      if (error instanceof ApiRequestError)
        setRetryAt(Date.now() + (error.retryAfterSeconds ?? 0) * 1000);
    }
  };
  if (!available && !classified && !mutation.isSuccess)
    return null;
  return <div className="flex w-full flex-col gap-3">
    {available ? <Button className="w-fit" disabled={disabled || mutation.isPending || cooldown > 0 || classified?.kind === "subscription_purchase_suspended"} onClick={() => void resume()}>{mutation.isPending ? "Resuming…" : cooldown ? `Retry in ${cooldown}s` : "Resume subscription"}</Button> : null}
    {classified ? <div role="alert" className="text-label text-status-running"><p>{classified.kind === "billing_reconciliation_failed" ? "We could not confirm the renewal update. Please retry or contact support with this reference." : classified.message}</p><BillingRequestId requestId={classified.requestId} /></div> : mutation.isSuccess ? <p role="status" className="text-label text-status-success">Subscription renewal resumed.</p> : null}
  </div>;
}
