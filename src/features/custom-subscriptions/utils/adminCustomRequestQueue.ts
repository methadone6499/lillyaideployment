import {
  ACTIVE_CUSTOM_REQUEST_STATUSES,
  TERMINAL_CUSTOM_REQUEST_STATUSES,
  type AdminCustomRequestDetail,
  type AdminCustomRequestList,
  type CustomOffer,
  type CustomRequestStatus,
} from "../schemas/customSubscriptionSchemas";

export const ADMIN_CUSTOM_REQUESTS_PATH =
  "/super-admin/subscriptions/custom-requests";

export function buildAdminCustomRequestPath(requestId: string): string {
  return `${ADMIN_CUSTOM_REQUESTS_PATH}/${encodeURIComponent(requestId)}`;
}

export type AdminCustomRequestTabId =
  | "active"
  | "new"
  | "in_review"
  | "waiting"
  | "changes_requested"
  | "payment_pending"
  | "finished";

export type AdminCustomRequestTab = {
  id: AdminCustomRequestTabId;
  label: string;
  statuses: readonly CustomRequestStatus[];
};

export const ADMIN_CUSTOM_REQUEST_TABS: readonly AdminCustomRequestTab[] = [
  { id: "active", label: "All active", statuses: ACTIVE_CUSTOM_REQUEST_STATUSES },
  { id: "new", label: "New", statuses: ["submitted"] },
  { id: "in_review", label: "In review", statuses: ["under_review"] },
  {
    id: "waiting",
    label: "Waiting on customer",
    statuses: ["action_required", "offered"],
  },
  {
    id: "changes_requested",
    label: "Changes requested",
    statuses: ["changes_requested"],
  },
  {
    id: "payment_pending",
    label: "Payment pending",
    statuses: ["payment_pending"],
  },
  {
    id: "finished",
    label: "Finished",
    statuses: TERMINAL_CUSTOM_REQUEST_STATUSES,
  },
];

export function getAdminCustomRequestTab(
  id: AdminCustomRequestTabId,
): AdminCustomRequestTab {
  return (
    ADMIN_CUSTOM_REQUEST_TABS.find((tab) => tab.id === id) ??
    ADMIN_CUSTOM_REQUEST_TABS[0]
  );
}

/**
 * `counts_by_status` omits statuses with no matches; treat a missing key as 0.
 * The queue always sends `active=all`, so counts cover every tab.
 */
export function countAdminCustomRequestTab(
  counts: AdminCustomRequestList["counts_by_status"] | undefined,
  tab: AdminCustomRequestTab,
): number {
  if (!counts) {
    return 0;
  }

  return tab.statuses.reduce((total, status) => total + (counts[status] ?? 0), 0);
}

const REVIEWABLE_STATUSES = new Set<CustomRequestStatus>(["submitted"]);
const ACTION_REQUIRED_STATUSES = new Set<CustomRequestStatus>([
  "submitted",
  "under_review",
  "changes_requested",
]);
const CLOSABLE_STATUSES = new Set<CustomRequestStatus>([
  "submitted",
  "under_review",
  "action_required",
  "offered",
  "changes_requested",
]);
const DRAFTABLE_STATUSES = new Set<CustomRequestStatus>([
  "under_review",
  "changes_requested",
]);

export type AdminCustomRequestActions = {
  canStartReview: boolean;
  canRequestInfo: boolean;
  canClose: boolean;
  canCreateDraft: boolean;
  draftOffer: CustomOffer | null;
  publishedOffer: CustomOffer | null;
  canResendCloseEmail: boolean;
};

export function selectAdminCustomRequestActions(
  detail: AdminCustomRequestDetail,
): AdminCustomRequestActions {
  const { request, offers, close_email: closeEmail } = detail;
  const draftOffer = offers.find((offer) => offer.status === "draft") ?? null;
  const publishedOffer =
    offers.find((offer) => offer.status === "published") ?? null;

  return {
    canStartReview: REVIEWABLE_STATUSES.has(request.status),
    canRequestInfo: ACTION_REQUIRED_STATUSES.has(request.status),
    canClose: CLOSABLE_STATUSES.has(request.status),
    canCreateDraft:
      DRAFTABLE_STATUSES.has(request.status) && !draftOffer && !publishedOffer,
    draftOffer,
    publishedOffer,
    canResendCloseEmail:
      request.status === "closed" &&
      closeEmail !== null &&
      closeEmail.status !== "sent",
  };
}
