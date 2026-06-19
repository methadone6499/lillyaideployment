import { createElement, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Block, ReportSectionContent } from "../../types";
import { MarkdownRenderer } from "./MarkdownRenderer";

type SectionContentRendererProps = {
  content: ReportSectionContent;
  /** When true, omits the first block if it is a level-1 or level-2 heading (duplicate of accordion title). */
  skipFirstHeading?: boolean;
};

function renderWithFootnotes(text: string): ReactNode {
  const parts = text.split(/\[\^(\d+)\]/);
  const nodes: ReactNode[] = [];

  for (let index = 0; index < parts.length; index++) {
    if (index % 2 === 0) {
      if (parts[index]) {
        nodes.push(parts[index]);
      }
    } else {
      nodes.push(
        <sup key={index} className="text-xs">
          {parts[index]}
        </sup>,
      );
    }
  }

  return nodes.length === 1 ? nodes[0] : nodes;
}

function headingClassName(level: number): string {
  if (level <= 2) {
    return "text-section-heading font-medium text-text-heading";
  }

  return "font-medium text-text-heading";
}

function renderHeading(level: number, text: string): ReactNode {
  const clampedLevel = Math.min(Math.max(level, 2), 6);

  return createElement(
    `h${clampedLevel}`,
    { className: headingClassName(level) },
    text,
  );
}

function renderBlock(block: Block, key: number): ReactNode {
  switch (block.type) {
    case "heading":
      return <div key={key}>{renderHeading(block.level, block.text)}</div>;

    case "paragraph": {
      const paragraphs = block.text.split("\n\n").filter(Boolean);

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
          {paragraphs.map((paragraph, paragraphIndex) => (
            <p
              key={paragraphIndex}
              className="leading-report whitespace-pre-wrap text-text-body"
            >
              {paragraph}
            </p>
          ))}
        </div>
      );
    }

    case "table":
      return (
        <div key={key} className="w-full">
          <table className="w-full table-fixed border-collapse border border-border-default text-left text-text-body">
            <thead>
              <tr className="border-b border-border-default bg-surface-subtle">
                {block.columns.map((column, columnIndex) => (
                  <th
                    key={columnIndex}
                    className="wrap-break-word whitespace-normal align-top border-r border-border-default px-4 py-3 text-body-lg font-semibold text-text-heading last:border-r-0 first:w-[35%]"
                  >
                    {renderWithFootnotes(column)}
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
                      className={cn(
                        "wrap-break-word whitespace-normal align-top border-r border-border-default px-4 py-3 leading-report last:border-r-0 first:w-[35%]",
                        cellIndex === 0 && "font-medium text-text-heading",
                      )}
                    >
                      {renderWithFootnotes(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "definition":
      return (
        <div key={key} className="flex flex-wrap gap-x-2 text-text-body">
          <span className="font-medium text-text-heading">{block.label}:</span>
          <span className="leading-report">{block.value}</span>
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
                {item}
              </li>
            ))}
          </ul>
        </div>
      );

    case "section":
      return (
        <div key={key} className="flex flex-col gap-4">
          {renderHeading(block.level, block.heading)}
          {renderBlocks(block.blocks, true)}
        </div>
      );

    case "callout":
      return (
        <div
          key={key}
          className={cn(
            "rounded-card border px-6 py-4 text-body-lg leading-report",
            block.level === "info"
              ? "border-brand-border bg-brand-bg text-text-body"
              : "border-amber-400/30 bg-amber-400/10 text-amber-300",
          )}
        >
          {block.text}
        </div>
      );

    case "markdown":
      return (
        <div key={key}>
          <MarkdownRenderer markdown={block.text} />
        </div>
      );

    default:
      return null;
  }
}

function renderBlocks(blocks: Block[], nested = false): ReactNode {
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={nested ? "flex flex-col gap-4" : "flex flex-col gap-8"}>
      {blocks.map((block, blockIndex) => renderBlock(block, blockIndex))}
    </div>
  );
}

export function SectionContentRenderer({
  content,
  skipFirstHeading = false,
}: SectionContentRendererProps) {
  if (content.blocks.length === 0) {
    return null;
  }

  const firstBlock = content.blocks[0];
  const blocks =
    skipFirstHeading &&
    firstBlock?.type === "heading" &&
    firstBlock.level <= 2
      ? content.blocks.slice(1)
      : content.blocks;

  if (blocks.length === 0) {
    return null;
  }

  return renderBlocks(blocks);
}
