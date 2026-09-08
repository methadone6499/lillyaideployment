import type { SubscriptionStatus } from "@/features/enterprise-activation";

export type AdminCompanyListQueryParams = {
  limit?: number;
  search?: string;
  subscriptionStatus?: SubscriptionStatus;
};

export const adminCompanyQueryKeys = {
  root: ["admin-companies"] as const,
  lists: (userId: string) =>
    [...adminCompanyQueryKeys.root, "list", userId] as const,
  list: (userId: string, params: AdminCompanyListQueryParams) =>
    [...adminCompanyQueryKeys.lists(userId), params] as const,
};
