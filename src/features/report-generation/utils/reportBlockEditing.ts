import type {
  Block,
  EditableBlock,
  EditableDocumentResponse,
  ReplacementBlock,
  ReportSectionContent,
  TextSelection,
} from "../types";

/**
 * List-item offsets for rewrite selections are measured against items joined
 * with this separator so a single-block `anchor`/`focus` pair can address one
 * item without changing list length.
 */
export const LIST_ITEM_TEXT_SEPARATOR = "\n";

export type EditableTextTarget =
  | {
      blockId: string;
      field:
        | "headingText"
        | "paragraphText"
        | "definitionValue"
        | "calloutText"
        | "markdownText";
    }
  | {
      blockId: string;
      field: "listItem";
      itemIndex: number;
    };

export type EditableTextSelection = {
  target: EditableTextTarget;
  start: number;
  end: number;
  selectedText: string;
  anchorRect: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
  };
};

function cloneEditableBlock(block: EditableBlock): EditableBlock {
  switch (block.type) {
    case "heading":
    case "paragraph":
    case "definition":
    case "callout":
    case "markdown":
      return { ...block };
    case "table":
      return {
        ...block,
        columns: [...block.columns],
        rows: block.rows.map((row) => [...row]),
      };
    case "list":
      return { ...block, items: [...block.items] };
    case "section":
      return { ...block, blocks: block.blocks.map(cloneEditableBlock) };
  }
}

export function cloneEditableDocument(
  document: EditableDocumentResponse,
): EditableDocumentResponse {
  return {
    ...document,
    blocks: document.blocks.map(cloneEditableBlock),
    updated_by: document.updated_by
      ? { ...document.updated_by }
      : document.updated_by,
  };
}

export function withEditableDocumentBlocks(
  document: EditableDocumentResponse,
  blocks: EditableBlock[],
): EditableDocumentResponse {
  return {
    ...document,
    blocks,
  };
}

export function editableDocumentsMatch(
  left: EditableDocumentResponse | null,
  right: EditableDocumentResponse | null,
): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return JSON.stringify(left.blocks) === JSON.stringify(right.blocks);
}

export function editableTargetKey(target: EditableTextTarget): string {
  if (target.field === "listItem") {
    return `${target.blockId}:listItem:${target.itemIndex}`;
  }

  return `${target.blockId}:${target.field}`;
}

export function isReadOnlyEditableBlock(block: EditableBlock): boolean {
  return block.type === "table";
}

export function canEditEditableBlock(block: EditableBlock): boolean {
  return (
    block.type === "heading" ||
    block.type === "paragraph" ||
    block.type === "definition" ||
    block.type === "list" ||
    block.type === "callout" ||
    block.type === "markdown"
  );
}

