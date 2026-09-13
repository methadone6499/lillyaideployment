import assert from "node:assert/strict";

import { sectionRevisionListResponseSchema } from "../schemas/editingSchemas";
import type { EditableBlock, SectionChangeSummary } from "../types";
import {
  buildEditableDocumentTextDiff,
  buildRevisionHistoryItems,
  diffRevisionText,
  getRevisionComparisonRevision,
  toDisplayVersion,
} from "../utils/revisionHistory";

const changes: SectionChangeSummary[] = [
  {
    change_id: "init-1",
    from_revision: -1,
    to_revision: 0,
    operation: "init",
    accepted_rewrite_ids: [],
    created_at: "2026-09-12T12:00:00Z",
  },
  {
    change_id: "edit-1",
    from_revision: 0,
    to_revision: 1,
    operation: "manual_edit",
    accepted_rewrite_ids: [],
    created_at: "2026-09-13T12:00:00Z",
  },
  {
    change_id: "restore-1",
    from_revision: 1,
    to_revision: 2,
    operation: "restore",
    accepted_rewrite_ids: [],
    created_at: "2026-09-13T13:00:00Z",
  },
];

const revisionList = sectionRevisionListResponseSchema.parse({
  report_id: "report-1",
  section_id: "section-1",
  current_revision: 2,
  items: changes,
});
assert.equal(revisionList.items[0]?.from_revision, -1);
assert.equal(
  sectionRevisionListResponseSchema.safeParse({
    report_id: "report-1",
    section_id: "section-1",
    current_revision: 1,
    items: [
      {
        change_id: "invalid-edit",
        from_revision: -1,
        to_revision: 1,
        operation: "manual_edit",
      },
    ],
  }).success,
  false,
);

assert.equal(toDisplayVersion(0), 1);
assert.equal(toDisplayVersion(2), 3);
assert.deepEqual(
  buildRevisionHistoryItems(2, changes).map((item) => ({
    revision: item.revision,
    version: item.version,
    isCurrent: item.isCurrent,
    isOriginal: item.isOriginal,
  })),
  [
    { revision: 2, version: 3, isCurrent: true, isOriginal: false },
    { revision: 1, version: 2, isCurrent: false, isOriginal: false },
    { revision: 0, version: 1, isCurrent: false, isOriginal: true },
  ],
);

assert.equal(getRevisionComparisonRevision(2, 2), 1);
assert.equal(getRevisionComparisonRevision(1, 2), 0);
assert.equal(getRevisionComparisonRevision(0, 2), 2);
assert.equal(getRevisionComparisonRevision(0, 0), null);

const textSegments = diffRevisionText(
  "The original clinical wording.",
  "The revised clinical wording.",
);
assert.equal(textSegments.some((segment) => segment.type === "removed"), true);
assert.equal(textSegments.some((segment) => segment.type === "added"), true);
assert.equal(
  textSegments.map((segment) => segment.text).join(""),
  "The original revised clinical wording.",
);

const previousBlocks: EditableBlock[] = [
  {
    block_id: "paragraph-1",
    type: "paragraph",
    label: "Overview",
    text: "The original clinical wording.",
  },
  {
    block_id: "table-1",
    type: "table",
    columns: ["Study"],
    rows: [["NCT1"]],
  },
  {
    block_id: "list-1",
    type: "list",
    label: "Findings",
    items: ["First finding", "Second finding"],
  },
];
const selectedBlocks: EditableBlock[] = [
  {
    ...previousBlocks[0],
    type: "paragraph",
    text: "The revised clinical wording.",
  },
  {
    block_id: "table-1",
    type: "table",
    columns: ["Study"],
    rows: [["NCT2"]],
  },
  {
    block_id: "list-1",
    type: "list",
    label: "Findings",
    items: ["First finding", "Second finding revised"],
  },
];

const blockDiff = buildEditableDocumentTextDiff(
  previousBlocks,
  selectedBlocks,
);
assert.deepEqual(
  blockDiff.map((change) => change.label),
  ["Overview", "Findings · Item 2"],
);
