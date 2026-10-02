import type { UserStatus } from "@/features/auth";
import type { PlanType, SubscriptionStatus } from "@/features/billing";

import type { AdminCompanyMemberRole } from "../schemas/adminCompanyMemberSchemas";
import type { CompanyStatus, CompanyType } from "../schemas/adminCompanySchemas";
import type { MembershipStatus } from "../schemas/adminUserSchemas";

export type AdminCompanyListQueryParams = {
  limit?: number;
  search?: string;
  status?: CompanyStatus;
  type?: CompanyType;
  planType?: PlanType;
  subscriptionStatus?: SubscriptionStatus;
};

export type AdminCompanyMemberListQueryParams = {
  limit?: number;
  search?: string;
  status?: MembershipStatus;
  role?: AdminCompanyMemberRole;
  userStatus?: UserStatus;
};

export const adminCompanyQueryKeys = {
  root: ["admin-companies"] as const,
  lists: (userId: string) =>
    [...adminCompanyQueryKeys.root, "list", userId] as const,
  list: (userId: string, params: AdminCompanyListQueryParams) =>
    [...adminCompanyQueryKeys.lists(userId), params] as const,
  details: (userId: string) =>
    [...adminCompanyQueryKeys.root, "detail", userId] as const,
  detail: (userId: string, companyId: string) =>
    [...adminCompanyQueryKeys.details(userId), companyId] as const,
  memberLists: (userId: string) =>
    [...adminCompanyQueryKeys.root, "members", userId] as const,
  members: (
    userId: string,
    companyId: string,
    params: AdminCompanyMemberListQueryParams,
  ) =>
    [...adminCompanyQueryKeys.memberLists(userId), companyId, params] as const,
};
