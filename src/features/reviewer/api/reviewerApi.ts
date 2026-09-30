import { authenticatedAuthRequest } from "@/features/auth";
import { apiRequest } from "@/services/apiRequest";
import type { z } from "zod";

import {
  adminReviewDashboardSchema,
  adminCommentListSchema,
  adminCommentSchema,
  createAdminCommentSchema,
  createReviewerInvitationRequestSchema,
  reassignReviewRequestSchema,
  reportReviewStateSchema,
  reviewHistorySchema,
  reviewAssignmentListSchema,
  reviewAssignmentSchema,
  reviewerAssignmentSettingsSchema,
  reviewerDashboardSchema,
  reviewerInvitationListSchema,
  reviewerInvitationPreviewSchema,
  reviewerInvitationSchema,
  reviewerInvitationTokenRequestSchema,
  reviewerListSchema,
  reviewerRegistrationRequestSchema,
  reviewerRegistrationResponseSchema,
  reviewerSchema,
  reviewSectionNoteListSchema,
  reviewSectionNoteSchema,
  saveReviewSectionNoteRequestSchema,
  updateReviewerAssignmentSettingsRequestSchema,
  type AdminReviewDashboard,
  type AdminReviewDashboardFilters,
  type AdminComment,
  type ReviewHistory,
  type ReassignReviewRequest,
  type ReportReviewState,
  type ReviewAssignment,
  type ReviewAssignmentList,
  type ReviewAssignmentStatus,
  type Reviewer,
  type ReviewerAssignmentSettings,
  type ReviewerDashboard,
  type ReviewerDashboardFilters,
  type ReviewerFilters,
  type ReviewerInvitation,
  type ReviewerInvitationFilters,
  type ReviewerInvitationList,
  type ReviewerInvitationPreview,
  type ReviewerList,
  type ReviewerRegistrationRequest,
  type ReviewerRegistrationResponse,
  type ReviewSectionNote,
  type ReviewSectionNoteList,
  type SaveReviewSectionNoteRequest,
  type UpdateReviewerAssignmentSettingsRequest,
} from "../schemas/reviewerSchemas";

const REVIEWER_PREFIX = "/api/v1/reviewer";
const PUBLIC_INVITATIONS_PREFIX = "/api/v1/reviewer-invitations";
const ADMIN_PREFIX = "/api/v1/admin";
const REPORTS_PREFIX = "/api/v1/reports";
const DEFAULT_LIMIT = 20;
const DEFAULT_DASHBOARD_LIMIT = 6;
const MAX_LIMIT = 50;
const MAX_CURSOR_LENGTH = 1024;
const MAX_SEARCH_LENGTH = 200;

export type AdminReviewAssignmentFilters = {
  reviewerId?: string;
  status?: ReviewAssignmentStatus;
  overdue?: boolean;
  limit?: number;
  cursor?: string | null;
};

function bearerHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

function boundedLimit(limit: number | undefined): number {
  return Math.min(MAX_LIMIT, Math.max(1, limit ?? DEFAULT_LIMIT));
}

function setCursor(query: URLSearchParams, cursor?: string | null): void {
  if (cursor) {
    query.set("cursor", cursor.slice(0, MAX_CURSOR_LENGTH));
  }
}

function authenticatedRequest<TSchema extends z.ZodType>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    schema: TSchema;
  },
  signal?: AbortSignal,
): Promise<z.infer<TSchema>> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(path, {
        method: options.method,
        headers: bearerHeaders(accessToken),
        body: options.body,
        schema: options.schema,
        signal: requestSignal,
      }),
    signal,
  );
}

function buildReviewerDashboardUrl(params: ReviewerDashboardFilters): string {
  const query = new URLSearchParams();
  query.set("limit", String(boundedLimit(params.limit ?? DEFAULT_DASHBOARD_LIMIT)));
  setCursor(query, params.cursor);

  if (params.status) query.set("status", params.status);
  if (params.overdue !== undefined) query.set("overdue", String(params.overdue));
  if (params.search?.trim()) {
    query.set("search", params.search.trim().slice(0, MAX_SEARCH_LENGTH));
  }

  return `${REVIEWER_PREFIX}/dashboard?${query.toString()}`;
}

