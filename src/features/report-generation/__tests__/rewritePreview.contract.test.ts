import assert from "node:assert/strict";

import { createReportApiError } from "../api/reportApiError";
import {
  editableBlockSchema,
  rewritePresetListResponseSchema,
  rewritePreviewResponseSchema,
  rewritePreviewStatusSchema,
} from "../schemas/editingSchemas";
import { buildCreateRewritePreviewRequest } from "../utils/reportEditing";
import {
  applyReadyRewritePreview,
  appendAcceptedRewriteId,
  createRewritePreviewInputFromEditor,
  filterRewritePresets,
  getRewritePreviewFailureMessage,
  getRewritePreviewStatusMessage,
  resolveRewritePreviewChoice,
  REWRITE_PREVIEW_APPLY_FAILED_MESSAGE,
  REWRITE_PREVIEW_BOTH_CHOICES_MESSAGE,
  REWRITE_PREVIEW_GENERIC_FAILURE_MESSAGE,
  REWRITE_PREVIEW_MISSING_ACTOR_MESSAGE,
  REWRITE_PREVIEW_MISSING_CHOICE_MESSAGE,
  REWRITE_PREVIEW_STATUS_MESSAGES,
  REWRITE_PREVIEW_STALE_SELECTION_MESSAGE,
  shouldResetAcceptedRewriteIds,
} from "../utils/rewritePreview";

const REPORT_ID = "0ec01d40-a63d-49bf-9275-007f2db66fb7";
const SECTION_ID = "section-clinical";
const CUSTOM_SECTION_TYPE =
  "custom:532cc119-a115-4ea8-8145-df44a3174a2a";
const ACTOR = { id: "user-1", name: "Analyst" };

const blocks = [
  editableBlockSchema.parse({
    block_id: "b-1",
    type: "heading",
    level: 2,
    text: "Clinical Evidence",
  }),
  editableBlockSchema.parse({
    block_id: "b-2",
    type: "paragraph",
    label: "Summary",
    label_bold: true,
    text: "The trial showed benefit versus placebo.",
  }),
  editableBlockSchema.parse({
    block_id: "b-3",
    type: "table",
    columns: ["Study", "Outcome"],
    rows: [["NCT1", "Benefit"]],
  }),
];

const presets = rewritePresetListResponseSchema.parse({
  items: [
    {
      preset_id: "global.make_concise",
      label: "Make concise",
      description: "Shorten the selected text.",
      section_types: ["clinical", "custom", "disease"],
      mode: "rewrite_only",
    },
    {
      preset_id: "clinical.efficacy_clarity",
      label: "Clarify efficacy",
      description: "Clarify the efficacy statement.",
      section_types: ["clinical"],
      mode: "rewrite_only",
    },
    {
      preset_id: "disease.burden_clarity",
      label: "Clarify disease burden",
      description: "Clarify disease burden.",
      section_types: ["disease"],
      mode: "rewrite_only",
    },
    {
      preset_id: "global.expand_with_evidence",
      label: "Expand using evidence",
      description: "Retrieve supporting evidence.",
      section_types: ["clinical", CUSTOM_SECTION_TYPE],
      mode: "lookup_and_rewrite",
    },
  ],
}).items;

assert.deepEqual(
  filterRewritePresets(presets, "clinical").map((preset) => preset.preset_id),
  [
    "global.make_concise",
    "clinical.efficacy_clarity",
    "global.expand_with_evidence",
  ],
);
assert.deepEqual(
  filterRewritePresets(presets, "disease").map((preset) => preset.preset_id),
  ["global.make_concise", "disease.burden_clarity"],
);
assert.deepEqual(
  filterRewritePresets(presets, CUSTOM_SECTION_TYPE).map(
    (preset) => preset.preset_id,
  ),
  ["global.make_concise", "global.expand_with_evidence"],
);
assert.deepEqual(filterRewritePresets(presets, "economic"), []);

assert.deepEqual(resolveRewritePreviewChoice("  Make concise  ", null), {
  ok: true,
  value: { instruction: "Make concise" },
});
assert.deepEqual(
  resolveRewritePreviewChoice("   ", "  global.make_concise  "),
  { ok: true, value: { preset_id: "global.make_concise" } },
);
assert.deepEqual(resolveRewritePreviewChoice("   ", null), {
  ok: false,
  error: REWRITE_PREVIEW_MISSING_CHOICE_MESSAGE,
});
assert.deepEqual(
  resolveRewritePreviewChoice("Make concise", "global.make_concise"),
  { ok: false, error: REWRITE_PREVIEW_BOTH_CHOICES_MESSAGE },
);

