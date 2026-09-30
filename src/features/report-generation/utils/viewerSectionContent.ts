import type { Block, EditableBlock, ReportSectionContent } from "../types";

const SOURCE_SECTION_TITLES = new Set([
  "source",
  "sources",
  "sources used",
  "evidence sources",
  "reference",
  "references",
  "bibliography",
]);

function normalizeHeading(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^[#\s]+/, "")
    .replace(/[:.\s]+$/, "")
    .replace(/\s+/g, " ");
}

export function isTrailingSourceHeading(value: string): boolean {
  return SOURCE_SECTION_TITLES.has(normalizeHeading(value));
}

function trimMarkdownSourceSection(markdown: string): string {
  const heading = /(?:^|\n)[ \t]*#{1,6}[ \t]+([^\n]+)(?=\n|$)/g;
  let lastHeading: RegExpMatchArray | null = null;
  for (const match of markdown.matchAll(heading)) {
    lastHeading = match;
  }

  return lastHeading && isTrailingSourceHeading(lastHeading[1] ?? "")
    ? markdown.slice(0, lastHeading.index ?? 0).trimEnd()
    : markdown;
}

function generatedSourceStartIndex(blocks: readonly Block[]): number {
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const block = blocks[index];
    if (
      (block.type === "heading" && isTrailingSourceHeading(block.text)) ||
      (block.type === "section" && isTrailingSourceHeading(block.heading)) ||
      (block.type === "list" &&
        block.label !== undefined &&
        isTrailingSourceHeading(block.label))
    ) {
      return index;
    }
    if (block.type === "heading" || block.type === "section") {
      return -1;
    }
  }
  return -1;
}

export function stripTrailingSourceBlocks(blocks: readonly Block[]): Block[] {
  const normalized = blocks.flatMap<Block>((block) => {
    if (block.type === "section") {
      return [{ ...block, blocks: stripTrailingSourceBlocks(block.blocks) }];
    }
    if (block.type === "markdown") {
      const text = trimMarkdownSourceSection(block.text);
      return text ? [{ ...block, text }] : [];
    }
    return [block];
  });
  const sourceStart = generatedSourceStartIndex(normalized);
  return sourceStart >= 0 ? normalized.slice(0, sourceStart) : normalized;
}

function editableSourceStartIndex(blocks: readonly EditableBlock[]): number {
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const block = blocks[index];
    if (
      (block.type === "heading" && isTrailingSourceHeading(block.text)) ||
      (block.type === "section" && isTrailingSourceHeading(block.heading)) ||
      (block.type === "list" &&
        block.label !== undefined &&
        isTrailingSourceHeading(block.label))
    ) {
      return index;
    }
    if (block.type === "heading" || block.type === "section") {
      return -1;
    }
  }
  return -1;
}

export function stripTrailingEditableSourceBlocks(
  blocks: readonly EditableBlock[],
): EditableBlock[] {
  const normalized = blocks.flatMap<EditableBlock>((block) => {
    if (block.type === "section") {
      return [
        { ...block, blocks: stripTrailingEditableSourceBlocks(block.blocks) },
      ];
    }
    if (block.type === "markdown") {
      const text = trimMarkdownSourceSection(block.text);
      return text ? [{ ...block, text }] : [];
    }
    return [block];
  });
  const sourceStart = editableSourceStartIndex(normalized);
  return sourceStart >= 0 ? normalized.slice(0, sourceStart) : normalized;
}

export function toViewerSectionContent(
  content: ReportSectionContent,
): ReportSectionContent {
  return {
    ...content,
    blocks: stripTrailingSourceBlocks(content.blocks),
  };
}