export function getReviewerDashboard(
  params: ReviewerDashboardFilters = {},
  signal?: AbortSignal,
): Promise<ReviewerDashboard> {
  return authenticatedRequest(
    buildReviewerDashboardUrl(params),
    { schema: reviewerDashboardSchema },
    signal,
  );
}

export function getReviewerAssignment(
  assignmentId: string,
  signal?: AbortSignal,
): Promise<ReviewAssignment> {
  return authenticatedRequest(
    `${REVIEWER_PREFIX}/assignments/${encodeURIComponent(assignmentId)}`,
    { schema: reviewAssignmentSchema },
    signal,
  );
}

export function startReviewerAssignment(
  assignmentId: string,
  signal?: AbortSignal,
): Promise<ReviewAssignment> {
  return authenticatedRequest(
    `${REVIEWER_PREFIX}/assignments/${encodeURIComponent(assignmentId)}/start`,
    { method: "POST", schema: reviewAssignmentSchema },
    signal,
  );
}

export function completeReviewerAssignment(
  assignmentId: string,
  signal?: AbortSignal,
): Promise<ReviewAssignment> {
  return authenticatedRequest(
    `${REVIEWER_PREFIX}/assignments/${encodeURIComponent(assignmentId)}/complete`,
    { method: "POST", schema: reviewAssignmentSchema },
    signal,
  );
}

export function listReviewerAssignments(
  params: Pick<ReviewerDashboardFilters, "status" | "overdue" | "limit" | "cursor"> = {},
  signal?: AbortSignal,
): Promise<ReviewAssignmentList> {
  const query = new URLSearchParams();
  query.set("limit", String(boundedLimit(params.limit)));
  setCursor(query, params.cursor);
  if (params.status) query.set("status", params.status);
  if (params.overdue !== undefined) query.set("overdue", String(params.overdue));
  return authenticatedRequest(
    `${REVIEWER_PREFIX}/assignments?${query.toString()}`,
    { schema: reviewAssignmentListSchema },
    signal,
  );
}

export function listReviewerAssignmentNotes(
  assignmentId: string,
  signal?: AbortSignal,
): Promise<ReviewSectionNoteList> {
  return authenticatedRequest(
    `${REVIEWER_PREFIX}/assignments/${encodeURIComponent(assignmentId)}/section-notes`,
    { schema: reviewSectionNoteListSchema },
    signal,
  );
}

export function saveReviewerAssignmentNote(
  assignmentId: string,
  input: SaveReviewSectionNoteRequest,
  signal?: AbortSignal,
): Promise<ReviewSectionNote> {
  const body = saveReviewSectionNoteRequestSchema.parse(input);
  return authenticatedRequest(
    `${REVIEWER_PREFIX}/assignments/${encodeURIComponent(assignmentId)}/section-notes`,
    { method: "PUT", body, schema: reviewSectionNoteSchema },
    signal,
  );
}

export function previewReviewerInvitation(
  token: string,
  signal?: AbortSignal,
): Promise<ReviewerInvitationPreview> {
  const body = reviewerInvitationTokenRequestSchema.parse({ token });
  return apiRequest(`${PUBLIC_INVITATIONS_PREFIX}/preview`, {
    method: "POST",
    body,
    schema: reviewerInvitationPreviewSchema,
    signal,
  });
}

export function registerReviewerInvitation(
  input: ReviewerRegistrationRequest,
  signal?: AbortSignal,
): Promise<ReviewerRegistrationResponse> {
  const body = reviewerRegistrationRequestSchema.parse(input);
  return apiRequest(`${PUBLIC_INVITATIONS_PREFIX}/register`, {
    method: "POST",
    body,
    schema: reviewerRegistrationResponseSchema,
    signal,
  });
}

function buildInvitationListUrl(params: ReviewerInvitationFilters): string {
  const query = new URLSearchParams();
  query.set("limit", String(boundedLimit(params.limit)));
  setCursor(query, params.cursor);
  if (params.status) query.set("status", params.status);
  return `${ADMIN_PREFIX}/reviewer-invitations?${query.toString()}`;
}

