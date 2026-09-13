import assert from "node:assert/strict";

import { createReportApiError, ReportApiError } from "../api/reportApiError";
import { editableBlockSchema } from "../schemas/editingSchemas";
import { buildSaveEditableDocumentRequest } from "../utils/reportEditing";
import {
  createClientOperationId,
  createSaveEditableDocumentInput,
  getSaveEditableDocumentConflictAction,
  getSaveEditableDocumentFailureMessage,
  SAVE_EDITABLE_DOCUMENT_ERROR_MESSAGES,
  SAVE_EDITABLE_DOCUMENT_GENERIC_FAILURE_MESSAGE,
  SAVE_EDITABLE_DOCUMENT_MISSING_ACTOR_MESSAGE,
  shouldRetrySaveEditableDocument,
} from "../utils/saveEditableDocument";

const ACTOR = { id: "user-1", name: "Analyst" };
const BLOCKS = [
  editableBlockSchema.parse({
    block_id: "b-1",
    type: "heading",
    level: 2,
    text: "Clinical Evidence",
    compiler_owned: "keep-me",
  }),
  editableBlockSchema.parse({
    block_id: "b-2",
    type: "paragraph",
    label: "Summary",
    label_bold: true,
    text: "The trial demonstrated benefit versus placebo.",
  }),
];
const DOCUMENT = {
  revision: 3,
  blocks: BLOCKS,
};

const created = createSaveEditableDocumentInput({
  document: DOCUMENT,
  acceptedRewriteIds: ["rw-1", "  ", "rw-2"],
  actor: ACTOR,
  clientOpId: "save-001",
});
assert.equal(created.ok, true);
if (created.ok) {
  const request = buildSaveEditableDocumentRequest(created.input);
  assert.deepEqual(request, {
    base_revision: 3,
    document: { blocks: BLOCKS },
    accepted_rewrite_ids: ["rw-1", "rw-2"],
    actor: ACTOR,
    client_op_id: "save-001",
  });
  assert.equal(
    (request.document.blocks[0] as { compiler_owned?: string }).compiler_owned,
    "keep-me",
  );
  assert.equal("report_id" in request.document, false);
  assert.equal("revision" in request.document, false);
}

assert.deepEqual(
  createSaveEditableDocumentInput({
    document: DOCUMENT,
    acceptedRewriteIds: ["rw-1"],
    actor: null,
  }),
  { ok: false, error: SAVE_EDITABLE_DOCUMENT_MISSING_ACTOR_MESSAGE },
);

const generated = createSaveEditableDocumentInput({
  document: DOCUMENT,
  acceptedRewriteIds: [],
  actor: ACTOR,
});
assert.equal(generated.ok, true);
if (generated.ok) {
  assert.deepEqual(generated.input.accepted_rewrite_ids, []);
  assert.match(
    generated.input.client_op_id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
}

const firstOpId = createClientOperationId();
const secondOpId = createClientOperationId();
assert.notEqual(firstOpId, secondOpId);

const anotherGenerated = createSaveEditableDocumentInput({
  document: DOCUMENT,
  acceptedRewriteIds: [],
  actor: ACTOR,
});
assert.equal(generated.ok && anotherGenerated.ok, true);
if (generated.ok && anotherGenerated.ok) {
  assert.notEqual(
    generated.input.client_op_id,
    anotherGenerated.input.client_op_id,
  );
}

const staleRevisionError = createReportApiError(
  409,
  {
    detail: {
      code: "stale_revision",
      message: "Document revision has changed; refresh and retry",
      details: { current_revision: 4, base_revision: 3 },
    },
  },
  "Conflict",
);
assert.equal(
  getSaveEditableDocumentConflictAction(staleRevisionError),
  "refresh_document",
);
assert.equal(
  getSaveEditableDocumentFailureMessage(staleRevisionError),
  "Document revision has changed; refresh and retry",
);

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
assert.equal(
  getSaveEditableDocumentConflictAction(inactiveSectionError),
  "refresh_report_status",
);
assert.equal(
  getSaveEditableDocumentFailureMessage(inactiveSectionError),
  "Section is not in the current report generation",
);

const duplicateClientOpError = createReportApiError(
  409,
  {
    detail: {
      code: "duplicate_client_op_id",
      message: "client_op_id already used",
    },
  },
  "Conflict",
);
assert.equal(
  getSaveEditableDocumentConflictAction(duplicateClientOpError),
  "none",
);
assert.equal(
  getSaveEditableDocumentFailureMessage(duplicateClientOpError),
  "client_op_id already used",
);

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
assert.equal(
  getSaveEditableDocumentConflictAction(validationFailedError),
  "none",
);
assert.equal(
  getSaveEditableDocumentFailureMessage(validationFailedError),
  "Structural / overlay-unsafe block change",
);

assert.equal(
  getSaveEditableDocumentConflictAction(new Error("network")),
  "none",
);

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
assert.equal(
  getSaveEditableDocumentConflictAction(reportNotEditableError),
  "none",
);
assert.equal(
  getSaveEditableDocumentFailureMessage(reportNotEditableError),
  "Report is not completed",
);

const sectionNotReadyError = createReportApiError(
  409,
  {
    detail: {
      code: "section_not_ready",
      message: "Section is still generating",
    },
  },
  "Conflict",
);
assert.equal(
  getSaveEditableDocumentConflictAction(sectionNotReadyError),
  "none",
);
assert.equal(
  getSaveEditableDocumentFailureMessage(sectionNotReadyError),
  "Section is still generating",
);
assert.equal(shouldRetrySaveEditableDocument(), false);
assert.equal(
  getSaveEditableDocumentFailureMessage(
    new ReportApiError(409, "  ", "stale_revision"),
  ),
  SAVE_EDITABLE_DOCUMENT_ERROR_MESSAGES.stale_revision,
);
assert.equal(
  getSaveEditableDocumentFailureMessage(new Error("")),
  SAVE_EDITABLE_DOCUMENT_GENERIC_FAILURE_MESSAGE,
);
assert.equal(
  getSaveEditableDocumentFailureMessage({}),
  SAVE_EDITABLE_DOCUMENT_GENERIC_FAILURE_MESSAGE,
);
