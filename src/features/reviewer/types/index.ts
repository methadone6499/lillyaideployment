import type { DashboardNotification } from "@/features/dashboard";

export type ReviewerNotification = DashboardNotification;

export const REVIEWER_REPORT_STATUSES = [
  "completed",
  "in_review",
  "overdue",
  "in_queue",
] as const;

export type ReviewerReportStatus = (typeof REVIEWER_REPORT_STATUSES)[number];

export type ReviewerStatusFilterValue = ReviewerReportStatus | "all";

export type ReviewerStatusFilterOption = {
  value: ReviewerStatusFilterValue;
  label: string;
};

export const REVIEWER_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "completed", label: "Completed" },
  { value: "in_review", label: "In Review" },
  { value: "overdue", label: "Overdue" },
  { value: "in_queue", label: "In Queue" },
] as const satisfies readonly ReviewerStatusFilterOption[];

export const REVIEWER_KPI_IDS = [
  "total_assigned",
  "in_queue",
  "in_review",
  "overdue",
  "completed",
] as const;

export type ReviewerKpiId = (typeof REVIEWER_KPI_IDS)[number];

export type ReviewerKpiCard = {
  id: ReviewerKpiId;
  label: string;
  value: number;
};

export type ReviewerAssignedReport = {
  platformReportId: string;
  name: string;
  assignedDate: string;
  deadline: string;
  status: ReviewerReportStatus;
};

export type ReviewerDashboardSnapshot = {
  kpis: readonly ReviewerKpiCard[];
  notifications: readonly ReviewerNotification[];
  reports: readonly ReviewerAssignedReport[];
};

export type ReviewerReportContentBlock =
  | {
      type: "definition";
      label: string;
      value: string;
    }
  | {
      type: "heading";
      text: string;
    }
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "subsection";
      heading: string;
      body: string;
    };

export type ReviewerReportSection = {
  id: string;
  order: number;
  title: string;
  description: string;
  blocks: readonly ReviewerReportContentBlock[];
};

export type ReviewerReportDetail = {
  platformReportId: string;
  title: string;
  generatedOnLabel: string;
  status: ReviewerReportStatus;
  sections: readonly ReviewerReportSection[];
};

export type ReviewerSectionNote = {
  platformReportId: string;
  sectionId: string;
  draftText: string;
  savedText: string;
};

export type ReviewerSubmission = {
  platformReportId: string;
  submittedAt: string;
};

export type ReviewerDashboardScenario = "default" | "empty";

export type ReviewerDataSource = {
  getDashboard(): Promise<ReviewerDashboardSnapshot>;
  getReport(platformReportId: string): Promise<ReviewerReportDetail | null>;
};