export function listReviewerInvitations(
  params: ReviewerInvitationFilters = {},
  signal?: AbortSignal,
): Promise<ReviewerInvitationList> {
  return authenticatedRequest(
    buildInvitationListUrl(params),
    { schema: reviewerInvitationListSchema },
    signal,
  );
}

export function createReviewerInvitation(
  email: string,
  signal?: AbortSignal,
): Promise<ReviewerInvitation> {
  const body = createReviewerInvitationRequestSchema.parse({ email });
  return authenticatedRequest(
    `${ADMIN_PREFIX}/reviewer-invitations`,
    { method: "POST", body, schema: reviewerInvitationSchema },
    signal,
  );
}

export function resendReviewerInvitation(
  invitationId: string,
  signal?: AbortSignal,
): Promise<ReviewerInvitation> {
  return authenticatedRequest(
    `${ADMIN_PREFIX}/reviewer-invitations/${encodeURIComponent(invitationId)}/resend`,
    { method: "POST", schema: reviewerInvitationSchema },
    signal,
  );
}

export function revokeReviewerInvitation(
  invitationId: string,
  signal?: AbortSignal,
): Promise<ReviewerInvitation> {
  return authenticatedRequest(
    `${ADMIN_PREFIX}/reviewer-invitations/${encodeURIComponent(invitationId)}/revoke`,
    { method: "POST", schema: reviewerInvitationSchema },
    signal,
  );
}

function buildReviewerListUrl(params: ReviewerFilters): string {
  const query = new URLSearchParams();
  query.set("limit", String(boundedLimit(params.limit)));
  setCursor(query, params.cursor);
  if (params.status) query.set("status", params.status);
  return `${ADMIN_PREFIX}/reviewers?${query.toString()}`;
}

export function listReviewers(
  params: ReviewerFilters = {},
  signal?: AbortSignal,
): Promise<ReviewerList> {
  return authenticatedRequest(
    buildReviewerListUrl(params),
    { schema: reviewerListSchema },
    signal,
  );
}

export function suspendReviewer(
  reviewerId: string,
  signal?: AbortSignal,
): Promise<Reviewer> {
  return authenticatedRequest(
    `${ADMIN_PREFIX}/reviewers/${encodeURIComponent(reviewerId)}/suspend`,
    { method: "POST", schema: reviewerSchema },
    signal,
  );
}

export function activateReviewer(
  reviewerId: string,
  signal?: AbortSignal,
): Promise<Reviewer> {
  return authenticatedRequest(
    `${ADMIN_PREFIX}/reviewers/${encodeURIComponent(reviewerId)}/activate`,
    { method: "POST", schema: reviewerSchema },
    signal,
  );
}

export function getReviewerAssignmentSettings(
  signal?: AbortSignal,
): Promise<ReviewerAssignmentSettings> {
  return authenticatedRequest(
    `${ADMIN_PREFIX}/reviewer-assignment-settings`,
    { schema: reviewerAssignmentSettingsSchema },
    signal,
  );
}

export function updateReviewerAssignmentSettings(
  input: UpdateReviewerAssignmentSettingsRequest,
  signal?: AbortSignal,
): Promise<ReviewerAssignmentSettings> {
  const body = updateReviewerAssignmentSettingsRequestSchema.parse(input);
  return authenticatedRequest(
    `${ADMIN_PREFIX}/reviewer-assignment-settings`,
    { method: "PUT", body, schema: reviewerAssignmentSettingsSchema },
    signal,
  );
}

function buildAdminReviewDashboardUrl(
  params: AdminReviewDashboardFilters,
): string {
  const query = new URLSearchParams();
  query.set("limit", String(boundedLimit(params.limit ?? DEFAULT_DASHBOARD_LIMIT)));
  setCursor(query, params.cursor);
  if (params.search?.trim()) {
    query.set("search", params.search.trim().slice(0, MAX_SEARCH_LENGTH));
  }
  if (params.reviewStatus) query.set("review_status", params.reviewStatus);
  if (params.overdue !== undefined) query.set("overdue", String(params.overdue));
  if (params.reviewerId) query.set("reviewer_id", params.reviewerId);
  if (params.includeStats !== undefined) {
    query.set("include_stats", String(params.includeStats));
  }
  return `${ADMIN_PREFIX}/review-dashboard?${query.toString()}`;
}

