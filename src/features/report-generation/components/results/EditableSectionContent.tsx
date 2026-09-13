"use client";

import {
  createElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import {
  useCreateRewritePreviewMutation,
  useRewritePresets,
} from "../../hooks/useReportEditing";
import type { EditableBlock, EditingActor } from "../../types";
import {
  editableTargetKey,
  updateEditableText,
  type EditableTextSelection,
  type EditableTextTarget,
} from "../../utils/reportBlockEditing";
import {
  applyReadyRewritePreview,
  createRewritePreviewInputFromEditor,
  filterRewritePresets,
  getRewritePreviewFailureMessage,
  getRewritePreviewStatusMessage,
  REWRITE_PREVIEW_APPLY_FAILED_MESSAGE,
} from "../../utils/rewritePreview";
import { RewriteWithAiPopover } from "./RewriteWithAiPopover";

type SelectionHighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type EditableSelectionChange = (
  selection: EditableTextSelection | null,
  highlightRects?: readonly SelectionHighlightRect[],
) => void;

type EditableSectionContentProps = {
  reportServiceId: string;
  sectionId: string;
  sectionType: string;
  revision: number;
  actor: EditingActor | null;
  blocks: EditableBlock[];
  skipFirstHeading?: boolean;
  onChange: (blocks: EditableBlock[]) => void;
  onRewriteAccepted: (rewriteId: string) => void;
};

type EditableTextProps = {
  target: EditableTextTarget;
  value: string;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange: (target: EditableTextTarget, value: string) => void;
  onSelection: EditableSelectionChange;
};

function normalizeEditableText(element: HTMLElement): string {
  const value = element.innerText.replace(/\r\n/g, "\n");
  return value === "\n" ? "" : value;
}

function getSelectionHighlightRects(range: Range): SelectionHighlightRect[] {
  return Array.from(range.getClientRects())
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .map((rect) => ({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    }));
}

function EditableText({
  target,
  value,
  className,
  placeholder = "Enter text",
  readOnly = false,
  onChange,
  onSelection,
}: EditableTextProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const pointerSelectionAbortRef = useRef<AbortController | null>(null);
  const selectionCaptureFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      pointerSelectionAbortRef.current?.abort();
      if (selectionCaptureFrameRef.current !== null) {
        window.cancelAnimationFrame(selectionCaptureFrameRef.current);
      }
    };
  }, []);

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

    onSelection(
      {
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
      },
      getSelectionHighlightRects(range),
    );
    browserSelection.removeAllRanges();
  };

  return (
    <div
      ref={elementRef}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-readonly={readOnly}
      aria-label={placeholder}
      data-editable-target={editableTargetKey(target)}
      data-placeholder={placeholder}
      onInput={(event) => {
        onChange(target, normalizeEditableText(event.currentTarget));
      }}
      onPointerDown={(event) => {
        if (readOnly || event.button !== 0) {
          return;
        }

        onSelection(null);
        pointerSelectionAbortRef.current?.abort();
        if (selectionCaptureFrameRef.current !== null) {
          window.cancelAnimationFrame(selectionCaptureFrameRef.current);
          selectionCaptureFrameRef.current = null;
        }

        const controller = new AbortController();
        pointerSelectionAbortRef.current = controller;

        const cancelPointerSelection = () => {
          controller.abort();
          if (pointerSelectionAbortRef.current === controller) {
            pointerSelectionAbortRef.current = null;
          }
        };

        const finishPointerSelection = () => {
          cancelPointerSelection();
          selectionCaptureFrameRef.current = window.requestAnimationFrame(() => {
            selectionCaptureFrameRef.current = null;
            captureSelection();
          });
        };

        document.addEventListener("pointerup", finishPointerSelection, {
          once: true,
          signal: controller.signal,
        });
        document.addEventListener("pointercancel", cancelPointerSelection, {
          once: true,
          signal: controller.signal,
        });
        window.addEventListener("blur", cancelPointerSelection, {
          once: true,
          signal: controller.signal,
        });
      }}
      onKeyUp={() => {
        if (!readOnly) {
          captureSelection();
        }
      }}
      onPaste={(event) => {
        if (readOnly) {
          event.preventDefault();
          return;
        }
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

type RenderEditableBlocksProps = {
  blocks: EditableBlock[];
  depth?: number;
  readOnly?: boolean;
  onTextChange: (target: EditableTextTarget, value: string) => void;
  onSelection: EditableSelectionChange;
};

function RenderEditableBlocks({
  blocks,
  depth = 0,
  readOnly = false,
  onTextChange,
  onSelection,
}: RenderEditableBlocksProps) {
  return (
    <div className={depth > 0 ? "flex flex-col gap-4" : "flex flex-col gap-8"}>
      {blocks.map((block) => {
        switch (block.type) {
          case "heading":
            return (
              <div key={block.block_id} className={headingClassName(block.level)}>
                <EditableText
                  target={{ blockId: block.block_id, field: "headingText" }}
                  value={block.text}
                  placeholder="Heading"
                  className={headingClassName(block.level)}
                  readOnly={readOnly}
                  onChange={onTextChange}
                  onSelection={onSelection}
                />
              </div>
            );
          case "paragraph":
            return (
              <div key={block.block_id} className="flex flex-col gap-4">
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
                  target={{ blockId: block.block_id, field: "paragraphText" }}
                  value={block.text}
                  placeholder={block.label ?? "Paragraph text"}
                  readOnly={readOnly}
                  onChange={onTextChange}
                  onSelection={onSelection}
                />
              </div>
            );
          case "definition":
            return (
              <div key={block.block_id} className="flex flex-col gap-2">
                <p className="font-medium text-text-heading">{block.label}</p>
                <EditableText
                  target={{ blockId: block.block_id, field: "definitionValue" }}
                  value={block.value}
                  placeholder={`${block.label} text`}
                  readOnly={readOnly}
                  onChange={onTextChange}
                  onSelection={onSelection}
                />
              </div>
            );
          case "list":
            return (
              <div key={block.block_id} className="flex flex-col gap-4">
                {block.label && (
                  <p className="font-medium text-text-heading">{block.label}</p>
                )}
                <ul className="list-disc pl-7 text-text-body">
                  {block.items.map((item, itemIndex) => (
                    <li key={`${block.block_id}:${itemIndex}`} className="mt-2 first:mt-0">
                      <EditableText
                        target={{
                          blockId: block.block_id,
                          field: "listItem",
                          itemIndex,
                        }}
                        value={item}
                        placeholder="List item"
                        readOnly={readOnly}
                        onChange={onTextChange}
                        onSelection={onSelection}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          case "table":
            return (
              <div key={block.block_id} className="w-full overflow-x-auto">
                <table className="w-full table-fixed border-collapse border border-border-default text-left text-text-body">
                  <thead>
                    <tr className="border-b border-border-default bg-surface-subtle">
                      {block.columns.map((column, columnIndex) => (
                        <th
                          key={`${block.block_id}:column:${columnIndex}`}
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
                        key={`${block.block_id}:row:${rowIndex}`}
                        className="border-b border-border-default last:border-0"
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={`${block.block_id}:cell:${rowIndex}:${cellIndex}`}
                            className={cn(
                              "wrap-break-word whitespace-pre-wrap align-top border-r border-border-default px-4 py-3 last:border-r-0 first:w-[35%]",
                              cellIndex === 0 && "font-medium text-text-heading",
                            )}
                          >
                            {cell}
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
                key={block.block_id}
                className={cn("flex flex-col gap-4", depth > 0 && "pl-6")}
              >
                {renderHeading(block.level, block.heading)}
                <RenderEditableBlocks
                  blocks={block.blocks}
                  depth={depth + 1}
                  readOnly={readOnly}
                  onTextChange={onTextChange}
                  onSelection={onSelection}
                />
              </div>
            );
          case "callout":
            return (
              <div
                key={block.block_id}
                className={cn(
                  "rounded-card border px-6 py-4 text-body-lg",
                  block.level === "info"
                    ? "border-brand-border bg-brand-bg"
                    : "border-amber-400/30 bg-amber-400/10",
                )}
              >
                <EditableText
                  target={{ blockId: block.block_id, field: "calloutText" }}
                  value={block.text}
                  placeholder="Callout text"
                  className={
                    block.level === "warning" ? "text-amber-300" : undefined
                  }
                  readOnly={readOnly}
                  onChange={onTextChange}
                  onSelection={onSelection}
                />
              </div>
            );
          case "markdown":
            return (
              <div key={block.block_id} className="flex flex-col gap-2">
                <p className="text-helper font-medium uppercase tracking-wide text-text-muted">
                  Markdown
                </p>
                <EditableText
                  target={{ blockId: block.block_id, field: "markdownText" }}
                  value={block.text}
                  placeholder="Markdown text"
                  readOnly={readOnly}
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
  sectionType,
  revision,
  actor,
  blocks,
  skipFirstHeading = false,
  onChange,
  onRewriteAccepted,
}: EditableSectionContentProps) {
  const [selection, setSelection] = useState<EditableTextSelection | null>(
    null,
  );
  const [selectionHighlightRects, setSelectionHighlightRects] = useState<
    readonly SelectionHighlightRect[]
  >([]);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const presetsQuery = useRewritePresets(sectionType, Boolean(selection));
  const createRewritePreview = useCreateRewritePreviewMutation();
  const isRewriting = createRewritePreview.isPending;
  const presets = filterRewritePresets(
    presetsQuery.data?.items ?? [],
    sectionType,
  );

  const firstBlock = blocks[0];
  const visibleBlocks =
    skipFirstHeading &&
    firstBlock?.type === "heading" &&
    firstBlock.level <= 2
      ? blocks.slice(1)
      : blocks;

  const handleTextChange = (target: EditableTextTarget, value: string) => {
    setSelection(null);
    setSelectionHighlightRects([]);
    setRewriteError(null);
    onChange(updateEditableText(blocks, target, value));
  };

  const handleSelection: EditableSelectionChange = (
    nextSelection,
    highlightRects,
  ) => {
    setSelectionHighlightRects(nextSelection ? (highlightRects ?? []) : []);
    setRewriteError(null);
    setSelection(nextSelection);
  };

  const handleRewrite = async (
    instruction: string,
    presetId: string | null,
  ) => {
    if (!selection || isRewriting) {
      return;
    }

    const request = createRewritePreviewInputFromEditor({
      baseRevision: revision,
      blocks,
      selection,
      actor,
      instruction,
      presetId,
    });
    if (!request.ok) {
      setRewriteError(request.error);
      return;
    }

    setRewriteError(null);

    try {
      const preview = await createRewritePreview.mutateAsync({
        reportServiceId,
        sectionId,
        input: request.input,
      });
      const statusMessage = getRewritePreviewStatusMessage(preview);
      if (statusMessage) {
        setRewriteError(statusMessage);
        return;
      }

      const applied = applyReadyRewritePreview(blocks, preview);
      if (!applied) {
        setRewriteError(REWRITE_PREVIEW_APPLY_FAILED_MESSAGE);
        return;
      }

      onChange(applied.blocks);
      onRewriteAccepted(applied.rewriteId);
      setSelection(null);
      setSelectionHighlightRects([]);
    } catch (error) {
      setRewriteError(getRewritePreviewFailureMessage(error));
    }
  };

  if (visibleBlocks.length === 0) {
    return null;
  }

  return (
    <>
      <RenderEditableBlocks
        blocks={visibleBlocks}
        readOnly={isRewriting}
        onTextChange={handleTextChange}
        onSelection={handleSelection}
      />
      {selection &&
        selectionHighlightRects.length > 0 &&
        createPortal(
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[55]"
          >
            {selectionHighlightRects.map((rect, index) => (
              <span
                key={`${rect.top}:${rect.left}:${index}`}
                className="absolute rounded-sm bg-brand-highlight"
                style={{
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                }}
              />
            ))}
          </div>,
          document.body,
        )}
      {selection && (
        <RewriteWithAiPopover
          selection={selection}
          presets={presets}
          isLoadingPresets={presetsQuery.isLoading}
          presetsError={
            presetsQuery.isError
              ? "Unable to load rewrite presets. You can still enter an instruction."
              : null
          }
          isRewriting={isRewriting}
          errorMessage={rewriteError}
          onClose={() => {
            if (!isRewriting) {
              setSelection(null);
              setSelectionHighlightRects([]);
              setRewriteError(null);
            }
          }}
          onRewrite={handleRewrite}
        />
      )}
    </>
  );
}
