import type { ReviewerDashboardFilters } from "../schemas/reviewerSchemas";

export function appendReviewerAssignmentStatuses(
  query: URLSearchParams,
  status: ReviewerDashboardFilters["status"],
): void {
  const statuses = typeof status === "string" ? [status] : status ?? [];
  for (const value of statuses) {
    query.append("status", value);
  }
}