const presetInput = createRewritePreviewInputFromEditor({
  baseRevision: 3,
  blocks,
  selection: {
    target: { blockId: "b-2", field: "paragraphText" },
    start: 0,
    end: 10,
    selectedText: "The trial ",
  },
  actor: ACTOR,
  instruction: "  ",
  presetId: "global.make_concise",
});
assert.equal(presetInput.ok, true);
if (presetInput.ok) {
  const request = buildCreateRewritePreviewRequest(presetInput.input);
  assert.deepEqual(request, {
    base_revision: 3,
    selection: {
      anchor: { block_id: "b-2", offset: 0 },
      focus: { block_id: "b-2", offset: 10 },
      selected_text: "The trial ",
    },
    preset_id: "global.make_concise",
    actor: ACTOR,
  });
  assert.equal("instruction" in request, false);
}

const instructionInput = createRewritePreviewInputFromEditor({
  baseRevision: 3,
  blocks,
  selection: {
    target: { blockId: "b-2", field: "paragraphText" },
    start: 0,
    end: 10,
    selectedText: "The trial ",
  },
  actor: ACTOR,
  instruction: "Rewrite in executive tone for a P&T committee",
  presetId: null,
});
assert.equal(instructionInput.ok, true);
if (instructionInput.ok) {
  const request = buildCreateRewritePreviewRequest(instructionInput.input);
  assert.equal("preset_id" in request, false);
  assert.equal(
    request.instruction,
    "Rewrite in executive tone for a P&T committee",
  );
}

assert.deepEqual(
  createRewritePreviewInputFromEditor({
    baseRevision: 3,
    blocks,
    selection: {
      target: { blockId: "b-2", field: "paragraphText" },
      start: 0,
      end: 10,
      selectedText: "The trial ",
    },
    actor: null,
    instruction: "Make concise",
    presetId: null,
  }),
  { ok: false, error: REWRITE_PREVIEW_MISSING_ACTOR_MESSAGE },
);

assert.deepEqual(
  createRewritePreviewInputFromEditor({
    baseRevision: 3,
    blocks,
    selection: {
      target: { blockId: "b-2", field: "paragraphText" },
      start: 0,
      end: 10,
      selectedText: "changed text",
    },
    actor: ACTOR,
    instruction: "Make concise",
    presetId: null,
  }),
  { ok: false, error: REWRITE_PREVIEW_STALE_SELECTION_MESSAGE },
);

assert.deepEqual(
  createRewritePreviewInputFromEditor({
    baseRevision: 3,
    blocks,
    selection: {
      target: { blockId: "b-3", field: "paragraphText" },
      start: 0,
      end: 4,
      selectedText: "NCT1",
    },
    actor: ACTOR,
    instruction: "Make concise",
    presetId: null,
  }),
  { ok: false, error: REWRITE_PREVIEW_STALE_SELECTION_MESSAGE },
);

for (const status of rewritePreviewStatusSchema.options) {
  if (status === "ready") {
    assert.equal(
      getRewritePreviewStatusMessage({ status, message: null }),
      null,
    );
    continue;
  }

  const fallback = getRewritePreviewStatusMessage({ status, message: "  " });
  assert.equal(fallback, REWRITE_PREVIEW_STATUS_MESSAGES[status]);
  assert.ok(fallback.length > 0);
}

assert.equal(
  getRewritePreviewStatusMessage({
    status: "stale_revision",
    message: "Document revision has changed; refresh and retry",
  }),
  "Document revision has changed; refresh and retry",
);
assert.equal(
  getRewritePreviewStatusMessage({
    status: "no_relevant_evidence",
    message: null,
  }),
  REWRITE_PREVIEW_STATUS_MESSAGES.no_relevant_evidence,
);
assert.equal(
  getRewritePreviewStatusMessage({
    status: "evidence_index_not_ready",
    message: undefined,
  }),
  REWRITE_PREVIEW_STATUS_MESSAGES.evidence_index_not_ready,
);
assert.equal(
  getRewritePreviewStatusMessage({
    status: "unsupported_request",
    message: null,
  }),
  REWRITE_PREVIEW_STATUS_MESSAGES.unsupported_request,
);
assert.equal(
  getRewritePreviewStatusMessage({
    status: "validation_failed",
    message: null,
  }),
  REWRITE_PREVIEW_STATUS_MESSAGES.validation_failed,
);
assert.equal(
  getRewritePreviewStatusMessage({
    status: "stale_selection",
    message: null,
  }),
  REWRITE_PREVIEW_STATUS_MESSAGES.stale_selection,
);

