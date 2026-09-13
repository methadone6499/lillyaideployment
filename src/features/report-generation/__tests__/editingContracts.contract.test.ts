import assert from "node:assert/strict";

import {
  createReportApiError,
  getEditingErrorCode,
  isEditingErrorCode,
} from "../api/reportApiError";
import { reportQueryKeys } from "../api/reportQueryKeys";
import {
  editableBlockSchema,
  editableDocumentResponseSchema,
  rewritePresetListResponseSchema,
  rewritePreviewResponseSchema,
  saveEditableDocumentInputSchema,
} from "../schemas/editingSchemas";
import { headingBlockSchema } from "../schemas/reportSchemas";
import {
  buildCreateRewritePreviewRequest,
  buildSaveEditableDocumentRequest,
  getEditableDocumentPath,
  getRewritePresetsPath,
  getRewritePreviewsPath,
  toEditingActor,
  toRewritePresetSectionType,
} from "../utils/reportEditing";
import { shouldRetryReportEditingQuery } from "../utils/shouldRetryReportEditingQuery";

const REPORT_ID = "0ec01d40-a63d-49bf-9275-007f2db66fb7";
const SECTION_ID = "section-clinical";
const CUSTOM_SECTION_TYPE =
  "custom:532cc119-a115-4ea8-8145-df44a3174a2a";
const ACTOR = { id: "user-1", name: "Analyst" };
const SELECTION = {
  anchor: { block_id: "b-2", offset: 0 },
  focus: { block_id: "b-2", offset: 42 },
};

assert.equal(toRewritePresetSectionType("clinical"), "clinical");
assert.equal(toRewritePresetSectionType("custom"), "custom");
assert.equal(toRewritePresetSectionType(CUSTOM_SECTION_TYPE), "custom");
assert.equal(
  toRewritePresetSectionType(` ${CUSTOM_SECTION_TYPE} `),
  "custom",
);
assert.equal(getRewritePresetsPath(undefined), "/rewrite-presets");
assert.equal(
  getRewritePresetsPath("clinical"),
  "/rewrite-presets?section_type=clinical",
);
assert.equal(
  getRewritePresetsPath(CUSTOM_SECTION_TYPE),
  "/rewrite-presets?section_type=custom",
);
assert.equal(
  getEditableDocumentPath(REPORT_ID, SECTION_ID),
  `/reports/${REPORT_ID}/sections/${SECTION_ID}/editable-document`,
);
assert.equal(
  getRewritePreviewsPath(REPORT_ID, SECTION_ID),
  `/reports/${REPORT_ID}/sections/${SECTION_ID}/rewrite-previews`,
);

assert.deepEqual(toEditingActor({ id: "user-1", full_name: "Analyst" }), ACTOR);
assert.deepEqual(toEditingActor({ id: "user-1", full_name: "  " }), {
  id: "user-1",
  name: "user-1",
});

const generatedHeading = headingBlockSchema.parse({
  block_id: "b-1",
  type: "heading",
  level: 2,
  text: "Clinical Evidence",
});
assert.equal("block_id" in generatedHeading, false);

assert.equal(
  editableBlockSchema.safeParse({
    type: "heading",
    level: 2,
    text: "Clinical Evidence",
  }).success,
  false,
);

const headingWithCompilerField = editableBlockSchema.parse({
  block_id: "b-1",
  type: "heading",
  level: 2,
  text: "Clinical Evidence",
  compiler_owned: "keep-me",
});
assert.equal(
  (headingWithCompilerField as { compiler_owned?: string }).compiler_owned,
  "keep-me",
);

