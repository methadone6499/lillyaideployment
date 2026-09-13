import type { EditableBlock, SectionChangeSummary } from "../types";

export type RevisionHistoryItem = {
  revision: number;
  version: number;
  createdAt: string | null;
  isCurrent: boolean;
  isOriginal: boolean;
};

export type RevisionDiffSegment = {
  type: "unchanged" | "added" | "removed";
  text: string;
};

export type RevisionTextDiff = {
  key: string;
  label: string;
  segments: RevisionDiffSegment[];
};

type EditableTextField = {
  key: string;
  label: string;
  text: string;
};

export function toDisplayVersion(revision: number): number {
  return revision + 1;
}

export function buildRevisionHistoryItems(
  currentRevision: number,
  changes: readonly SectionChangeSummary[],
): RevisionHistoryItem[] {
  const createdAtByRevision = new Map<number, string | null>();

  for (const change of changes) {
    createdAtByRevision.set(change.to_revision, change.created_at ?? null);
  }

  return Array.from({ length: currentRevision + 1 }, (_, index) => {
    const revision = currentRevision - index;

    return {
      revision,
      version: toDisplayVersion(revision),
      createdAt: createdAtByRevision.get(revision) ?? null,
      isCurrent: revision === currentRevision,
      isOriginal: revision === 0,
    };
  });
}

export function getRevisionComparisonRevision(
  selectedRevision: number,
  currentRevision: number,
): number | null {
  if (currentRevision === 0) {
    return null;
  }

  return selectedRevision > 0 ? selectedRevision - 1 : currentRevision;
}

function collectEditableTextFields(
  blocks: readonly EditableBlock[],
  fields: EditableTextField[] = [],
): EditableTextField[] {
  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        fields.push({
          key: `${block.block_id}:heading`,
          label: "Heading",
          text: block.text,
        });
        break;
      case "paragraph":
        fields.push({
          key: `${block.block_id}:paragraph`,
          label: block.label?.trim() || "Paragraph",
          text: block.text,
        });
        break;
      case "definition":
        fields.push({
          key: `${block.block_id}:definition`,
          label: block.label,
          text: block.value,
        });
        break;
      case "list":
        block.items.forEach((item, itemIndex) => {
          fields.push({
            key: `${block.block_id}:list:${itemIndex}`,
            label: block.label
              ? `${block.label} · Item ${itemIndex + 1}`
              : `List item ${itemIndex + 1}`,
            text: item,
          });
        });
        break;
      case "callout":
        fields.push({
          key: `${block.block_id}:callout`,
          label: block.level === "warning" ? "Warning" : "Callout",
          text: block.text,
        });
        break;
      case "markdown":
        fields.push({
          key: `${block.block_id}:markdown`,
          label: "Markdown",
          text: block.text,
        });
        break;
      case "section":
        collectEditableTextFields(block.blocks, fields);
        break;
      case "table":
        break;
    }
  }

  return fields;
}

function tokenizeText(text: string): string[] {
  return text.match(/\s+|\S+\s*/g) ?? [];
}

function mergeDiffSegments(
  segments: RevisionDiffSegment[],
): RevisionDiffSegment[] {
  const merged: RevisionDiffSegment[] = [];

  for (const segment of segments) {
    const previous = merged[merged.length - 1];
    if (previous?.type === segment.type) {
      previous.text += segment.text;
    } else {
      merged.push({ ...segment });
    }
  }

  return merged;
}

export function diffRevisionText(
  previousText: string,
  selectedText: string,
): RevisionDiffSegment[] {
  if (previousText === selectedText) {
    return [{ type: "unchanged", text: selectedText }];
  }

  const previousTokens = tokenizeText(previousText);
  const selectedTokens = tokenizeText(selectedText);

  if (previousTokens.length * selectedTokens.length > 1_000_000) {
    return [
      { type: "removed", text: previousText },
      { type: "added", text: selectedText },
    ];
  }

  const lengths = Array.from(
    { length: previousTokens.length + 1 },
    () => new Uint32Array(selectedTokens.length + 1),
  );

  for (let previousIndex = 1; previousIndex <= previousTokens.length; previousIndex += 1) {
    for (let selectedIndex = 1; selectedIndex <= selectedTokens.length; selectedIndex += 1) {
      lengths[previousIndex][selectedIndex] =
        previousTokens[previousIndex - 1] === selectedTokens[selectedIndex - 1]
          ? lengths[previousIndex - 1][selectedIndex - 1] + 1
          : Math.max(
              lengths[previousIndex - 1][selectedIndex],
              lengths[previousIndex][selectedIndex - 1],
            );
    }
  }

  const reversed: RevisionDiffSegment[] = [];
  let previousIndex = previousTokens.length;
  let selectedIndex = selectedTokens.length;

  while (previousIndex > 0 || selectedIndex > 0) {
    if (
      previousIndex > 0 &&
      selectedIndex > 0 &&
      previousTokens[previousIndex - 1] === selectedTokens[selectedIndex - 1]
    ) {
      reversed.push({
        type: "unchanged",
        text: previousTokens[previousIndex - 1],
      });
      previousIndex -= 1;
      selectedIndex -= 1;
    } else if (
      selectedIndex > 0 &&
      (previousIndex === 0 ||
        lengths[previousIndex][selectedIndex - 1] >=
          lengths[previousIndex - 1][selectedIndex])
    ) {
      reversed.push({
        type: "added",
        text: selectedTokens[selectedIndex - 1],
      });
      selectedIndex -= 1;
    } else {
      reversed.push({
        type: "removed",
        text: previousTokens[previousIndex - 1],
      });
      previousIndex -= 1;
    }
  }

  return mergeDiffSegments(reversed.reverse());
}

export function buildEditableDocumentTextDiff(
  previousBlocks: readonly EditableBlock[],
  selectedBlocks: readonly EditableBlock[],
): RevisionTextDiff[] {
  const previousFields = collectEditableTextFields(previousBlocks);
  const selectedFields = collectEditableTextFields(selectedBlocks);
  const previousByKey = new Map(previousFields.map((field) => [field.key, field]));
  const selectedByKey = new Map(selectedFields.map((field) => [field.key, field]));
  const orderedKeys = [
    ...selectedFields.map((field) => field.key),
    ...previousFields
      .map((field) => field.key)
      .filter((key) => !selectedByKey.has(key)),
  ];

  return orderedKeys.flatMap((key) => {
    const previous = previousByKey.get(key);
    const selected = selectedByKey.get(key);
    const previousText = previous?.text ?? "";
    const selectedText = selected?.text ?? "";

    if (previousText === selectedText) {
      return [];
    }

    return [
      {
        key,
        label: selected?.label ?? previous?.label ?? "Text",
        segments: diffRevisionText(previousText, selectedText),
      },
    ];
  });
}