const readyPreview = rewritePreviewResponseSchema.parse({
  rewrite_id: "rw-1",
  report_id: REPORT_ID,
  section_id: SECTION_ID,
  status: "ready",
  base_revision: 3,
  selection: {
    anchor: { block_id: "b-2", offset: 0 },
    focus: { block_id: "b-2", offset: 10 },
    selected_text: "The trial ",
  },
  replacement_blocks: [
    { block_id: "b-2", text: "The trial demonstrated benefit." },
  ],
});
const applied = applyReadyRewritePreview(blocks, readyPreview);
assert.equal(applied?.rewriteId, "rw-1");
assert.equal(applied?.blocks[1]?.type, "paragraph");
if (applied?.blocks[1]?.type === "paragraph") {
  assert.equal(applied.blocks[1].text, "The trial demonstrated benefit.");
  assert.equal(applied.blocks[1].label, "Summary");
}

const stalePreview = rewritePreviewResponseSchema.parse({
  rewrite_id: "rw-stale",
  report_id: REPORT_ID,
  section_id: SECTION_ID,
  status: "stale_revision",
  base_revision: 3,
  selection: {
    anchor: { block_id: "b-2", offset: 0 },
    focus: { block_id: "b-2", offset: 10 },
  },
  replacement_blocks: [
    { block_id: "b-2", text: "Should not be applied." },
  ],
  message: "Document revision has changed; refresh and retry",
});
assert.equal(applyReadyRewritePreview(blocks, stalePreview), null);
assert.equal(
  getRewritePreviewStatusMessage(stalePreview),
  "Document revision has changed; refresh and retry",
);

assert.equal(
  applyReadyRewritePreview(blocks, {
    status: "ready",
    rewrite_id: "rw-empty",
    replacement_blocks: [],
  }),
  null,
);
assert.equal(
  applyReadyRewritePreview(blocks, {
    status: "ready",
    rewrite_id: "rw-table",
    replacement_blocks: [{ block_id: "b-3", text: "unsafe table write" }],
  }),
  null,
);

assert.equal(REWRITE_PREVIEW_APPLY_FAILED_MESSAGE.length > 0, true);

assert.deepEqual(appendAcceptedRewriteId([], "rw-1"), ["rw-1"]);
assert.deepEqual(appendAcceptedRewriteId(["rw-1"], "rw-2"), ["rw-1", "rw-2"]);
const existingIds = ["rw-1"];
assert.equal(appendAcceptedRewriteId(existingIds, "rw-1"), existingIds);
assert.equal(appendAcceptedRewriteId(existingIds, "  "), existingIds);

const savedDocument = {
  report_id: REPORT_ID,
  section_id: SECTION_ID,
  revision: 3,
};
assert.equal(shouldResetAcceptedRewriteIds(null, savedDocument), true);
assert.equal(
  shouldResetAcceptedRewriteIds(savedDocument, savedDocument),
  false,
);
assert.equal(
  shouldResetAcceptedRewriteIds(savedDocument, { ...savedDocument, revision: 4 }),
  true,
);
assert.equal(
  shouldResetAcceptedRewriteIds(savedDocument, {
    ...savedDocument,
    section_id: "section-disease",
  }),
  true,
);

const conflictError = createReportApiError(
  409,
  {
    detail: {
      code: "inactive_section",
      message: "Section is not in the current report generation",
    },
  },
  "Conflict",
);
assert.equal(
  getRewritePreviewFailureMessage(conflictError),
  "Section is not in the current report generation",
);
assert.equal(
  getRewritePreviewFailureMessage(new Error("")),
  REWRITE_PREVIEW_GENERIC_FAILURE_MESSAGE,
);
assert.equal(
  getRewritePreviewFailureMessage({}),
  REWRITE_PREVIEW_GENERIC_FAILURE_MESSAGE,
);
