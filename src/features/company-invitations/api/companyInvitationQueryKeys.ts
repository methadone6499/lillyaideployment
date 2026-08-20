import type { InvitationStatus } from "../schemas/companyInvitationSchemas";

export type CompanyInvitationListQueryParams = {
  status?: InvitationStatus;
  limit?: number;
};

export const companyInvitationQueryKeys = {
  root: ["company-invitations"] as const,
  lists: (userId: string) =>
    [...companyInvitationQueryKeys.root, "list", userId] as const,
  list: (userId: string, params: CompanyInvitationListQueryParams) =>
    [...companyInvitationQueryKeys.lists(userId), params] as const,
  mutations: () => [...companyInvitationQueryKeys.root, "mutation"] as const,
  create: () => [...companyInvitationQueryKeys.mutations(), "create"] as const,
  resend: () => [...companyInvitationQueryKeys.mutations(), "resend"] as const,
  revoke: () => [...companyInvitationQueryKeys.mutations(), "revoke"] as const,
  preview: () => [...companyInvitationQueryKeys.root, "preview"] as const,
  accept: () => [...companyInvitationQueryKeys.mutations(), "accept"] as const,
  register: () =>
    [...companyInvitationQueryKeys.mutations(), "register"] as const,
};
