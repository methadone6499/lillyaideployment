import assert from "node:assert/strict";

import {
  adminReportListResponseSchema,
  adminReportSummarySchema,
} from "../schemas/adminReportSchemas";
import { reportSchema } from "../schemas/platformReportSchemas";

function buildCreator(overrides: Record<string, unknown> = {}) {
  return {
    user_id: "user-2",
    full_name: "Ada Lovelace",
    email: "ada@example.com",
    ...overrides,
  };
}

function buildCompany(overrides: Record<string, unknown> = {}) {
  return {
    id: "company-1",
    name: "LillyAI Labs",
    ...overrides,
  };
}

function buildReviewer(overrides: Record<string, unknown> = {}) {
  return {
    user_id: "reviewer-7",
    full_name: "Grace Hopper",
    email: "grace@example.com",
    ...overrides,
  };
}

function buildAdminReportSummary(overrides: Record<string, unknown> = {}) {
  return {
    id: "report-1",
    title: "Nusinersen - Spinal Muscular Atrophy",
    drug_name: "Nusinersen",
    creator: buildCreator(),
    company: buildCompany(),
    reviewer: buildReviewer(),
    generation_status: "completed",
    review_status: "unassigned",
    quota_charged: true,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-02T12:00:00.000Z",
    ...overrides,
  };
}

function buildReport(overrides: Record<string, unknown> = {}) {
  return {
    id: "report-1",
    report_service_id: "11111111-1111-4111-8111-111111111111",
    generation_job_id: null,
    created_by_user_id: "user-2",
    creator_snapshot: {
      email: "ada@example.com",
      full_name: "Ada Lovelace",
    },
    company_id: null,
    assigned_reviewer_id: null,
    assigned_reviewer_user_id: null,
    review_assignment_id: null,
    review_cycle_id: null,
    review_cycle: 0,
    review_status: "unassigned",
    review_submitted_at: null,
    review_locked_at: null,
    review_assigned_at: null,
    review_due_at: null,
    is_editable: true,
    is_overdue: false,
    title: "Nusinersen - Spinal Muscular Atrophy",
    drug_name: "Nusinersen",
    indications: "Spinal Muscular Atrophy",
    generation_status: "completed",
    status_last_checked_at: null,
    generation_snapshot: {
      filters: {
        timeRange: "5y",
        clinicalStudyTypes: [],
        evidenceSynthesis: "",
        specializedTrialStructures: "",
        populationType: [],
        studyDuration: "",
        economicStudyTypes: [],
        costPopulationType: "",
        patientRange: "",
        costPopulationTypeSecondary: "",
        costStudyDuration: "",
        outcomeEvidenceFocus: [],
        evidenceQuality: [],
        comparatorType: [],
        customDateFrom: "",
        customDateTo: "",
        costPatientVolume: "",
        costTreatmentDurationDays: "",
        costUnitPrice: "",
        costDosageFrequency: "",
        costRegion: "",
      },
      selected_clinical_article_ids: [],
      selected_economic_article_ids: [],
      selected_comparators: [],
      custom_comparators: [],
      selected_section_ids: [],
      custom_sections: [],
      submitted_at: "2026-08-01T00:00:00.000Z",
    },
    result: {
      completed_at: null,
      pdf_url: null,
    },
    archived_at: null,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

const personalUnassignedReport = adminReportSummarySchema.parse(
  buildAdminReportSummary({
    company: null,
    reviewer: null,
    quota_charged: false,
    created_at: "2026-08-16T12:00:00Z",
    updated_at: "2026-08-16T12:00:00Z",
  }),
);

assert.equal(personalUnassignedReport.company, null);
assert.equal(personalUnassignedReport.reviewer, null);
assert.equal(personalUnassignedReport.quota_charged, false);
assert.equal(personalUnassignedReport.creator.full_name, "Ada Lovelace");
assert.equal(personalUnassignedReport.generation_status, "completed");
assert.equal(personalUnassignedReport.review_status, "unassigned");

assert.equal(
  adminReportSummarySchema.safeParse(
    buildAdminReportSummary({
      company: undefined,
      reviewer: undefined,
    }),
  ).success,
  false,
);

const assignedCompanyReport = adminReportSummarySchema.parse(
  buildAdminReportSummary({
    review_status: "in_review",
    quota_charged: true,
  }),
);

assert.equal(assignedCompanyReport.company?.name, "LillyAI Labs");
assert.equal(assignedCompanyReport.reviewer?.full_name, "Grace Hopper");
assert.equal(assignedCompanyReport.reviewer?.email, "grace@example.com");
assert.equal(assignedCompanyReport.quota_charged, true);

assert.equal(
  adminReportSummarySchema.safeParse({
    ...buildAdminReportSummary(),
    extra_field: "ignored",
  }).success,
  true,
);

assert.equal(
  adminReportSummarySchema.safeParse({
    ...buildAdminReportSummary(),
    creator: undefined,
  }).success,
  false,
);

assert.equal(
  adminReportSummarySchema.safeParse({
    ...buildAdminReportSummary(),
    quota_charged: undefined,
  }).success,
  false,
);

assert.equal(
  adminReportSummarySchema.safeParse({
    ...buildAdminReportSummary(),
    created_at: "2026-08-01",
  }).success,
  false,
);

assert.equal(
  adminReportSummarySchema.safeParse({
    ...buildAdminReportSummary({
      created_at: "2026-08-01T00:00:00Z",
      updated_at: "2026-08-02T12:00:00+00:00",
      generation_status: "failed",
      review_status: "reviewed",
    }),
  }).success,
  true,
);

assert.equal(
  adminReportSummarySchema.safeParse({
    ...buildAdminReportSummary(),
    generation_status: "in_progress",
  }).success,
  false,
);

assert.equal(
  adminReportSummarySchema.safeParse({
    ...buildAdminReportSummary(),
    review_status: "sent_for_review",
  }).success,
  false,
);

const adminSummary = adminReportSummarySchema.parse(buildAdminReportSummary());
assert.equal("review_cycle" in adminSummary, false);

const listWithNullCursor = adminReportListResponseSchema.parse({
  items: [buildAdminReportSummary({ company: null, reviewer: null })],
  next_cursor: null,
});

assert.equal(listWithNullCursor.next_cursor, null);
assert.equal(listWithNullCursor.items.length, 1);
assert.equal(listWithNullCursor.items[0]?.company, null);
assert.equal(listWithNullCursor.items[0]?.reviewer, null);

assert.equal(
  adminReportListResponseSchema.safeParse({ items: [] }).success,
  false,
);

assert.equal(
  adminReportListResponseSchema.parse({
    items: [buildAdminReportSummary()],
    next_cursor: "cursor-2",
  }).next_cursor,
  "cursor-2",
);

const adminDetail = reportSchema.parse(buildReport());

assert.equal(adminDetail.company_id, null);
assert.equal(adminDetail.assigned_reviewer_user_id, null);
assert.equal(adminDetail.generation_status, "completed");
assert.equal(adminDetail.review_cycle_id, null);
assert.equal(adminDetail.review_cycle, 0);

assert.equal(
  reportSchema.safeParse(buildReport({ review_cycle_id: undefined })).success,
  false,
);