export function getAdminReviewDashboard(
  params: AdminReviewDashboardFilters = {},
  signal?: AbortSignal,
): Promise<AdminReviewDashboard> {
  return authenticatedRequest(
    buildAdminReviewDashboardUrl(params),
    { schema: adminReviewDashboardSchema },
    signal,
  );
}

function buildAdminAssignmentListUrl(
  params: AdminReviewAssignmentFilters,
): string {
  const query = new URLSearchParams();
  query.set("limit", String(boundedLimit(params.limit)));
  setCursor(query, params.cursor);
  if (params.reviewerId) query.set("reviewer_id", params.reviewerId);
  if (params.status) query.set("status", params.status);
  if (params.overdue !== undefined) query.set("overdue", String(params.overdue));
  return `${ADMIN_PREFIX}/review-assignments?${query.toString()}`;
}

export function listAdminReviewAssignments(
  params: AdminReviewAssignmentFilters = {},
  signal?: AbortSignal,
): Promise<ReviewAssignmentList> {
  return authenticatedRequest(
    buildAdminAssignmentListUrl(params),
    { schema: reviewAssignmentListSchema },
    signal,
  );
}

export function retryWaitingReviewReport(
  reportId: string,
  signal?: AbortSignal,
): Promise<ReportReviewState> {
  return authenticatedRequest(
    `${ADMIN_PREFIX}/review-assignments/queue/${encodeURIComponent(reportId)}/retry`,
    { method: "POST", schema: reportReviewStateSchema },
    signal,
  );
}

export function reassignReviewAssignment(
  assignmentId: string,
  input: ReassignReviewRequest = {},
  signal?: AbortSignal,
): Promise<ReviewAssignment> {
  const body = reassignReviewRequestSchema.parse(input);
  return authenticatedRequest(
    `${ADMIN_PREFIX}/review-assignments/${encodeURIComponent(assignmentId)}/reassign`,
    { method: "POST", body, schema: reviewAssignmentSchema },
    signal,
  );
}

export function listAdminReviewAssignmentNotes(
  assignmentId: string,
  signal?: AbortSignal,
): Promise<ReviewSectionNoteList> {
  return authenticatedRequest(
    `${ADMIN_PREFIX}/review-assignments/${encodeURIComponent(assignmentId)}/section-notes`,
    { schema: reviewSectionNoteListSchema },
    signal,
  );
}

export function submitReportForReview(
  reportId: string,
  signal?: AbortSignal,
): Promise<ReportReviewState> {
  return authenticatedRequest(
    `${REPORTS_PREFIX}/${encodeURIComponent(reportId)}/submit-for-review`,
    { method: "POST", schema: reportReviewStateSchema },
    signal,
  );
}

export function listCompletedReportReviewNotes(
  reportId: string,
  signal?: AbortSignal,
): Promise<ReviewSectionNoteList> {
  return authenticatedRequest(
    `${REPORTS_PREFIX}/${encodeURIComponent(reportId)}/review-notes`,
    { schema: reviewSectionNoteListSchema },
    signal,
  );
}

export function getReportReviewHistory(
  reportId: string,
  admin = false,
  signal?: AbortSignal,
): Promise<ReviewHistory> {
  const path = admin
    ? `${ADMIN_PREFIX}/reports/${encodeURIComponent(reportId)}/review-history`
    : `${REPORTS_PREFIX}/${encodeURIComponent(reportId)}/review-history`;
  return authenticatedRequest(
    path,
    { schema: reviewHistorySchema },
    signal,
  );
}

export function listAdminReportComments(
  reportId: string,
  signal?: AbortSignal,
) {
  return authenticatedRequest(
    `${ADMIN_PREFIX}/reports/${encodeURIComponent(reportId)}/comments`,
    { schema: adminCommentListSchema },
    signal,
  );
}

export function createAdminReportComment(
  reportId: string,
  content: string,
  signal?: AbortSignal,
): Promise<AdminComment> {
  const body = createAdminCommentSchema.parse({ content });
  return authenticatedRequest(
    `${ADMIN_PREFIX}/reports/${encodeURIComponent(reportId)}/comments`,
    { method: "POST", body, schema: adminCommentSchema },
    signal,
  );
}
