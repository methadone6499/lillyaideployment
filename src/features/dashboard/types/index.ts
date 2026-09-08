import type { GenerationStatus, ReviewStatus } from "@/features/reports";

export type DashboardGenerationStatus = GenerationStatus;

export type DashboardReviewStatus = ReviewStatus;

export type DashboardAdminDisplayStatus = "reviewed" | "sent_for_review";

export type DashboardStatusPillStatus =
  | DashboardGenerationStatus
  | DashboardReviewStatus
  | DashboardAdminDisplayStatus;

export type DashboardStatusFilterValue = DashboardGenerationStatus | "all";

export type DashboardUser = {
  displayName: string;
};

export type DashboardQuota = {
  used: number | null;
  total: number | null;
  additionalReportPrice: string;
};

export type DashboardNotification = {
  id: string;
  message: string;
  reportName?: string;
  timestamp: string;
};
