import assert from "node:assert/strict";

import {
  adminCommentListSchema,
  adminReviewDashboardSchema,
  getNotesForSection,
  reassignReviewRequestSchema,
  reportReviewStateSchema,
  reportReviewStatusSchema,
  reviewAssignmentSchema,
  reviewerDashboardSchema,
  reviewHistorySchema,
  reviewSectionNoteSchema,
  saveReviewSectionNoteRequestSchema,
} from "../index";

const assignment = {
  id: "review-assignment-2",
  report_id: "report-1",
  report_service_id: "report-service-1",
  review_cycle_id: "review-cycle-2",
  review_cycle: 2,
  report: {
    id: "report-1",
    title: "Nusinersen - Spinal Muscular Atrophy",
    drug_name: "Nusinersen",
  },
  reviewer_id: "reviewer-1",
  reviewer_user_id: "user-1",
  status: "in_review",
  active: true,
  current_for_report: true,
  can_edit_report: true,
  source: "automatic",
  assigned_by_user_id: null,
  reassigned_from_assignment_id: null,
  superseded_by_assignment_id: null,
  assigned_at: "2026-09-22T09:00:00Z",
  due_at: "2026-10-12T09:00:00Z",
  started_at: "2026-09-22T10:00:00Z",
  completed_at: null,
  superseded_at: null,
  is_overdue: false,
  created_at: "2026-09-22T09:00:00Z",
  updated_at: "2026-09-22T10:00:00Z",
};

const parsedAssignment = reviewAssignmentSchema.parse(assignment);
assert.equal(parsedAssignment.review_cycle, 2);
assert.equal(parsedAssignment.can_edit_report, true);

const dashboard = reviewerDashboardSchema.parse({
  reviewer: { user_id: "user-1", full_name: "Reviewer One" },
  stats: {
    incoming_reports: 1,
    assigned_reports: 0,
    in_review: 1,
    completed_reports: 3,
    overdue_reports: 0,
  },
  items: [assignment],
  next_cursor: "next-page",
});
assert.equal(dashboard.items[0]?.id, "review-assignment-2");
assert.equal(dashboard.next_cursor, "next-page");

const queuedReview = reportReviewStateSchema.parse({
  report_id: "report-2",
  assignment_id: null,
  review_cycle_id: "review-cycle-1",
  review_cycle: 1,
  status: "awaiting_assignment",
  submitted_at: "2026-09-22T11:00:00Z",
  locked_at: "2026-09-22T11:00:00Z",
  assigned_at: null,
  due_at: null,
  is_editable: false,
  is_overdue: false,
});
assert.equal(queuedReview.assignment_id, null);
assert.equal(queuedReview.status, "awaiting_assignment");

const sectionNote = reviewSectionNoteSchema.parse({
  id: "review-note-1",
  report_id: "report-1",
  assignment_id: "review-assignment-2",
  review_cycle_id: "review-cycle-2",
  review_cycle: 2,
  reviewer_id: "reviewer-1",
  reviewer_user_id: "user-1",
  section_key: "section-key-1",
  section_id: "stable-section-id",
  section_heading: "Disease Overview",
  section_occurrence: 1,
  content: "Please clarify the prevalence estimate.",
  version: 2,
  is_current_assignment: true,
  is_editable: true,
  created_at: "2026-09-22T10:15:00Z",
  updated_at: "2026-09-22T10:30:00Z",
});
assert.equal(sectionNote.section_id, "stable-section-id");
assert.equal(sectionNote.version, 2);

const matchingNotes = getNotesForSection(
  [
    {
      id: "stable-id-note",
      section_id: "stable-section-id",
      section_heading: "Renamed Disease Overview",
      section_occurrence: 1,
      content: "Matched by the Report API section ID.",
      review_cycle: 2,
    },
    {
      id: "heading-fallback-note",
      section_id: null,
      section_heading: "  Disease   Overview ",
      section_occurrence: 1,
      content: "Matched by normalized heading and occurrence.",
      review_cycle: 1,
    },
    {
      id: "different-stable-id-note",
      section_id: "different-section-id",
      section_heading: "Disease Overview",
      section_occurrence: 1,
      content: "A stable ID must not fall back to the heading.",
      review_cycle: 1,
    },
  ],
  {
    sectionId: "stable-section-id",
    title: "Disease Overview",
    headingOccurrence: 1,
  },
);
assert.deepEqual(
  matchingNotes.map((note) => note.id),
  ["stable-id-note", "heading-fallback-note"],
);

