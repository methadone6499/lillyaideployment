export type DashboardReportStatus =
  | "completed"
  | "sent_for_review"
  | "in_progress"
  | "reviewed"
  | "failed";

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

export type DashboardReport = {
  id: string;
  name: string;
  dateTime: string;
  status: DashboardReportStatus;
};

export type DashboardPagination = {
  currentPage: number;
  totalPages: number;
};