const document = editableDocumentResponseSchema.parse({
  report_id: REPORT_ID,
  section_id: SECTION_ID,
  section_type: "clinical",
  revision: 0,
  blocks: [
    {
      block_id: "b-1",
      type: "heading",
      level: 2,
      text: "Clinical Evidence",
    },
    {
      block_id: "b-2",
      type: "paragraph",
      label: "Summary",
      label_bold: true,
      text: "The trial showed benefit versus placebo.",
    },
    {
      block_id: "b-3",
      type: "table",
      columns: ["Study", "Outcome"],
      rows: [["NCT1", "Benefit"]],
    },
  ],
});
assert.equal(document.revision, 0);
assert.equal(document.blocks[2]?.type, "table");

const presets = rewritePresetListResponseSchema.parse({
  items: [
    {
      preset_id: "global.make_concise",
      label: "Make concise",
      description: "Shorten the selected text.",
      section_types: ["clinical", "custom"],
      mode: "rewrite_only",
    },
    {
      preset_id: "global.expand_with_evidence",
      label: "Expand using evidence",
      description: "Retrieve supporting evidence.",
      section_types: ["clinical"],
      mode: "lookup_and_rewrite",
    },
  ],
});
assert.equal(presets.items[0]?.preset_id, "global.make_concise");

const presetRequest = buildCreateRewritePreviewRequest({
  base_revision: 0,
  selection: SELECTION,
  preset_id: "global.make_concise",
  actor: ACTOR,
});
assert.deepEqual(presetRequest, {
  base_revision: 0,
  selection: SELECTION,
  preset_id: "global.make_concise",
  actor: ACTOR,
});
assert.equal("instruction" in presetRequest, false);

const instructionRequest = buildCreateRewritePreviewRequest({
  base_revision: 0,
  selection: SELECTION,
  instruction: "Rewrite in executive tone for a P&T committee",
  actor: ACTOR,
});
assert.deepEqual(instructionRequest, {
  base_revision: 0,
  selection: SELECTION,
  instruction: "Rewrite in executive tone for a P&T committee",
  actor: ACTOR,
});
assert.equal("preset_id" in instructionRequest, false);

assert.throws(() =>
  buildCreateRewritePreviewRequest({
    base_revision: 0,
    selection: SELECTION,
    actor: ACTOR,
  }),
);
assert.throws(() =>
  buildCreateRewritePreviewRequest({
    base_revision: 0,
    selection: SELECTION,
    preset_id: "global.make_concise",
    instruction: "Also rewrite this",
    actor: ACTOR,
  }),
);

const trimmedPresetRequest = buildCreateRewritePreviewRequest({
  base_revision: 0,
  selection: SELECTION,
  preset_id: "  global.make_concise  ",
  actor: ACTOR,
});
assert.deepEqual(trimmedPresetRequest, {
  base_revision: 0,
  selection: SELECTION,
  preset_id: "global.make_concise",
  actor: ACTOR,
});
assert.equal("instruction" in trimmedPresetRequest, false);

const preview = rewritePreviewResponseSchema.parse({
  rewrite_id: "rw-1",
  report_id: REPORT_ID,
  section_id: SECTION_ID,
  status: "ready",
  base_revision: 0,
  selection: {
    ...SELECTION,
    selected_text: "The trial showed benefit versus placebo.",
  },
  replacement_blocks: [{ block_id: "b-2", text: "The trial demonstrated benefit." }],
});
assert.deepEqual(preview.replacement_blocks, [
  { block_id: "b-2", text: "The trial demonstrated benefit." },
]);
assert.deepEqual(preview.sources, []);
assert.deepEqual(preview.claims, []);
assert.deepEqual(preview.warnings, []);

const stalePreview = rewritePreviewResponseSchema.parse({
  rewrite_id: "rw-stale",
  report_id: REPORT_ID,
  section_id: SECTION_ID,
  status: "stale_revision",
  base_revision: 0,
  selection: SELECTION,
  message: "Document revision has changed; refresh and retry",
});
assert.equal(stalePreview.status, "stale_revision");
assert.deepEqual(stalePreview.replacement_blocks, []);

