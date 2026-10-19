export const companyQuotaQueryKeys = {
  root: ["company-quota"] as const,
  company: (userId: string, companyId?: string | null) =>
    [...companyQuotaQueryKeys.root, "company", userId, ...(companyId ? [companyId] : [])] as const,
  own: (userId: string, companyId?: string | null, membershipId?: string | null) =>
    [...companyQuotaQueryKeys.root, "own", userId, ...(companyId ? [companyId] : []), ...(membershipId ? [membershipId] : [])] as const,
  mutations: () => [...companyQuotaQueryKeys.root, "mutation"] as const,
  setMemberQuota: () =>
    [...companyQuotaQueryKeys.mutations(), "set-member"] as const,
  dismissRedistribution: () =>
    [...companyQuotaQueryKeys.mutations(), "dismiss-redistribution"] as const,
};
