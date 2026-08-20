import type {
  GenerationStatus,
  ReviewStatus,
} from "../schemas/platformReportSchemas";

export type PlatformReportListQueryParams = {
  limit?: number;
  search?: string;
  generationStatus?: GenerationStatus;
};

export type CompanyReportListQueryParams = {
  limit?: number;
  search?: string;
  generationStatus?: GenerationStatus;
  reviewStatus?: ReviewStatus;
  creatorUserId?: string;
};

export const platformReportQueryKeys = {
  root: ["platform-reports"] as const,
  lists: () => [...platformReportQueryKeys.root, "list"] as const,
  list: (params: PlatformReportListQueryParams) =>
    [...platformReportQueryKeys.lists(), params] as const,
  details: () => [...platformReportQueryKeys.root, "detail"] as const,
  detail: (platformReportId: string) =>
    [...platformReportQueryKeys.details(), platformReportId] as const,
  companyLists: (userId: string) =>
    [...platformReportQueryKeys.root, "company-list", userId] as const,
  companyList: (userId: string, params: CompanyReportListQueryParams) =>
    [...platformReportQueryKeys.companyLists(userId), params] as const,
  companyDetails: (userId: string) =>
    [...platformReportQueryKeys.root, "company-detail", userId] as const,
  companyDetail: (userId: string, platformReportId: string) =>
    [...platformReportQueryKeys.companyDetails(userId), platformReportId] as const,
  resolvedDetail: (
    userId: string,
    platformReportId: string,
    companyFallback: boolean,
  ) =>
    [
      ...platformReportQueryKeys.root,
      "resolved-detail",
      userId,
      platformReportId,
      { companyFallback },
    ] as const,
};
