"use client";

import { createElement, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Block, ReportSectionContent } from "../../types";
import {
  editableTargetKey,
  replaceEditableTextSelection,
  type EditableTextSelection,
  type EditableTextTarget,
  updateEditableText,
} from "../../utils/reportBlockEditing";
import {
  previewReportRewrite,
  type ReportRewritePreset,
} from "../../api/reportRewritePreview";
import { RewriteWithAiPopover } from "./RewriteWithAiPopover";

type EditableSectionContentProps = {
  reportServiceId: string;
  sectionId: string;
  content: ReportSectionContent;
  skipFirstHeading?: boolean;
  onChange: (content: ReportSectionContent) => void;
};

type EditableTextProps = {
  target: EditableTextTarget;
  value: string;
  className?: string;
  placeholder?: string;
  onChange: (target: EditableTextTarget, value: string) => void;
  onSelection: (selection: EditableTextSelection | null) => void;
};

function normalizeEditableText(element: HTMLElement): string {
  const value = element.innerText.replace(/\r\n/g, "\n");
  return value === "\n" ? "" : value;
}

function EditableText({
  target,
  value,
  className,
  placeholder = "Enter text",
  onChange,
  onSelection,
}: EditableTextProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element || document.activeElement === element) {
      return;
    }

    if (normalizeEditableText(element) !== value) {
      element.innerText = value;
    }
  }, [value]);

  const captureSelection = () => {
    const element = elementRef.current;
    const browserSelection = window.getSelection();
    if (
      !element ||
      !browserSelection ||
      browserSelection.isCollapsed ||
      browserSelection.rangeCount === 0
    ) {
      onSelection(null);
      return;
    }

    const range = browserSelection.getRangeAt(0);
    if (!element.contains(range.commonAncestorContainer)) {
      onSelection(null);
      return;
    }

    const selectedText = range.toString();
    if (!selectedText.trim()) {
      onSelection(null);
      return;
    }

    const prefixRange = range.cloneRange();
    prefixRange.selectNodeContents(element);
    prefixRange.setEnd(range.startContainer, range.startOffset);
    const start = prefixRange.toString().length;
    const rect = range.getBoundingClientRect();
    const fallbackRect = element.getBoundingClientRect();
    const anchorRect = rect.width || rect.height ? rect : fallbackRect;

    onSelection({
      target,
      start,
      end: start + selectedText.length,
      selectedText,
      anchorRect: {
        top: anchorRect.top,
        right: anchorRect.right,
        bottom: anchorRect.bottom,
        left: anchorRect.left,
        width: anchorRect.width,
        height: anchorRect.height,
      },
    });
  };

  return (
    <div
      ref={elementRef}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={placeholder}
      data-editable-target={editableTargetKey(target)}
      data-placeholder={placeholder}
      onInput={(event) => {
        onChange(target, normalizeEditableText(event.currentTarget));
      }}
      onMouseDown={() => onSelection(null)}
      onMouseUp={captureSelection}
      onKeyUp={captureSelection}
      onPaste={(event) => {
        event.preventDefault();
        const plainText = event.clipboardData.getData("text/plain");
        const browserSelection = window.getSelection();
        if (!browserSelection?.rangeCount) {
          return;
        }
        const range = browserSelection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(plainText);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        browserSelection.removeAllRanges();
        browserSelection.addRange(range);
        onChange(target, normalizeEditableText(event.currentTarget));
      }}
      className={cn(
        "-mx-2 -my-1 min-h-7 rounded-card border border-transparent px-2 py-1 leading-report whitespace-pre-wrap text-text-body outline-none transition-colors empty:before:pointer-events-none empty:before:text-text-muted empty:before:content-[attr(data-placeholder)] hover:bg-surface-subtle focus:border-brand/40 focus:bg-surface-default",
        className,
      )}
    />
  );
}

function headingClassName(level: number): string {
  if (level <= 2) {
    return "text-section-heading font-medium text-text-heading";
  }
  if (level === 3) {
    return "text-card-title font-medium text-text-heading";
  }
  return "text-body-lg font-medium text-text-heading";
}

