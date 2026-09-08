export const companyQuotaQueryKeys = {
  root: ["company-quota"] as const,
  company: (userId: string) =>
    [...companyQuotaQueryKeys.root, "company", userId] as const,
  own: (userId: string) =>
    [...companyQuotaQueryKeys.root, "own", userId] as const,
  mutations: () => [...companyQuotaQueryKeys.root, "mutation"] as const,
  setMemberQuota: () =>
    [...companyQuotaQueryKeys.mutations(), "set-member"] as const,
};
