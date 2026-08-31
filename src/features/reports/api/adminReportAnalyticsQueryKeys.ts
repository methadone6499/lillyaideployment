export type AdminReportAnalyticsLeaderboardQueryParams = {
  limit?: number;
};

export const adminReportAnalyticsQueryKeys = {
  root: ["admin-report-analytics"] as const,
  popularDrugs: (
    userId: string,
    params: AdminReportAnalyticsLeaderboardQueryParams,
  ) =>
    [
      ...adminReportAnalyticsQueryKeys.root,
      "popular-drugs",
      userId,
      params,
    ] as const,
  topUsers: (
    userId: string,
    params: AdminReportAnalyticsLeaderboardQueryParams,
  ) =>
    [...adminReportAnalyticsQueryKeys.root, "top-users", userId, params] as const,
  topCompanies: (
    userId: string,
    params: AdminReportAnalyticsLeaderboardQueryParams,
  ) =>
    [
      ...adminReportAnalyticsQueryKeys.root,
      "top-companies",
      userId,
      params,
    ] as const,
  totals: (userId: string) =>
    [...adminReportAnalyticsQueryKeys.root, "totals", userId] as const,
};
