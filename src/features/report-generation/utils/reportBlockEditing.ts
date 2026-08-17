import type { Block, ReportSectionContent } from "../types";

export type EditableTextTarget =
  | {
      blockPath: number[];
      field: "paragraphText" | "definitionValue" | "calloutText" | "markdownText";
    }
  | {
      blockPath: number[];
      field: "listItem";
      itemIndex: number;
    }
  | {
      blockPath: number[];
      field: "tableCell";
      rowIndex: number;
      cellIndex: number;
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

function cloneBlock(block: Block): Block {
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
      return { ...block, blocks: block.blocks.map(cloneBlock) };
  }
}

export function cloneReportSectionContent(
  content: ReportSectionContent,
): ReportSectionContent {
  return {
    ...content,
    // raw remains the immutable agent output; only blocks are editable.
    raw: content.raw,
    blocks: content.blocks.map(cloneBlock),
  };
}

export function editableTargetKey(target: EditableTextTarget): string {
  const path = target.blockPath.join(".");

  if (target.field === "listItem") {
    return `${path}:listItem:${target.itemIndex}`;
  }

  if (target.field === "tableCell") {
    return `${path}:tableCell:${target.rowIndex}:${target.cellIndex}`;
  }

  return `${path}:${target.field}`;
}

function getBlockAtPath(blocks: Block[], blockPath: number[]): Block | null {
  let currentBlocks = blocks;
  let currentBlock: Block | undefined;

  for (let pathIndex = 0; pathIndex < blockPath.length; pathIndex += 1) {
    currentBlock = currentBlocks[blockPath[pathIndex]];
    if (!currentBlock) {
      return null;
    }

    if (pathIndex < blockPath.length - 1) {
      if (currentBlock.type !== "section") {
        return null;
      }
      currentBlocks = currentBlock.blocks;
    }
  }

  return currentBlock ?? null;
}

export function getEditableText(
  blocks: Block[],
  target: EditableTextTarget,
): string | null {
  const block = getBlockAtPath(blocks, target.blockPath);
  if (!block) {
    return null;
  }

  switch (target.field) {
    case "paragraphText":
      return block.type === "paragraph" ? block.text : null;
    case "definitionValue":
      return block.type === "definition" ? block.value : null;
    case "calloutText":
      return block.type === "callout" ? block.text : null;
    case "markdownText":
      return block.type === "markdown" ? block.text : null;
    case "listItem":
      return block.type === "list" ? (block.items[target.itemIndex] ?? null) : null;
    case "tableCell":
      return block.type === "table"
        ? (block.rows[target.rowIndex]?.[target.cellIndex] ?? null)
        : null;
  }
}

function updateBlockAtPath(
  blocks: Block[],
  blockPath: number[],
  update: (block: Block) => Block,
): Block[] {
  const [blockIndex, ...remainingPath] = blockPath;
  const block = blocks[blockIndex];

  if (!block) {
    return blocks;
  }

  const nextBlocks = [...blocks];

  if (remainingPath.length === 0) {
    nextBlocks[blockIndex] = update(block);
    return nextBlocks;
  }

  if (block.type !== "section") {
    return blocks;
  }

  const nestedBlocks = updateBlockAtPath(
    block.blocks,
    remainingPath,
    update,
  );

  if (nestedBlocks === block.blocks) {
    return blocks;
  }

  nextBlocks[blockIndex] = { ...block, blocks: nestedBlocks };
  return nextBlocks;
}

export function updateEditableText(
  content: ReportSectionContent,
  target: EditableTextTarget,
  value: string,
): ReportSectionContent {
  const blocks = updateBlockAtPath(content.blocks, target.blockPath, (block) => {
    switch (target.field) {
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
        return { ...block, items };
      }
      case "tableCell": {
        if (
          block.type !== "table" ||
          block.rows[target.rowIndex]?.[target.cellIndex] === undefined
        ) {
          return block;
        }
        const rows = block.rows.map((row) => [...row]);
        rows[target.rowIndex][target.cellIndex] = value;
        return { ...block, rows };
      }
    }
  });

  return blocks === content.blocks ? content : { ...content, blocks };
}

export function replaceEditableTextSelection(
  content: ReportSectionContent,
  selection: EditableTextSelection,
  replacement: string,
): ReportSectionContent | null {
  const currentText = getEditableText(content.blocks, selection.target);
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

  return updateEditableText(content, selection.target, nextText);
}

export function reportSectionContentMatches(
  left: ReportSectionContent | null,
  right: ReportSectionContent | null,
): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return JSON.stringify(left.blocks) === JSON.stringify(right.blocks);
}