function renderHeading(level: number, text: string) {
  return createElement(
    `h${Math.min(Math.max(level, 2), 6)}`,
    { className: headingClassName(level) },
    text,
  );
}

function isLockedDefinition(block: Extract<Block, { type: "definition" }>) {
  return block.label.trim().toLowerCase() === "disease code";
}

function isLockedList(block: Extract<Block, { type: "list" }>) {
  return block.label?.trim().toLowerCase() === "sources used";
}

type RenderEditableBlocksProps = {
  blocks: Block[];
  pathPrefix?: number[];
  indexOffset?: number;
  depth?: number;
  onTextChange: (target: EditableTextTarget, value: string) => void;
  onSelection: (selection: EditableTextSelection | null) => void;
};

function RenderEditableBlocks({
  blocks,
  pathPrefix = [],
  indexOffset = 0,
  depth = 0,
  onTextChange,
  onSelection,
}: RenderEditableBlocksProps) {
  return (
    <div className={depth > 0 ? "flex flex-col gap-4" : "flex flex-col gap-8"}>
      {blocks.map((block, blockIndex) => {
        const blockPath = [...pathPrefix, blockIndex + indexOffset];
        const key = blockPath.join(".");

        switch (block.type) {
          case "heading":
            return <div key={key}>{renderHeading(block.level, block.text)}</div>;
          case "paragraph":
            return (
              <div key={key} className="flex flex-col gap-4">
                {block.label && (
                  <p
                    className={cn(
                      "text-text-body",
                      block.label_bold && "font-medium text-text-heading",
                    )}
                  >
                    {block.label}
                  </p>
                )}
                <EditableText
                  target={{ blockPath, field: "paragraphText" }}
                  value={block.text}
                  placeholder={block.label ?? "Paragraph text"}
                  onChange={onTextChange}
                  onSelection={onSelection}
                />
              </div>
            );
          case "definition":
            return (
              <div key={key} className="flex flex-col gap-2">
                <p className="font-medium text-text-heading">{block.label}</p>
                {isLockedDefinition(block) ? (
                  <p className="leading-report text-text-body">{block.value}</p>
                ) : (
                  <EditableText
                    target={{ blockPath, field: "definitionValue" }}
                    value={block.value}
                    placeholder={`${block.label} text`}
                    onChange={onTextChange}
                    onSelection={onSelection}
                  />
                )}
              </div>
            );
          case "list":
            return (
              <div key={key} className="flex flex-col gap-4">
                {block.label && (
                  <p className="font-medium text-text-heading">{block.label}</p>
                )}
                <ul className="list-disc pl-7 text-text-body">
                  {block.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="mt-2 first:mt-0">
                      {isLockedList(block) ? (
                        item
                      ) : (
                        <EditableText
                          target={{ blockPath, field: "listItem", itemIndex }}
                          value={item}
                          placeholder="List item"
                          onChange={onTextChange}
                          onSelection={onSelection}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          case "table":
            return (
              <div key={key} className="w-full overflow-x-auto">
                <table className="w-full table-fixed border-collapse border border-border-default text-left text-text-body">
                  <thead>
                    <tr className="border-b border-border-default bg-surface-subtle">
                      {block.columns.map((column, columnIndex) => (
                        <th
                          key={columnIndex}
                          className="wrap-break-word whitespace-pre-wrap align-top border-r border-border-default px-4 py-3 text-body-lg font-semibold text-text-heading last:border-r-0 first:w-[35%]"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="border-b border-border-default last:border-0"
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="wrap-break-word whitespace-pre-wrap align-top border-r border-border-default px-4 py-3 last:border-r-0 first:w-[35%]"
                          >
                            <EditableText
                              target={{
                                blockPath,
                                field: "tableCell",
                                rowIndex,
                                cellIndex,
                              }}
                              value={cell}
                              placeholder="Table cell"
                              className={cn(
                                cellIndex === 0 && "font-medium text-text-heading",
                              )}
                              onChange={onTextChange}
                              onSelection={onSelection}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "section":
            return (
              <div
                key={key}
                className={cn("flex flex-col gap-4", depth > 0 && "pl-6")}
              >
                {renderHeading(block.level, block.heading)}
                <RenderEditableBlocks
                  blocks={block.blocks}
                  pathPrefix={blockPath}
                  depth={depth + 1}
                  onTextChange={onTextChange}
                  onSelection={onSelection}
                />
              </div>
            );
          case "callout":
            return (
              <div
                key={key}
                className={cn(
                  "rounded-card border px-6 py-4 text-body-lg",
                  block.level === "info"
                    ? "border-brand-border bg-brand-bg"
                    : "border-amber-400/30 bg-amber-400/10",
                )}
              >
                <EditableText
                  target={{ blockPath, field: "calloutText" }}
                  value={block.text}
                  placeholder="Callout text"
                  className={
                    block.level === "warning" ? "text-amber-300" : undefined
                  }
                  onChange={onTextChange}
                  onSelection={onSelection}
                />
              </div>
            );
          case "markdown":
            return (
              <div key={key} className="flex flex-col gap-2">
                <p className="text-helper font-medium uppercase tracking-wide text-text-muted">
                  Markdown
                </p>
                <EditableText
                  target={{ blockPath, field: "markdownText" }}
                  value={block.text}
                  placeholder="Markdown text"
                  onChange={onTextChange}
                  onSelection={onSelection}
                />
              </div>
            );
        }
      })}
    </div>
  );
}

export function EditableSectionContent({
  reportServiceId,
  sectionId,
  content,
  skipFirstHeading = false,
  onChange,
}: EditableSectionContentProps) {
  const [selection, setSelection] = useState<EditableTextSelection | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);

  const firstBlock = content.blocks[0];
  const blocks =
    skipFirstHeading &&
    firstBlock?.type === "heading" &&
    firstBlock.level <= 2
      ? content.blocks.slice(1)
      : content.blocks;
  const indexOffset = blocks === content.blocks ? 0 : 1;

  const handleTextChange = (target: EditableTextTarget, value: string) => {
    setSelection(null);
    setRewriteError(null);
    onChange(updateEditableText(content, target, value));
  };

  const handleSelection = (nextSelection: EditableTextSelection | null) => {
    setRewriteError(null);
    setSelection(nextSelection);
  };

  const handleRewrite = async (
    instruction: string,
    preset: ReportRewritePreset | null,
  ) => {
    if (!selection || isRewriting) {
      return;
    }

    setIsRewriting(true);
    setRewriteError(null);

    try {
      const replacement = await previewReportRewrite({
        reportServiceId,
        sectionId,
        target: selection.target,
        selectedText: selection.selectedText,
        start: selection.start,
        end: selection.end,
        instruction,
        preset,
      });
      const nextContent = replaceEditableTextSelection(
        content,
        selection,
        replacement,
      );

      if (!nextContent) {
        throw new Error("The selected text changed. Highlight it again to rewrite it.");
      }

      onChange(nextContent);
      setSelection(null);
    } catch (error) {
      setRewriteError(
        error instanceof Error ? error.message : "Unable to preview this rewrite.",
      );
    } finally {
      setIsRewriting(false);
    }
  };

  if (blocks.length === 0) {
    return null;
  }

  return (
    <>
      <RenderEditableBlocks
        blocks={blocks}
        indexOffset={indexOffset}
        onTextChange={handleTextChange}
        onSelection={handleSelection}
      />
      {selection && (
        <RewriteWithAiPopover
          selection={selection}
          isRewriting={isRewriting}
          errorMessage={rewriteError}
          onClose={() => {
            if (!isRewriting) {
              setSelection(null);
              setRewriteError(null);
            }
          }}
          onRewrite={handleRewrite}
        />
      )}
    </>
  );
}
