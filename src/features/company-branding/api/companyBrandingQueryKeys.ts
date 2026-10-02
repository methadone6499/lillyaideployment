export const companyBrandingQueryKeys = {
  root: ["company-branding"] as const,
  company: (userId: string, companyId: string) =>
    [...companyBrandingQueryKeys.root, userId, companyId] as const,
  metadata: (userId: string, companyId: string) =>
    [...companyBrandingQueryKeys.company(userId, companyId), "metadata"] as const,
  contentRoot: (userId: string, companyId: string) =>
    [...companyBrandingQueryKeys.company(userId, companyId), "content"] as const,
  content: (userId: string, companyId: string, version: number) =>
    [
      ...companyBrandingQueryKeys.contentRoot(userId, companyId),
      version,
    ] as const,
};
