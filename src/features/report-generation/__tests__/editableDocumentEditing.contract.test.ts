import assert from "node:assert/strict";

import { editableBlockSchema } from "../schemas/editingSchemas";
import {
  applyReplacementBlocks,
  cloneEditableDocument,
  findEditableBlockById,
  isReadOnlyEditableBlock,
  isSafeEditableTarget,
  LIST_ITEM_TEXT_SEPARATOR,
  replaceListItems,
  toApiTextSelection,
  toReportSectionContent,
  updateEditableText,
  withEditableDocumentBlocks,
} from "../utils/reportBlockEditing";
import type { EditableDocumentResponse } from "../types";

const REPORT_ID = "0ec01d40-a63d-49bf-9275-007f2db66fb7";
const SECTION_ID = "section-clinical";

const document: EditableDocumentResponse = {
  report_id: REPORT_ID,
  section_id: SECTION_ID,
  section_type: "clinical",
  revision: 3,
  blocks: [
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
      text: "The trial showed benefit versus placebo.",
    }),
    editableBlockSchema.parse({
      block_id: "b-3",
      type: "table",
      columns: ["Study", "Outcome"],
      rows: [["NCT1", "Benefit"]],
    }),
    editableBlockSchema.parse({
      block_id: "b-4",
      type: "list",
      label: "Key findings",
      items: ["First finding", "Second finding"],
    }),
    editableBlockSchema.parse({
      block_id: "b-5",
      type: "section",
      heading: "Nested",
      level: 3,
      blocks: [
        {
          block_id: "b-5a",
          type: "definition",
          label: "Disease code",
          value: "ICD-10",
        },
      ],
    }),
  ],
};

const cloned = cloneEditableDocument(document);
assert.equal(cloned.revision, 3);
assert.notEqual(cloned.blocks, document.blocks);
assert.equal(
  (cloned.blocks[0] as { compiler_owned?: string }).compiler_owned,
  "keep-me",
);

const withUpdatedParagraph = withEditableDocumentBlocks(
  document,
  updateEditableText(document.blocks, {
    blockId: "b-2",
    field: "paragraphText",
  }, "The trial demonstrated benefit versus placebo."),
);
assert.equal(withUpdatedParagraph.revision, 3);
assert.equal(withUpdatedParagraph.blocks[1]?.type, "paragraph");
if (withUpdatedParagraph.blocks[1]?.type === "paragraph") {
  assert.equal(
    withUpdatedParagraph.blocks[1].text,
    "The trial demonstrated benefit versus placebo.",
  );
  assert.equal(withUpdatedParagraph.blocks[1].label, "Summary");
  assert.equal(withUpdatedParagraph.blocks[1].label_bold, true);
  assert.equal(withUpdatedParagraph.blocks[1].block_id, "b-2");
}

const headingAfterParagraphEdit = withUpdatedParagraph.blocks[0];
assert.equal(
  (headingAfterParagraphEdit as { compiler_owned?: string }).compiler_owned,
  "keep-me",
);

const headingEdit = updateEditableText(document.blocks, {
  blockId: "b-1",
  field: "headingText",
}, "Updated heading");
assert.equal(headingEdit[0]?.type, "heading");
if (headingEdit[0]?.type === "heading") {
  assert.equal(headingEdit[0].text, "Updated heading");
  assert.equal(headingEdit[0].level, 2);
  assert.equal(headingEdit[0].block_id, "b-1");
  assert.equal(
    (headingEdit[0] as { compiler_owned?: string }).compiler_owned,
    "keep-me",
  );
}

const tableBlock = findEditableBlockById(document.blocks, "b-3");
assert.equal(tableBlock?.type, "table");
assert.equal(tableBlock ? isReadOnlyEditableBlock(tableBlock) : false, true);
assert.equal(
  isSafeEditableTarget(tableBlock!, {
    blockId: "b-3",
    field: "paragraphText",
  }),
  false,
);

