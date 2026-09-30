import type {
  GenerationStatus,
  ReviewStatus,
} from "@/features/reports";
import type { DashboardStatusPillStatus } from "../types";

export function getReportDisplayStatus(report: {
  generation_status: GenerationStatus;
  review_status: ReviewStatus;
}): DashboardStatusPillStatus {
  if (report.generation_status !== "completed") {
    return report.generation_status;
  }

  return report.review_status === "unassigned"
    ? "completed"
    : report.review_status;
}
