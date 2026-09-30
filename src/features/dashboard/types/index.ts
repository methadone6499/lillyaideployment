import type { GenerationStatus, ReviewStatus } from "@/features/reports";

export type DashboardGenerationStatus = GenerationStatus;

export type DashboardReviewStatus = ReviewStatus;

export type DashboardStatusPillStatus =
  | DashboardGenerationStatus
  | DashboardReviewStatus;

export type DashboardStatusFilterValue = DashboardGenerationStatus | "all";

export type DashboardUser = {
  displayName: string;
};

export type DashboardQuota = {
  used: number | null;
  total: number | null;
  additionalReportPrice: string;
};

export type DashboardQuotaView =
  | { kind: "loading" }
  | { kind: "unlimited" }
  | { kind: "unavailable" }
  | { kind: "known"; used: number; total: number; remaining: number };

export type DashboardNotification = {
  id: string;
  message: string;
  reportName?: string;
  timestamp: string;
};
