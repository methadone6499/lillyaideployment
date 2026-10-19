"use client";
import { useState } from "react";
import { Button } from "@/components/ui";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { hasPermission, useAuthUser } from "@/features/auth";
import { useRetryCooldown } from "@/hooks/useRetryCooldown";
import { ApiRequestError } from "@/services/ApiRequestError";
import { useSubscriptionRestriction } from "../hooks/useSubscriptionRestriction";
import { useAdminSubscription } from "../hooks/useAdminSubscriptions";
import type { AdminUserResponse } from "../schemas/adminUserSchemas";
import { formatAdminDateTime } from "../utils/adminManagementDisplay";
import { AdminRequestId } from "./AdminRequestId";
const errors: Record<string, string> = {
  protected_super_admin: "Super Admins cannot have subscription purchases suspended.",
  subscription_suspension_not_allowed: "Only active, verified customers can have subscription purchases suspended.",
  company_seat_managed_by_company: "Company seat access is managed by the company administrator.",
  subscription_owner_required: "This customer is no longer the billing owner. Review the refreshed information.",
  subscription_suspension_conflict: "The purchase restriction changed. Review the refreshed information, then try again.",
  billing_not_configured: "Billing is currently unavailable. The purchase restriction was not confirmed.",
  billing_provider_unavailable: "The billing provider is unavailable. Review the latest restriction state and retry when available.",
  permission_denied: "You do not have permission to manage subscription purchases.",
  not_found: "This customer no longer exists.",
};
export function SubscriptionPurchaseControls({ user, onTargetMissing }: {
  user: AdminUserResponse;
  onTargetMissing?: () => void;
}) {
  const { authMe } = useAuthUser();
  const mutation = useSubscriptionRestriction(user.id);
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"suspend" | "unsuspend">("suspend");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [retryAt, setRetryAt] = useState(0);
  const [denied, setDenied] = useState(false);
  const [openedAt, setOpenedAt] = useState(0);
  const cooldown = useRetryCooldown(retryAt);
  const restriction = user.subscription_restriction;
  const eligible = user.status === "active" && user.email_verified && !user.global_role &&
    (user.access.effective_role === "standard_user" || user.access.effective_role === "company_admin");
  const canManage = hasPermission(authMe, "admin:subscriptions_manage") && !denied;
  const current = useAdminSubscription(user.access_subscription?.id ?? "", open);
  const currentPending = Boolean(user.access_subscription) && action === "suspend" && (!current.data || current.isError || current.isFetching);
  const hasPaidPeriod = current.data && Date.parse(current.data.current_period_end) > openedAt && ["active", "trialing", "past_due"].includes(current.data.status);
  const error = mutation.error;
  const apiError = error instanceof ApiRequestError ? error : null;
  const confirm = async () => {
    if (mutation.isOwnerPending || cooldown || currentPending)
      return;
    try {
      const updated = await mutation.mutateAsync(action);
      setOpen(false);
      setFeedback(action === "unsuspend" ? "Subscription purchases are allowed. Billing has not been restarted." :
        updated.subscription_restriction?.paid_access_ends_at ? `Subscription purchases are suspended. Paid access continues until ${formatAdminDateTime(updated.subscription_restriction.paid_access_ends_at)}.` : "Subscription purchases are suspended. The account remains active.");
    }
    catch (failure) {
      if (failure instanceof ApiRequestError) {
        setRetryAt(Date.now() + (failure.retryAfterSeconds ?? 0) * 1000);
        if (failure.code === "permission_denied") {
          setDenied(true);
          setOpen(false);
          setFeedback(errors.permission_denied);
        }
        if (failure.code === "not_found") {
          setOpen(false);
          setFeedback(errors.not_found);
          onTargetMissing?.();
        }
      }
    }
  };
  return <div className="mt-5 border-t border-border-default pt-5">
    <h3 className="text-label font-medium text-white">Subscription purchases</h3>
    <p className="mt-2 text-label text-text-muted" role="status">
      {restriction?.status === "active" ? "Purchasing blocked" : restriction?.status === "pending_cancellation" ? "Suspension pending · provider cancellation needs retry" : "Purchasing allowed"}
      {!restriction && current.data?.cancel_at_period_end ? " · cancellation still scheduled" : ""}
      {restriction?.paid_access_ends_at ? ` · Paid access ends ${formatAdminDateTime(restriction.paid_access_ends_at)}` : ""}
    </p>
    {feedback ? <p role="status" className="mt-3 text-label text-text-body">{feedback}</p> : null}
    {canManage && (eligible || restriction) ? <Button className="mt-4" size="table" variant={restriction?.status === "active" ? "primary" : "destructive"} disabled={mutation.isOwnerPending || cooldown > 0} onClick={() => {
      mutation.reset();
      setFeedback(null);
      setOpenedAt(Date.now());
      setAction(restriction?.status === "active" ? "unsuspend" : "suspend");
      setOpen(true);
    }}>{cooldown ? `Retry in ${cooldown}s` : restriction?.status === "active" ? "Unsuspend subscription purchases" : restriction?.status === "pending_cancellation" ? "Retry suspension" : "Suspend subscription purchases"}</Button> : null}
    {open ? <ModalDialog title={`${action === "suspend" ? "Suspend subscription purchases" : "Allow subscription purchases"} for ${user.full_name}?`} busy={mutation.isOwnerPending} onClose={() => setOpen(false)}>
      <p className="text-label leading-relaxed text-text-body">
        {action === "unsuspend" ? "This removes the purchase restriction. It will not restart billing or cancel an existing period-end cancellation. The customer must resume or purchase a subscription themselves." :
          hasPaidPeriod ? `Renewal will be cancelled at the end of the current paid period on ${formatAdminDateTime(current.data.current_period_end)}. Access continues until then. The account and company members will not be disabled, but the owner cannot purchase, resume, or change subscriptions until you unsuspend them.` :
            "This account will be blocked from purchasing or starting a subscription until you unsuspend it. The account itself will remain active."}
      </p>
      {currentPending ? <p className="mt-4 text-label text-text-muted">{current.isError ? "Unable to verify the current subscription." : "Loading the current subscription…"}
        {current.isError ? <Button variant="table" size="compact" onClick={() => void current.refetch()}>Retry</Button> : null}</p> : null}
      {error ? <div role="alert" className="mt-4 text-label text-status-running"><p>{errors[apiError?.code ?? ""] ?? (error instanceof Error ? error.message : "Unable to update subscription purchases.")}</p><AdminRequestId requestId={apiError?.requestId} /></div> : null}
      <footer className="mt-6 flex flex-wrap justify-end gap-3">
        <Button data-autofocus variant="secondary" disabled={mutation.isOwnerPending} onClick={() => setOpen(false)}>{action === "suspend" ? "Keep active" : "Cancel"}</Button>
        <Button variant={action === "suspend" ? "destructiveSolid" : "primary"} disabled={mutation.isOwnerPending || cooldown > 0 || currentPending || (action === "suspend" && !eligible)} onClick={() => void confirm()}>
          {mutation.isOwnerPending ? "Updating…" : cooldown ? `Retry in ${cooldown}s` : action === "suspend" ? "Suspend purchases" : "Unsuspend purchases"}
        </Button>
      </footer>
    </ModalDialog> : null}
  </div>;
}
