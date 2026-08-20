import assert from "node:assert/strict";

import {
  companyReportListResponseSchema,
  companyReportSummarySchema,
} from "../schemas/companyReportSchemas";
import { reportSchema } from "../schemas/platformReportSchemas";

function buildCreator(overrides: Record<string, unknown> = {}) {
  return {
    user_id: "user-2",
    full_name: "Ada Lovelace",
    email: "ada@example.com",
    ...overrides,
  };
}

function buildCompanyReportSummary(overrides: Record<string, unknown> = {}) {
  return {
    id: "report-1",
    title: "Nusinersen - Spinal Muscular Atrophy",
    drug_name: "Nusinersen",
    creator: buildCreator(),
    generation_status: "completed",
    review_status: "unassigned",
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
    company_id: "company-1",
    assigned_reviewer_user_id: null,
    review_status: "unassigned",
    title: "Nusinersen - Spinal Muscular Atrophy",
    drug_name: "Nusinersen",
    indications: "Spinal Muscular Atrophy",
    generation_status: "generating",
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

const historicalCreatorSummary = companyReportSummarySchema.parse(
  buildCompanyReportSummary({
    creator: buildCreator({
      user_id: "removed-user-9",
      full_name: "Former Seat User",
      email: "former@example.com",
    }),
    review_status: "pending",
  }),
);

assert.equal(historicalCreatorSummary.creator.user_id, "removed-user-9");
assert.equal(historicalCreatorSummary.creator.full_name, "Former Seat User");
assert.equal(historicalCreatorSummary.creator.email, "former@example.com");
assert.equal(historicalCreatorSummary.review_status, "pending");

assert.equal(
  companyReportSummarySchema.safeParse({
    ...buildCompanyReportSummary(),
    extra_field: "ignored",
  }).success,
  true,
);

assert.equal(
  companyReportSummarySchema.safeParse({
    ...buildCompanyReportSummary(),
    creator: undefined,
  }).success,
  false,
);

assert.equal(
  companyReportSummarySchema.safeParse({
    ...buildCompanyReportSummary(),
    created_at: "2026-08-01",
  }).success,
  false,
);

assert.equal(
  companyReportSummarySchema.safeParse({
    ...buildCompanyReportSummary({
      created_at: "2026-08-01T00:00:00Z",
      updated_at: "2026-08-02T12:00:00+00:00",
      generation_status: "failed",
      review_status: "changes_requested",
    }),
  }).success,
  true,
);

assert.equal(
  companyReportSummarySchema.safeParse({
    ...buildCompanyReportSummary(),
    generation_status: "in_progress",
  }).success,
  false,
);

assert.equal(
  companyReportSummarySchema.safeParse({
    ...buildCompanyReportSummary(),
    review_status: "sent_for_review",
  }).success,
  false,
);

const listWithNullCursor = companyReportListResponseSchema.parse({
  items: [buildCompanyReportSummary()],
  next_cursor: null,
});

assert.equal(listWithNullCursor.next_cursor, null);
assert.equal(listWithNullCursor.items.length, 1);
assert.equal(listWithNullCursor.items[0]?.creator.full_name, "Ada Lovelace");

const listWithOmittedCursor = companyReportListResponseSchema.parse({
  items: [],
});

assert.equal(listWithOmittedCursor.next_cursor, undefined);
assert.equal(listWithOmittedCursor.items.length, 0);

assert.equal(
  companyReportListResponseSchema.parse({
    items: [buildCompanyReportSummary()],
    next_cursor: "cursor-2",
  }).next_cursor,
  "cursor-2",
);

const generatingCompanyDetail = reportSchema.parse(buildReport());

assert.equal(generatingCompanyDetail.generation_status, "generating");
assert.equal(generatingCompanyDetail.result.completed_at, null);
assert.equal(generatingCompanyDetail.status_last_checked_at, null);
assert.equal(generatingCompanyDetail.company_id, "company-1");
