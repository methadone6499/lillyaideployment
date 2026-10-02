import type { UserStatus } from "@/features/auth";

export type AdminUserListQueryParams = {
  limit?: number;
  search?: string;
  status?: UserStatus;
};

export const adminUserQueryKeys = {
  root: ["admin-users"] as const,
  lists: (userId: string) =>
    [...adminUserQueryKeys.root, "list", userId] as const,
  list: (userId: string, params: AdminUserListQueryParams) =>
    [...adminUserQueryKeys.lists(userId), params] as const,
  details: (userId: string) =>
    [...adminUserQueryKeys.root, "detail", userId] as const,
  detail: (userId: string, targetUserId: string) =>
    [...adminUserQueryKeys.details(userId), targetUserId] as const,
  mutations: () => [...adminUserQueryKeys.root, "mutation"] as const,
  disable: () => [...adminUserQueryKeys.mutations(), "disable"] as const,
  enable: () => [...adminUserQueryKeys.mutations(), "enable"] as const,
};