export function findEditableBlockById(
  blocks: EditableBlock[],
  blockId: string,
): EditableBlock | null {
  for (const block of blocks) {
    if (block.block_id === blockId) {
      return block;
    }

    if (block.type === "section") {
      const nested = findEditableBlockById(block.blocks, blockId);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

export function updateEditableBlockById(
  blocks: EditableBlock[],
  blockId: string,
  update: (block: EditableBlock) => EditableBlock,
): EditableBlock[] {
  let changed = false;

  const nextBlocks = blocks.map((block) => {
    if (block.block_id === blockId) {
      const updated = update(block);
      if (updated !== block) {
        changed = true;
      }
      return updated;
    }

    if (block.type === "section") {
      const nested = updateEditableBlockById(block.blocks, blockId, update);
      if (nested !== block.blocks) {
        changed = true;
        return { ...block, blocks: nested };
      }
    }

    return block;
  });

  return changed ? nextBlocks : blocks;
}

export function isSafeEditableTarget(
  block: EditableBlock,
  target: EditableTextTarget,
): boolean {
  if (block.block_id !== target.blockId || isReadOnlyEditableBlock(block)) {
    return false;
  }

  switch (target.field) {
    case "headingText":
      return block.type === "heading";
    case "paragraphText":
      return block.type === "paragraph";
    case "definitionValue":
      return block.type === "definition";
    case "calloutText":
      return block.type === "callout";
    case "markdownText":
      return block.type === "markdown";
    case "listItem":
      return (
        block.type === "list" &&
        target.itemIndex >= 0 &&
        target.itemIndex < block.items.length
      );
  }
}

export function getEditableText(
  blocks: EditableBlock[],
  target: EditableTextTarget,
): string | null {
  const block = findEditableBlockById(blocks, target.blockId);
  if (!block || !isSafeEditableTarget(block, target)) {
    return null;
  }

  switch (target.field) {
    case "headingText":
      return block.type === "heading" ? block.text : null;
    case "paragraphText":
      return block.type === "paragraph" ? block.text : null;
    case "definitionValue":
      return block.type === "definition" ? block.value : null;
    case "calloutText":
      return block.type === "callout" ? block.text : null;
    case "markdownText":
      return block.type === "markdown" ? block.text : null;
    case "listItem":
      return block.type === "list"
        ? (block.items[target.itemIndex] ?? null)
        : null;
  }
}

export function updateEditableText(
  blocks: EditableBlock[],
  target: EditableTextTarget,
  value: string,
): EditableBlock[] {
  return updateEditableBlockById(blocks, target.blockId, (block) => {
    if (!isSafeEditableTarget(block, target)) {
      return block;
    }

    switch (target.field) {
      case "headingText":
        return block.type === "heading" ? { ...block, text: value } : block;
      case "paragraphText":
        return block.type === "paragraph" ? { ...block, text: value } : block;
      case "definitionValue":
        return block.type === "definition" ? { ...block, value } : block;
      case "calloutText":
        return block.type === "callout" ? { ...block, text: value } : block;
      case "markdownText":
        return block.type === "markdown" ? { ...block, text: value } : block;
      case "listItem": {
        if (block.type !== "list" || block.items[target.itemIndex] === undefined) {
          return block;
        }
        const items = [...block.items];
        items[target.itemIndex] = value;
        if (items.length !== block.items.length) {
          return block;
        }
        return { ...block, items };
      }
    }
  });
}

export function replaceListItems(
  block: Extract<EditableBlock, { type: "list" }>,
  items: string[],
): Extract<EditableBlock, { type: "list" }> | null {
  if (items.length !== block.items.length) {
    return null;
  }

  return { ...block, items };
}

export function replaceEditableTextSelection(
  blocks: EditableBlock[],
  selection: EditableTextSelection,
  replacement: string,
): EditableBlock[] | null {
  const currentText = getEditableText(blocks, selection.target);
  if (
    currentText === null ||
    selection.start < 0 ||
    selection.end < selection.start ||
    selection.end > currentText.length ||
    currentText.slice(selection.start, selection.end) !== selection.selectedText
  ) {
    return null;
  }

  const nextText =
    currentText.slice(0, selection.start) +
    replacement +
    currentText.slice(selection.end);

  return updateEditableText(blocks, selection.target, nextText);
}

function toBlockOffset(
  block: EditableBlock,
  target: EditableTextTarget,
  offset: number,
): number | null {
  if (target.field !== "listItem") {
    return offset;
  }

  if (block.type !== "list" || !isSafeEditableTarget(block, target)) {
    return null;
  }

  let prefixLength = 0;
  for (let index = 0; index < target.itemIndex; index += 1) {
    prefixLength += block.items[index].length + LIST_ITEM_TEXT_SEPARATOR.length;
  }

  return prefixLength + offset;
}

export function toApiTextSelection(
  blocks: EditableBlock[],
  selection: Pick<
    EditableTextSelection,
    "target" | "start" | "end" | "selectedText"
  >,
): TextSelection | null {
  const block = findEditableBlockById(blocks, selection.target.blockId);
  if (!block || !isSafeEditableTarget(block, selection.target)) {
    return null;
  }

  const currentText = getEditableText(blocks, selection.target);
  if (
    currentText === null ||
    selection.start < 0 ||
    selection.end < selection.start ||
    selection.end > currentText.length ||
    currentText.slice(selection.start, selection.end) !== selection.selectedText
  ) {
    return null;
  }

  const startOffset = toBlockOffset(block, selection.target, selection.start);
  const endOffset = toBlockOffset(block, selection.target, selection.end);
  if (startOffset === null || endOffset === null) {
    return null;
  }

  return {
    anchor: { block_id: selection.target.blockId, offset: startOffset },
    focus: { block_id: selection.target.blockId, offset: endOffset },
    selected_text: selection.selectedText,
  };
}

function applyReplacementText(
  block: EditableBlock,
  text: string,
): EditableBlock {
  switch (block.type) {
    case "heading":
    case "paragraph":
    case "callout":
    case "markdown":
      return { ...block, text };
    case "definition":
      return { ...block, value: text };
    case "list": {
      const items = text.split(LIST_ITEM_TEXT_SEPARATOR);
      return replaceListItems(block, items) ?? block;
    }
    case "table":
    case "section":
      return block;
  }
}

export function applyReplacementBlocks(
  blocks: EditableBlock[],
  replacements: readonly ReplacementBlock[],
): EditableBlock[] | null {
  let next = blocks;

  for (const replacement of replacements) {
    const block = findEditableBlockById(next, replacement.block_id);
    if (!block || !canEditEditableBlock(block)) {
      return null;
    }

    const updated = updateEditableBlockById(
      next,
      replacement.block_id,
      (current) => applyReplacementText(current, replacement.text),
    );
    if (updated === next) {
      return null;
    }

    next = updated;
  }

  return next;
}

function toGeneratedBlock(block: EditableBlock): Block {
  switch (block.type) {
    case "heading":
      return { type: "heading", level: block.level, text: block.text };
    case "paragraph":
      return {
        type: "paragraph",
        text: block.text,
        ...(block.label !== undefined ? { label: block.label } : {}),
        ...(block.label_bold !== undefined
          ? { label_bold: block.label_bold }
          : {}),
      };
    case "table":
      return {
        type: "table",
        columns: [...block.columns],
        rows: block.rows.map((row) => [...row]),
      };
    case "definition":
      return { type: "definition", label: block.label, value: block.value };
    case "list":
      return {
        type: "list",
        items: [...block.items],
        ...(block.label !== undefined ? { label: block.label } : {}),
      };
    case "callout":
      return { type: "callout", level: block.level, text: block.text };
    case "markdown":
      return { type: "markdown", text: block.text };
    case "section":
      return {
        type: "section",
        heading: block.heading,
        level: block.level,
        blocks: block.blocks.map(toGeneratedBlock),
      };
  }
}

export function toReportSectionContent(
  blocks: EditableBlock[],
): ReportSectionContent {
  return {
    blocks: blocks.map(toGeneratedBlock),
  };
}
