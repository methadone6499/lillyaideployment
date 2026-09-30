import { ApiRequestError } from "@/services/ApiRequestError";

import type {
  OperationLock,
  OperationLockAction,
  SubscriptionOverview,
} from "../schemas/billingSchemas";

export type OperationLockScope = "personal" | "company";

const COMPANY_LOCK_ACTIONS: readonly OperationLockAction[] = [
  "seat_changes",
  "invitation_create",
  "invitation_resend",
  "invitation_accept",
  "quota_changes",
];

export function selectOperationLock(
  overview: SubscriptionOverview | null | undefined,
): OperationLock | null {
  return overview?.operation_lock ?? null;
}

export function isOperationBlocked(
  overview: SubscriptionOverview | null | undefined,
  action: OperationLockAction,
): boolean {
  return (
    selectOperationLock(overview)?.blocked_actions.includes(action) ?? false
  );
}

export function selectOperationLockScope(
  lock: OperationLock,
): OperationLockScope {
  return lock.blocked_actions.some((action) =>
    COMPANY_LOCK_ACTIONS.includes(action),
  )
    ? "company"
    : "personal";
}

/** A mutation raced the payment freeze; refetch the overview to show it. */
export function isOperationLockError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.code === "custom_subscription_payment_in_progress"
  );
}

export function getOperationLockMessage(lock: OperationLock): string {
  if (selectOperationLockScope(lock) === "company") {
    return lock.can_manage_payment
      ? "Your Custom plan payment is in progress. Seats, invitations, quota changes and report generation are paused until it completes or is cancelled."
      : "Your company's plan is being updated. Seats, invitations, quota changes and report generation are paused until the payment completes.";
  }

  return "Your Custom plan payment is in progress. Report generation is paused until it completes or is cancelled.";
}