const tableUnchanged = updateEditableText(document.blocks, {
  blockId: "b-3",
  field: "paragraphText",
}, "should not apply");
assert.equal(tableUnchanged, document.blocks);
if (tableUnchanged[2]?.type === "table") {
  assert.deepEqual(tableUnchanged[2].rows, [["NCT1", "Benefit"]]);
}

const nestedDefinition = findEditableBlockById(document.blocks, "b-5a");
assert.equal(nestedDefinition?.type, "definition");
const nestedEdit = updateEditableText(document.blocks, {
  blockId: "b-5a",
  field: "definitionValue",
}, "ICD-11");
const nestedAfterEdit = findEditableBlockById(nestedEdit, "b-5a");
assert.equal(nestedAfterEdit?.type, "definition");
if (nestedAfterEdit?.type === "definition") {
  assert.equal(nestedAfterEdit.value, "ICD-11");
  assert.equal(nestedAfterEdit.label, "Disease code");
}

const listEdit = updateEditableText(document.blocks, {
  blockId: "b-4",
  field: "listItem",
  itemIndex: 1,
}, "Second finding, revised");
const listAfterEdit = findEditableBlockById(listEdit, "b-4");
assert.equal(listAfterEdit?.type, "list");
if (listAfterEdit?.type === "list") {
  assert.deepEqual(listAfterEdit.items, [
    "First finding",
    "Second finding, revised",
  ]);
  assert.equal(listAfterEdit.items.length, 2);
  assert.equal(listAfterEdit.label, "Key findings");
}

const listBlock = findEditableBlockById(document.blocks, "b-4");
assert.equal(listBlock?.type, "list");
if (listBlock?.type === "list") {
  assert.equal(
    replaceListItems(listBlock, ["only-one"]),
    null,
  );
  assert.deepEqual(
    replaceListItems(listBlock, ["A", "B"])?.items,
    ["A", "B"],
  );
}

const paragraphSelection = toApiTextSelection(document.blocks, {
  target: { blockId: "b-2", field: "paragraphText" },
  start: 0,
  end: 10,
  selectedText: "The trial ",
});
assert.deepEqual(paragraphSelection, {
  anchor: { block_id: "b-2", offset: 0 },
  focus: { block_id: "b-2", offset: 10 },
  selected_text: "The trial ",
});

const listSelection = toApiTextSelection(document.blocks, {
  target: { blockId: "b-4", field: "listItem", itemIndex: 1 },
  start: 0,
  end: 6,
  selectedText: "Second",
});
assert.deepEqual(listSelection, {
  anchor: {
    block_id: "b-4",
    offset: "First finding".length + LIST_ITEM_TEXT_SEPARATOR.length,
  },
  focus: {
    block_id: "b-4",
    offset: "First finding".length + LIST_ITEM_TEXT_SEPARATOR.length + 6,
  },
  selected_text: "Second",
});

const staleSelection = toApiTextSelection(document.blocks, {
  target: { blockId: "b-2", field: "paragraphText" },
  start: 0,
  end: 10,
  selectedText: "changed text",
});
assert.equal(staleSelection, null);

const tableSelection = toApiTextSelection(document.blocks, {
  target: { blockId: "b-3", field: "paragraphText" },
  start: 0,
  end: 4,
  selectedText: "NCT1",
});
assert.equal(tableSelection, null);

const rewritten = applyReplacementBlocks(document.blocks, [
  { block_id: "b-2", text: "The trial demonstrated benefit." },
]);
assert.equal(rewritten?.[1]?.type, "paragraph");
if (rewritten?.[1]?.type === "paragraph") {
  assert.equal(rewritten[1].text, "The trial demonstrated benefit.");
  assert.equal(rewritten[1].label, "Summary");
}

const listRewrite = applyReplacementBlocks(document.blocks, [
  {
    block_id: "b-4",
    text: ["First finding", "Second finding updated"].join(
      LIST_ITEM_TEXT_SEPARATOR,
    ),
  },
]);
const rewrittenList = findEditableBlockById(listRewrite ?? [], "b-4");
assert.equal(rewrittenList?.type, "list");
if (rewrittenList?.type === "list") {
  assert.deepEqual(rewrittenList.items, [
    "First finding",
    "Second finding updated",
  ]);
}