const saveRequest = buildSaveEditableDocumentRequest({
  base_revision: 0,
  document: { blocks: document.blocks },
  accepted_rewrite_ids: ["rw-1"],
  actor: ACTOR,
  client_op_id: "save-001",
});
assert.deepEqual(saveRequest, {
  base_revision: 0,
  document: { blocks: document.blocks },
  accepted_rewrite_ids: ["rw-1"],
  actor: ACTOR,
  client_op_id: "save-001",
});

const saveWithoutRewriteIds = saveEditableDocumentInputSchema.parse({
  base_revision: 0,
  document: { blocks: document.blocks },
  actor: ACTOR,
  client_op_id: "save-002",
});
assert.deepEqual(saveWithoutRewriteIds.accepted_rewrite_ids, []);

const staleRevisionError = createReportApiError(
  409,
  {
    detail: {
      code: "stale_revision",
      message: "Document revision has changed; refresh and retry",
      details: { current_revision: 2, base_revision: 1 },
    },
  },
  "Conflict",
);
assert.equal(staleRevisionError.status, 409);
assert.equal(staleRevisionError.message, "Document revision has changed; refresh and retry");
assert.equal(staleRevisionError.code, "stale_revision");
assert.deepEqual(staleRevisionError.details, {
  current_revision: 2,
  base_revision: 1,
});
assert.equal(getEditingErrorCode(staleRevisionError), "stale_revision");
assert.equal(isEditingErrorCode(staleRevisionError, "stale_revision"), true);
assert.equal(shouldRetryReportEditingQuery(0, staleRevisionError), false);

const inactiveSectionError = createReportApiError(
  409,
  {
    detail: {
      code: "inactive_section",
      message: "Section is not in the current report generation",
    },
  },
  "Conflict",
);
assert.equal(inactiveSectionError.code, "inactive_section");
assert.equal(inactiveSectionError.details, null);
assert.equal(isEditingErrorCode(inactiveSectionError, "inactive_section"), true);
assert.equal(shouldRetryReportEditingQuery(1, inactiveSectionError), false);

const validationFailedError = createReportApiError(
  422,
  {
    detail: {
      code: "validation_failed",
      message: "Structural / overlay-unsafe block change",
    },
  },
  "Unprocessable Entity",
);
assert.equal(validationFailedError.code, "validation_failed");
assert.equal(shouldRetryReportEditingQuery(0, validationFailedError), false);

const reportNotEditableError = createReportApiError(
  409,
  {
    detail: {
      code: "report_not_editable",
      message: "Report is not completed",
    },
  },
  "Conflict",
);
assert.equal(reportNotEditableError.code, "report_not_editable");
assert.equal(isEditingErrorCode(reportNotEditableError, "report_not_editable"), true);
assert.equal(shouldRetryReportEditingQuery(0, reportNotEditableError), false);

const stringDetailError = createReportApiError(
  404,
  { detail: "Section not found" },
  "Not Found",
);
assert.equal(stringDetailError.message, "Section not found");
assert.equal(stringDetailError.code, null);

assert.deepEqual(reportQueryKeys.rewritePresets("custom"), [
  "report",
  "rewrite-presets",
  "custom",
]);
assert.deepEqual(reportQueryKeys.editableDocument(REPORT_ID, SECTION_ID), [
  "report",
  REPORT_ID,
  "editable-document",
  SECTION_ID,
]);
assert.deepEqual(reportQueryKeys.sectionRevisions(REPORT_ID, SECTION_ID), [
  "report",
  REPORT_ID,
  "revisions",
  SECTION_ID,
]);
assert.equal(
  reportQueryKeys.editableDocument(REPORT_ID, SECTION_ID)[1],
  reportQueryKeys.byReport(REPORT_ID)[1],
);
assert.equal(shouldRetryReportEditingQuery(0, new Error("network")), true);
assert.equal(shouldRetryReportEditingQuery(2, new Error("network")), false);
