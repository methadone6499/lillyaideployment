"use client";
import { Button } from "@/components/ui";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { hasPermission, useAuthUser } from "@/features/auth";
import { formatAmountMinor } from "@/features/billing";
import { ApiRequestError } from "@/services/ApiRequestError";
import { useAdminSubscription } from "../hooks/useAdminSubscriptions";
import { useAdminUser } from "../hooks/useAdminUser";
import { PLAN_TYPE_LABELS, SUBSCRIPTION_STATUS_LABELS, formatAdminDateTime } from "../utils/adminManagementDisplay";
import { AdminRequestId } from "./AdminRequestId";
import { SubscriptionPurchaseControls } from "./SubscriptionPurchaseControls";
export function AdminSubscriptionDetailDialog({ id, onClose }: {
  id: string;
  onClose: () => void;
}) {
  const query = useAdminSubscription(id);
  const { authMe } = useAuthUser();
  const owner = useAdminUser(query.data?.subscriber.user_id ?? "", hasPermission(authMe, "admin:users_read"));
  const s = query.data;
  const error = query.error instanceof ApiRequestError ? query.error : null;
  const details = s ? [
    ["Customer", s.scope_type === "company" ? s.company?.name || "Unavailable company" : s.subscriber.full_name || s.subscriber.email || "Unavailable customer"],
    ["Billing owner", s.subscriber.full_name || s.subscriber.email || "Unavailable owner"],
    ["Owner email", s.subscriber.email ?? "—"],
    ["Plan", PLAN_TYPE_LABELS[s.plan_type]], ["Status", SUBSCRIPTION_STATUS_LABELS[s.status]],
    ["Amount", `${formatAmountMinor(s.amount_minor, s.currency)} / month`], ["Scope", s.scope_type === "company" ? "Company" : "Personal"],
    ["Reports per period", String(s.limits.reports)], ["Seats", String(s.limits.seats)],
    ["Period starts", formatAdminDateTime(s.current_period_start)], ["Period ends", formatAdminDateTime(s.current_period_end)],
    ["Renewal", s.cancel_at_period_end ? "Cancellation scheduled" : "No cancellation scheduled"],
    ["Source", s.source === "stripe" ? "Stripe" : "Mock self service"],
    ["Stripe subscription", s.stripe_subscription_id ?? "—"], ["Latest paid invoice", s.latest_paid_invoice_id ?? "—"],
    ["Last Stripe event", formatAdminDateTime(s.last_stripe_event_created_at)],
    ["Created", formatAdminDateTime(s.created_at)], ["Updated", formatAdminDateTime(s.updated_at)],
  ] : [];
  return <ModalDialog title="Subscription details" onClose={onClose}>
    {query.isPending ? <p role="status">Loading subscription…</p> : query.isError ? <div role="alert"><p>{error?.message ?? "Unable to load subscription."}</p><AdminRequestId requestId={error?.requestId} />{error?.status !== 404 ? <Button variant="table" onClick={() => void query.refetch()}>Retry</Button> : null}</div> : <>
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{details.map(([label, value]) => <div key={label}><dt className="text-helper text-text-muted">{label}</dt><dd className="mt-1 break-words text-label text-white">{value}</dd></div>)}</dl>
      {owner.data && !owner.isError ? <>
        {!owner.data.subscription_restriction && s?.cancel_at_period_end ? <p className="mt-5 text-label text-text-muted">Purchases allowed · cancellation still scheduled</p> : null}
        <SubscriptionPurchaseControls user={owner.data} onTargetMissing={onClose} />
      </> : <div className="mt-5 text-label text-text-muted"><p>{owner.isFetching ? "Loading purchase restriction…" : "Purchase restriction information is unavailable."}</p>{owner.isError ? <Button size="compact" variant="table" onClick={() => void owner.refetch()}>Retry owner lookup</Button> : null}</div>}
    </>}
  </ModalDialog>;
}
