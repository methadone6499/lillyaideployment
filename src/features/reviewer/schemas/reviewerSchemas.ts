import { z } from "zod";

export const reviewerInvitationStatusSchema = z.enum([
  "pending",
  "accepted",
  "revoked",
  "expired",
]);

export const reviewerStatusSchema = z.enum([
  "invited",
  "active",
  "suspended",
]);

export const reportReviewStatusSchema = z.enum([
  "unassigned",
  "awaiting_assignment",
  "pending",
  "in_review",
  "reviewed",
]);

export const reviewAssignmentStatusSchema = z.enum([
  "pending",
  "in_review",
  "completed",
  "superseded",
]);

export const reviewAssignmentSourceSchema = z.enum(["automatic", "manual"]);

const isoDateTimeSchema = z.string().datetime({ offset: true });
const nullableIsoDateTimeSchema = isoDateTimeSchema.nullable();
const nonEmptyStringSchema = z.string().trim().min(1);

export const reviewAssignmentReportSummarySchema = z.object({
  id: nonEmptyStringSchema,
  title: nonEmptyStringSchema,
  drug_name: nonEmptyStringSchema,
});

export const reviewAssignmentSchema = z.object({
  id: nonEmptyStringSchema,
  report_id: nonEmptyStringSchema,
  report_service_id: nonEmptyStringSchema,
  review_cycle_id: z.string().nullable(),
  review_cycle: z.number().int().nonnegative(),
  report: reviewAssignmentReportSummarySchema,
  reviewer_id: nonEmptyStringSchema,
  reviewer_user_id: nonEmptyStringSchema,
  status: reviewAssignmentStatusSchema,
  active: z.boolean(),
  current_for_report: z.boolean(),
  can_edit_report: z.boolean(),
  source: reviewAssignmentSourceSchema,
  assigned_by_user_id: z.string().nullable(),
  reassigned_from_assignment_id: z.string().nullable(),
  superseded_by_assignment_id: z.string().nullable(),
  assigned_at: isoDateTimeSchema,
  due_at: isoDateTimeSchema,
  started_at: nullableIsoDateTimeSchema,
  completed_at: nullableIsoDateTimeSchema,
  superseded_at: nullableIsoDateTimeSchema,
  is_overdue: z.boolean(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const reviewerDashboardStatsSchema = z.object({
  incoming_reports: z.number().int().nonnegative(),
  assigned_reports: z.number().int().nonnegative(),
  in_review: z.number().int().nonnegative(),
  completed_reports: z.number().int().nonnegative(),
  overdue_reports: z.number().int().nonnegative(),
});

export const reviewerDashboardItemSchema = reviewAssignmentSchema;

export const reviewerDashboardSchema = z.object({
  reviewer: z.object({
    user_id: nonEmptyStringSchema,
    full_name: nonEmptyStringSchema,
  }),
  stats: reviewerDashboardStatsSchema,
  items: z.array(reviewerDashboardItemSchema),
  next_cursor: z.string().nullable(),
});

export const reviewAssignmentListSchema = z.object({
  items: z.array(reviewAssignmentSchema),
  next_cursor: z.string().nullable(),
});

export const reportReviewStateSchema = z.object({
  report_id: nonEmptyStringSchema,
  assignment_id: z.string().nullable(),
  review_cycle_id: nonEmptyStringSchema,
  review_cycle: z.number().int().min(1),
  status: reportReviewStatusSchema.exclude(["unassigned"]),
  submitted_at: isoDateTimeSchema,
  locked_at: isoDateTimeSchema,
  assigned_at: nullableIsoDateTimeSchema,
  due_at: nullableIsoDateTimeSchema,
  is_editable: z.literal(false),
  is_overdue: z.boolean(),
});

export const reviewSectionNoteSchema = z.object({
  id: nonEmptyStringSchema,
  report_id: nonEmptyStringSchema,
  assignment_id: nonEmptyStringSchema,
  review_cycle_id: nonEmptyStringSchema,
  review_cycle: z.number().int().min(1),
  reviewer_id: nonEmptyStringSchema,
  reviewer_user_id: nonEmptyStringSchema,
  section_key: nonEmptyStringSchema,
  section_id: z.string().nullable(),
  section_heading: nonEmptyStringSchema,
  section_occurrence: z.number().int().min(1),
  content: nonEmptyStringSchema.max(10_000),
  version: z.number().int().min(1),
  is_current_assignment: z.boolean(),
  is_editable: z.boolean(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const reviewSectionNoteListSchema = z.object({
  items: z.array(reviewSectionNoteSchema),
});

export const saveReviewSectionNoteRequestSchema = z
  .object({
    section_id: nonEmptyStringSchema.nullable().optional(),
    section_heading: nonEmptyStringSchema,
    section_occurrence: z.number().int().min(1).optional(),
    content: nonEmptyStringSchema.max(10_000),
    version: z.number().int().min(1).nullable().optional(),
  })
  .strict();

const reviewHistoryNoteSchema = reviewSectionNoteSchema.pick({
  id: true,
  assignment_id: true,
  reviewer_id: true,
  reviewer_user_id: true,
  section_id: true,
  section_heading: true,
  section_occurrence: true,
  content: true,
  version: true,
  created_at: true,
  updated_at: true,
});

const reviewHistoryAssignmentSchema = reviewAssignmentSchema.pick({
  id: true,
  reviewer_id: true,
  reviewer_user_id: true,
  status: true,
  active: true,
  current_for_report: true,
  source: true,
  assigned_by_user_id: true,
  assigned_at: true,
  due_at: true,
  started_at: true,
  completed_at: true,
  superseded_at: true,
  reassigned_from_assignment_id: true,
  superseded_by_assignment_id: true,
}).extend({ notes: z.array(reviewHistoryNoteSchema) });

export const reviewHistorySchema = z.object({
  report_id: nonEmptyStringSchema,
  report_service_id: nonEmptyStringSchema,
  current_cycle: z.number().int().nonnegative(),
  items: z.array(z.object({
    id: nonEmptyStringSchema,
    cycle_number: z.number().int().min(1),
    status: reportReviewStatusSchema.exclude(["unassigned"]),
    current_assignment_id: z.string().nullable(),
    completed_assignment_id: z.string().nullable(),
    submitted_at: isoDateTimeSchema,
    completed_at: nullableIsoDateTimeSchema,
    assignments: z.array(reviewHistoryAssignmentSchema),
  })),
});

export const adminCommentSchema = z.object({
  id: nonEmptyStringSchema,
  report_id: nonEmptyStringSchema,
  report_service_id: nonEmptyStringSchema,
  admin_user_id: nonEmptyStringSchema,
  content: nonEmptyStringSchema,
  created_at: isoDateTimeSchema,
});
export const adminCommentListSchema = z.object({ items: z.array(adminCommentSchema) });
export const createAdminCommentSchema = z.object({ content: nonEmptyStringSchema }).strict();

export const reviewerInvitationSchema = z.object({
  id: nonEmptyStringSchema,
  reviewer_id: nonEmptyStringSchema,
  email: z.string().email(),
  status: reviewerInvitationStatusSchema,
  invited_by_user_id: nonEmptyStringSchema,
  expires_at: isoDateTimeSchema,
  last_sent_at: isoDateTimeSchema,
  accepted_by_user_id: z.string().nullable(),
  accepted_at: nullableIsoDateTimeSchema,
  revoked_by_user_id: z.string().nullable(),
  revoked_at: nullableIsoDateTimeSchema,
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const reviewerInvitationListSchema = z.object({
  items: z.array(reviewerInvitationSchema),
  next_cursor: z.string().nullable(),
});

export const reviewerInvitationPreviewSchema = z.object({
  email_masked: nonEmptyStringSchema,
  expires_at: isoDateTimeSchema,
});

export const reviewerRegistrationResponseSchema = z.object({
  invitation_id: nonEmptyStringSchema,
  reviewer_id: nonEmptyStringSchema,
  user_id: nonEmptyStringSchema,
  message: nonEmptyStringSchema,
});

export const reviewerInvitationTokenRequestSchema = z
  .object({ token: z.string().trim().min(1).max(512) })
  .strict();

export const reviewerRegistrationRequestSchema = z
  .object({
    token: z.string().trim().min(1).max(512),
    full_name: z.string().trim().min(1).max(200),
    password: z.string().min(12).max(128),
  })
  .strict();

export const createReviewerInvitationRequestSchema = z
  .object({ email: z.string().trim().email() })
  .strict();

export const reviewerSchema = z.object({
  id: nonEmptyStringSchema,
  email: z.string().email(),
  user_id: z.string().nullable(),
  status: reviewerStatusSchema,
  invited_by_user_id: nonEmptyStringSchema,
  activated_at: nullableIsoDateTimeSchema,
  suspended_at: nullableIsoDateTimeSchema,
  suspended_by_user_id: z.string().nullable(),
  active_assignment_count: z.number().int().nonnegative(),
  oldest_open_due_at: nullableIsoDateTimeSchema,
  last_assigned_at: nullableIsoDateTimeSchema,
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const reviewerListSchema = z.object({
  items: z.array(reviewerSchema),
  next_cursor: z.string().nullable(),
});

export const reviewerAssignmentSettingsSchema = z.object({
  overdue_after_days: z.number().int().min(1).max(365),
  max_active_assignments_per_reviewer: z.number().int().min(1).max(100),
  version: z.number().int().nonnegative(),
  updated_by_user_id: z.string().nullable(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const updateReviewerAssignmentSettingsRequestSchema = z
  .object({
    overdue_after_days: z.number().int().min(1).max(365),
    max_active_assignments_per_reviewer: z.number().int().min(1).max(100),
    version: z.number().int().nonnegative(),
  })
  .strict();

export const reassignReviewRequestSchema = z
  .object({ reviewer_id: nonEmptyStringSchema.nullable().optional() })
  .strict();

export const adminReviewDashboardStatsSchema = z.object({
  awaiting_assignment: z.number().int().nonnegative(),
  assigned_reports: z.number().int().nonnegative(),
  in_review: z.number().int().nonnegative(),
  completed_reports: z.number().int().nonnegative(),
  overdue_reports: z.number().int().nonnegative(),
  active_reviewers: z.number().int().nonnegative(),
});

export const adminReviewDashboardItemSchema = z.object({
  report: reviewAssignmentReportSummarySchema,
  review_status: reportReviewStatusSchema.exclude(["unassigned"]),
  submitted_at: isoDateTimeSchema,
  assignment: z
    .object({
      id: nonEmptyStringSchema,
      assigned_at: isoDateTimeSchema,
      due_at: isoDateTimeSchema,
      is_overdue: z.boolean(),
    })
    .nullable(),
  reviewer: z
    .object({
      id: nonEmptyStringSchema,
      user_id: z.string().nullable(),
      full_name: z.string().nullable(),
      email: z.string().email(),
      status: reviewerStatusSchema,
    })
    .nullable(),
});

export const adminReviewDashboardSchema = z.object({
  stats: adminReviewDashboardStatsSchema.nullable(),
  stats_as_of: nullableIsoDateTimeSchema,
  items: z.array(adminReviewDashboardItemSchema),
  next_cursor: z.string().nullable(),
});

export type ReviewerInvitationStatus = z.infer<
  typeof reviewerInvitationStatusSchema
>;
export type ReviewerStatus = z.infer<typeof reviewerStatusSchema>;
export type ReportReviewStatus = z.infer<typeof reportReviewStatusSchema>;
export type ReviewAssignmentStatus = z.infer<
  typeof reviewAssignmentStatusSchema
>;
export type ReviewAssignmentSource = z.infer<
  typeof reviewAssignmentSourceSchema
>;
export type ReviewAssignmentReportSummary = z.infer<
  typeof reviewAssignmentReportSummarySchema
>;
export type ReviewAssignment = z.infer<typeof reviewAssignmentSchema>;
export type ReviewerDashboardStats = z.infer<
  typeof reviewerDashboardStatsSchema
>;
export type ReviewerDashboardItem = z.infer<
  typeof reviewerDashboardItemSchema
>;
export type ReviewerDashboard = z.infer<typeof reviewerDashboardSchema>;
export type ReviewAssignmentList = z.infer<typeof reviewAssignmentListSchema>;
export type ReportReviewState = z.infer<typeof reportReviewStateSchema>;
export type ReviewSectionNote = z.infer<typeof reviewSectionNoteSchema>;
export type ReviewSectionNoteList = z.infer<
  typeof reviewSectionNoteListSchema
>;
export type SaveReviewSectionNoteRequest = z.infer<
  typeof saveReviewSectionNoteRequestSchema
>;
export type ReviewHistory = z.infer<typeof reviewHistorySchema>;
export type AdminComment = z.infer<typeof adminCommentSchema>;
export type ReviewerInvitation = z.infer<typeof reviewerInvitationSchema>;
export type ReviewerInvitationList = z.infer<
  typeof reviewerInvitationListSchema
>;
export type ReviewerInvitationPreview = z.infer<
  typeof reviewerInvitationPreviewSchema
>;
export type ReviewerRegistrationResponse = z.infer<
  typeof reviewerRegistrationResponseSchema
>;
export type ReviewerRegistrationRequest = z.infer<
  typeof reviewerRegistrationRequestSchema
>;
export type Reviewer = z.infer<typeof reviewerSchema>;
export type ReviewerList = z.infer<typeof reviewerListSchema>;
export type ReviewerAssignmentSettings = z.infer<
  typeof reviewerAssignmentSettingsSchema
>;
export type UpdateReviewerAssignmentSettingsRequest = z.infer<
  typeof updateReviewerAssignmentSettingsRequestSchema
>;
export type ReassignReviewRequest = z.infer<
  typeof reassignReviewRequestSchema
>;
export type AdminReviewDashboardStats = z.infer<
  typeof adminReviewDashboardStatsSchema
>;
export type AdminReviewDashboardItem = z.infer<
  typeof adminReviewDashboardItemSchema
>;
export type AdminReviewDashboard = z.infer<
  typeof adminReviewDashboardSchema
>;

export type ReviewerDashboardFilters = {
  status?: ReviewAssignmentStatus;
  overdue?: boolean;
  search?: string;
  limit?: number;
  cursor?: string | null;
};

export type ReviewerInvitationFilters = {
  status?: ReviewerInvitationStatus;
  limit?: number;
  cursor?: string | null;
};

export type ReviewerFilters = {
  status?: ReviewerStatus;
  limit?: number;
  cursor?: string | null;
};

export type AdminReviewDashboardFilters = {
  search?: string;
  reviewStatus?: Exclude<ReportReviewStatus, "unassigned">;
  overdue?: boolean;
  reviewerId?: string;
  includeStats?: boolean;
  limit?: number;
  cursor?: string | null;
};
