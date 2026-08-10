import type { GenerationStatus } from "../schemas/platformReportSchemas";

export type PlatformReportListQueryParams = {
  limit?: number;
  search?: string;
  generationStatus?: GenerationStatus;
};

export const platformReportQueryKeys = {
  root: ["platform-reports"] as const,
  lists: () => [...platformReportQueryKeys.root, "list"] as const,
  list: (params: PlatformReportListQueryParams) =>
    [...platformReportQueryKeys.lists(), params] as const,
  details: () => [...platformReportQueryKeys.root, "detail"] as const,
  detail: (platformReportId: string) =>
    [...platformReportQueryKeys.details(), platformReportId] as const,
};
