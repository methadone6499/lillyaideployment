"use client";

import { Badge, StatusPill } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ChevronDownIcon, ChevronUpIcon } from "@/components/ui";
import { useReportSection } from "../../hooks/useGenerateReport";
import type { ReportStatusSection, SectionType } from "../../types";
import { mapSectionStatusToPill } from "../../utils/mapSectionStatusToPill";
import { SectionContentRenderer } from "./SectionContentRenderer";

export type ReportSectionAccordionItem = {
  section: ReportStatusSection;
  order: number;
  title: string;
  description: string;
  accordionKey: string;
};

type ReportSectionAccordionProps = {
  reportId: string;
  item: ReportSectionAccordionItem;
  expanded: boolean;
  onToggle: () => void;
};

export function ReportSectionAccordion({
  reportId,
  item,
  expanded,
  onToggle,
}: ReportSectionAccordionProps) {
  const { section, order, title, description } = item;
  const isComplete = section.status === "completed";
  const canExpand = isComplete && Boolean(section.section_id);

  const {
    data: sectionContent,
    isLoading: isContentLoading,
    isError: isContentError,
    error: contentError,
  } = useReportSection(
    reportId,
    section.section_id,
    canExpand && expanded,
  );

  return (
    <div
      className={cn(
        "rounded-card border",
        expanded
          ? "border-brand-border bg-brand-bg"
          : "border-border-default bg-surface-default",
      )}
    >
      <button
        type="button"
        onClick={canExpand ? onToggle : undefined}
        className={cn(
          "flex w-full items-center gap-5 px-8 py-6 text-left",
          !canExpand && "cursor-default",
        )}
      >
        <Badge variant="brand" className="size-12 shrink-0">
          {order}
        </Badge>
        <div className="min-w-0 flex-1">
          <h3 className="text-card-title font-medium text-white">{title}</h3>
          <p className="mt-4 text-helper text-text-muted">{description}</p>
          {section.error && (
            <p className="mt-3 text-helper text-red-400" role="alert">
              {section.error}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-7">
          <StatusPill status={mapSectionStatusToPill(section.status)} />
          {canExpand &&
            (expanded ? (
              <ChevronUpIcon />
            ) : (
              <ChevronDownIcon className="size-6" />
            ))}
        </div>
      </button>

      {expanded && canExpand && (
        <div className="border-t border-border-default px-8 pb-10 pt-8">
          {isContentLoading && (
            <p className="text-body-lg text-text-muted">Loading section…</p>
          )}
          {isContentError && (
            <p className="text-body-lg text-red-400" role="alert">
              {contentError instanceof Error
                ? contentError.message
                : "Unable to load section content."}
            </p>
          )}
          {sectionContent?.content !== undefined && (
            <div className="text-body-lg">
              <SectionContentRenderer content={sectionContent.content} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function getSectionAccordionKey(
  section: ReportStatusSection,
  sectionType: SectionType,
): string {
  return section.section_id ?? sectionType;
}
