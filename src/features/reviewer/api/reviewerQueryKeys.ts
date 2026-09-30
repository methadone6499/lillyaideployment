import type {
  AdminReviewDashboardFilters,
  ReviewerDashboardFilters,
  ReviewerFilters,
  ReviewerInvitationFilters,
} from "../schemas/reviewerSchemas";
import type { AdminReviewAssignmentFilters } from "./reviewerApi";

export const reviewerQueryKeys = {
  root: ["reviewer"] as const,
  dashboard: (userId: string, filters: Omit<ReviewerDashboardFilters, "cursor">) =>
    [...reviewerQueryKeys.root, "dashboard", userId, filters] as const,
  assignmentHistory: (userId: string, filters: object) =>
    [...reviewerQueryKeys.root, "assignment-history", userId, filters] as const,
  assignment: (userId: string, assignmentId: string) =>
    [...reviewerQueryKeys.root, "assignment", userId, assignmentId] as const,
  assignmentNotes: (userId: string, assignmentId: string) =>
    [
      ...reviewerQueryKeys.assignment(userId, assignmentId),
      "section-notes",
    ] as const,
  invitationPreview: () =>
    [...reviewerQueryKeys.root, "invitation-preview"] as const,
  adminInvitations: (
    userId: string,
    filters: Omit<ReviewerInvitationFilters, "cursor">,
  ) => [...reviewerQueryKeys.root, "admin-invitations", userId, filters] as const,
  adminReviewers: (
    userId: string,
    filters: Omit<ReviewerFilters, "cursor">,
  ) => [...reviewerQueryKeys.root, "admin-reviewers", userId, filters] as const,
  adminSettings: (userId: string) =>
    [...reviewerQueryKeys.root, "admin-settings", userId] as const,
  adminDashboard: (
    userId: string,
    filters: Omit<AdminReviewDashboardFilters, "cursor">,
  ) => [...reviewerQueryKeys.root, "admin-dashboard", userId, filters] as const,
  adminAssignments: (
    userId: string,
    filters: Omit<AdminReviewAssignmentFilters, "cursor">,
  ) => [...reviewerQueryKeys.root, "admin-assignments", userId, filters] as const,
  reportNotes: (userId: string, reportId: string) =>
    [...reviewerQueryKeys.root, "report-notes", userId, reportId] as const,
  reportHistory: (userId: string, reportId: string, admin: boolean) =>
    [...reviewerQueryKeys.root, "report-history", userId, reportId, admin] as const,
  adminComments: (userId: string, reportId: string) =>
    [...reviewerQueryKeys.root, "admin-comments", userId, reportId] as const,
  mutations: () => [...reviewerQueryKeys.root, "mutation"] as const,
};
