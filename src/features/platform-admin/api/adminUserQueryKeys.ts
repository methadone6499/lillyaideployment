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
};
