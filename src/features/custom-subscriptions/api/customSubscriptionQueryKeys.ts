import type {
  AdminActiveFilter,
  CustomRequestStatus,
} from "../schemas/customSubscriptionSchemas";

export type AdminCustomRequestListQueryParams = {
  statuses: readonly CustomRequestStatus[];
  active?: AdminActiveFilter;
  search?: string;
  limit: number;
};

export const customSubscriptionQueryKeys = {
  root: ["custom-subscriptions"] as const,
  offerState: (userId: string) =>
    [...customSubscriptionQueryKeys.root, "offer-state", userId] as const,
  activationAuth: (userId: string, generation: number) =>
    [
      ...customSubscriptionQueryKeys.root,
      "activation-auth",
      userId,
      generation,
    ] as const,
  admin: (userId: string) =>
    [...customSubscriptionQueryKeys.root, "admin", userId] as const,
  adminLists: (userId: string) =>
    [...customSubscriptionQueryKeys.admin(userId), "list"] as const,
  adminList: (userId: string, params: AdminCustomRequestListQueryParams) =>
    [...customSubscriptionQueryKeys.adminLists(userId), params] as const,
  adminDetail: (userId: string, requestId: string) =>
    [...customSubscriptionQueryKeys.admin(userId), "detail", requestId] as const,
  mutations: () => [...customSubscriptionQueryKeys.root, "mutation"] as const,
  createRequest: () =>
    [...customSubscriptionQueryKeys.mutations(), "create-request"] as const,
  updateRequest: () =>
    [...customSubscriptionQueryKeys.mutations(), "update-request"] as const,
  cancelRequest: () =>
    [...customSubscriptionQueryKeys.mutations(), "cancel-request"] as const,
  acceptOffer: () =>
    [...customSubscriptionQueryKeys.mutations(), "accept-offer"] as const,
  resumePayment: () =>
    [...customSubscriptionQueryKeys.mutations(), "resume-payment"] as const,
  cancelPayment: () =>
    [...customSubscriptionQueryKeys.mutations(), "cancel-payment"] as const,
  requestChanges: () =>
    [...customSubscriptionQueryKeys.mutations(), "request-changes"] as const,
  declineOffer: () =>
    [...customSubscriptionQueryKeys.mutations(), "decline-offer"] as const,
  resendOfferEmail: () =>
    [...customSubscriptionQueryKeys.mutations(), "resend-offer-email"] as const,
  adminMutation: (action: string) =>
    [...customSubscriptionQueryKeys.mutations(), "admin", action] as const,
};