assert.equal(
  saveReviewSectionNoteRequestSchema.safeParse({
    section_id: "stable-section-id",
    section_heading: "Disease Overview",
    section_occurrence: 1,
    content: "Please clarify the prevalence estimate.",
    version: 2,
  }).success,
  true,
);
assert.equal(
  saveReviewSectionNoteRequestSchema.safeParse({
    section_id: null,
    section_heading: "Disease Overview",
    content: "Please clarify the prevalence estimate.",
    version: null,
  }).success,
  true,
);
assert.equal(
  saveReviewSectionNoteRequestSchema.safeParse({
    section_heading: "Disease Overview",
    content: "   ",
  }).success,
  false,
);

assert.equal(
  reassignReviewRequestSchema.safeParse({ reviewer_id: null }).success,
  true,
);
assert.equal(
  saveReviewSectionNoteRequestSchema.safeParse({
    section_heading: "Disease Overview",
    content: "Please clarify the prevalence estimate.",
    review_outcome: "approved",
  }).success,
  false,
);

const history = reviewHistorySchema.parse({
  report_id: "report-1",
  report_service_id: "report-service-1",
  current_cycle: 2,
  items: [
    {
      id: "review-cycle-2",
      cycle_number: 2,
      status: "in_review",
      current_assignment_id: "review-assignment-2",
      completed_assignment_id: null,
      submitted_at: "2026-09-22T08:30:00Z",
      completed_at: null,
      assignments: [
        {
          id: "review-assignment-old",
          reviewer_id: "reviewer-old",
          reviewer_user_id: "user-old",
          status: "superseded",
          active: false,
          current_for_report: false,
          source: "manual",
          assigned_by_user_id: "admin-1",
          assigned_at: "2026-09-22T08:35:00Z",
          due_at: "2026-10-12T08:35:00Z",
          started_at: null,
          completed_at: null,
          superseded_at: "2026-09-22T08:50:00Z",
          reassigned_from_assignment_id: null,
          superseded_by_assignment_id: "review-assignment-2",
          notes: [],
        },
        {
          id: "review-assignment-2",
          reviewer_id: "reviewer-1",
          reviewer_user_id: "user-1",
          status: "in_review",
          active: true,
          current_for_report: true,
          source: "manual",
          assigned_by_user_id: "admin-1",
          assigned_at: "2026-09-22T09:00:00Z",
          due_at: "2026-10-12T09:00:00Z",
          started_at: "2026-09-22T10:00:00Z",
          completed_at: null,
          superseded_at: null,
          reassigned_from_assignment_id: "review-assignment-old",
          superseded_by_assignment_id: null,
          notes: [
            {
              id: "review-note-1",
              assignment_id: "review-assignment-2",
              reviewer_id: "reviewer-1",
              reviewer_user_id: "user-1",
              section_id: "stable-section-id",
              section_heading: "Disease Overview",
              section_occurrence: 1,
              content: "Please clarify the prevalence estimate.",
              version: 2,
              created_at: "2026-09-22T10:15:00Z",
              updated_at: "2026-09-22T10:30:00Z",
            },
          ],
        },
      ],
    },
  ],
});
assert.equal(history.items[0]?.assignments.length, 2);
assert.equal(history.items[0]?.assignments[1]?.notes.length, 1);

const adminDashboard = adminReviewDashboardSchema.parse({
  stats: null,
  stats_as_of: null,
  items: [
    {
      report: assignment.report,
      review_status: "awaiting_assignment",
      submitted_at: "2026-09-22T11:00:00Z",
      assignment: null,
      reviewer: null,
    },
  ],
  next_cursor: null,
});
assert.equal(adminDashboard.items[0]?.assignment, null);

const comments = adminCommentListSchema.parse({
  items: [
    {
      id: "admin-comment-1",
      report_id: "report-1",
      report_service_id: "report-service-1",
      admin_user_id: "admin-1",
      content: "Testing note for the Super Admin only.",
      created_at: "2026-09-22T14:11:16.516Z",
    },
  ],
});
assert.equal(comments.items[0]?.admin_user_id, "admin-1");

assert.equal(reportReviewStatusSchema.safeParse("reviewed").success, true);
assert.equal(reportReviewStatusSchema.safeParse("approved").success, false);
assert.equal(
  reportReviewStatusSchema.safeParse("changes_requested").success,
  false,
);