const unsafeListRewrite = applyReplacementBlocks(document.blocks, [
  { block_id: "b-4", text: "only one item" },
]);
assert.equal(unsafeListRewrite, null);

const tableRewrite = applyReplacementBlocks(document.blocks, [
  { block_id: "b-3", text: "should not write tables" },
]);
assert.equal(tableRewrite, null);

const missingRewrite = applyReplacementBlocks(document.blocks, [
  { block_id: "missing", text: "gone" },
]);
assert.equal(missingRewrite, null);

const mismatchedHeadingField = updateEditableText(document.blocks, {
  blockId: "b-1",
  field: "paragraphText",
}, "should not apply to heading");
assert.equal(mismatchedHeadingField, document.blocks);

const sectionHeadingLocked = updateEditableText(document.blocks, {
  blockId: "b-5",
  field: "headingText",
}, "Hacked nested heading");
assert.equal(sectionHeadingLocked, document.blocks);
const nestedSection = findEditableBlockById(sectionHeadingLocked, "b-5");
assert.equal(nestedSection?.type, "section");
if (nestedSection?.type === "section") {
  assert.equal(nestedSection.heading, "Nested");
}

const outOfRangeListItem = updateEditableText(document.blocks, {
  blockId: "b-4",
  field: "listItem",
  itemIndex: 8,
}, "should not add items");
assert.equal(outOfRangeListItem, document.blocks);

const calloutDocument = withEditableDocumentBlocks(document, [
  ...document.blocks,
  editableBlockSchema.parse({
    block_id: "b-6",
    type: "callout",
    level: "warning",
    text: "Check confidence intervals.",
  }),
  editableBlockSchema.parse({
    block_id: "b-7",
    type: "markdown",
    text: "**See also** the trial protocol.",
  }),
]);
const calloutEdit = updateEditableText(calloutDocument.blocks, {
  blockId: "b-6",
  field: "calloutText",
}, "Check confidence intervals and sample size.");
const calloutAfterEdit = findEditableBlockById(calloutEdit, "b-6");
assert.equal(calloutAfterEdit?.type, "callout");
if (calloutAfterEdit?.type === "callout") {
  assert.equal(calloutAfterEdit.level, "warning");
  assert.equal(
    calloutAfterEdit.text,
    "Check confidence intervals and sample size.",
  );
}

const markdownEdit = updateEditableText(calloutDocument.blocks, {
  blockId: "b-7",
  field: "markdownText",
}, "**See also** the statistical analysis plan.");
const markdownAfterEdit = findEditableBlockById(markdownEdit, "b-7");
assert.equal(markdownAfterEdit?.type, "markdown");
if (markdownAfterEdit?.type === "markdown") {
  assert.equal(
    markdownAfterEdit.text,
    "**See also** the statistical analysis plan.",
  );
}

const calloutRewrite = applyReplacementBlocks(calloutDocument.blocks, [
  { block_id: "b-6", text: "Updated warning." },
]);
const rewrittenCallout = findEditableBlockById(calloutRewrite ?? [], "b-6");
assert.equal(rewrittenCallout?.type, "callout");
if (rewrittenCallout?.type === "callout") {
  assert.equal(rewrittenCallout.text, "Updated warning.");
  assert.equal(rewrittenCallout.level, "warning");
}

const displayContent = toReportSectionContent(document.blocks);
assert.equal("block_id" in displayContent.blocks[0], false);
assert.equal(displayContent.blocks[0]?.type, "heading");
if (displayContent.blocks[0]?.type === "heading") {
  assert.equal(displayContent.blocks[0].text, "Clinical Evidence");
}
assert.equal(displayContent.blocks[2]?.type, "table");
const nestedDisplay = displayContent.blocks[4];
assert.equal(nestedDisplay?.type, "section");
if (nestedDisplay?.type === "section") {
  assert.equal("block_id" in nestedDisplay, false);
  assert.equal("block_id" in nestedDisplay.blocks[0], false);
}
