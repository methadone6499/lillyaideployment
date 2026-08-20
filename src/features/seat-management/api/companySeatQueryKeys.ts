import type {
  CompanyRole,
  MembershipStatus,
} from "../schemas/seatManagementSchemas";

export type CompanySeatListQueryParams = {
  status?: MembershipStatus;
  role?: CompanyRole;
  search?: string;
  limit?: number;
};

export const companySeatQueryKeys = {
  root: ["company-seats"] as const,
  lists: (userId: string) =>
    [...companySeatQueryKeys.root, "list", userId] as const,
  list: (userId: string, params: CompanySeatListQueryParams) =>
    [...companySeatQueryKeys.lists(userId), params] as const,
  mutations: () => [...companySeatQueryKeys.root, "mutation"] as const,
  disable: () => [...companySeatQueryKeys.mutations(), "disable"] as const,
  enable: () => [...companySeatQueryKeys.mutations(), "enable"] as const,
  remove: () => [...companySeatQueryKeys.mutations(), "remove"] as const,
};
