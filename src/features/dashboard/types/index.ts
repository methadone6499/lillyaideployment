import type { GenerationStatus } from "@/features/reports";

export type DashboardGenerationStatus = GenerationStatus;

export type DashboardStatusFilterValue = DashboardGenerationStatus | "all";

export type DashboardUser = {
  displayName: string;
};

export type DashboardQuota = {
  used: number;
  total: number;
  additionalReportPrice: string;
};

export type DashboardNotification = {
  id: string;
  message: string;
  reportName?: string;
  timestamp: string;
};
