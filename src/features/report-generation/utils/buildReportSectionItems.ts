import type {
  ReportSectionContent,
  ReportStatusSection,
  SectionStatus,
  SectionType,
} from "../types";
import {
  getReportSectionDefinition,
  isCustomSectionType,
  isWizardSectionId,
  mergeViewerSectionIds,
} from "./sectionOrdering";

export type ReportSectionAccordionItem = {
  id: string;
  accordionKey: string;
  section: ReportStatusSection;
  order: number;
  title: string;
  description: string;
  error?: string | null;
  status: SectionStatus;
  canExpand: boolean;
  pendingContext?: string[];
  localContent?: ReportSectionContent;
};

export function getSectionAccordionKey(
  section: ReportStatusSection,
  sectionType: SectionType,
): string {
  return section.section_id ?? sectionType;
}

export function canExpandReportSection(
  section: Pick<ReportStatusSection, "status" | "section_id">,
  hasLocalContent = false,
): boolean {
  const isReady =
    section.status === "completed" ||
    section.status === "partially_completed";

  return isReady && (hasLocalContent || Boolean(section.section_id));
}

export function buildReportSectionItems(
  statusSections: ReportStatusSection[],
  selectedSectionIds: string[],
  customSectionTitles: readonly string[] = [],
): ReportSectionAccordionItem[] {
  const sectionsByType = new Map<string, ReportStatusSection>(
    statusSections.map((section) => [section.section_type, section]),
  );

  const outlineIds = mergeViewerSectionIds(selectedSectionIds, statusSections);
  const items: ReportSectionAccordionItem[] = [];
  let customTitleIndex = 0;

  outlineIds.forEach((sectionId) => {
    const isCustom = isCustomSectionType(sectionId);
    const fallbackCustomTitle = isCustom
      ? customSectionTitles[customTitleIndex]
      : undefined;
    if (isCustom) {
      customTitleIndex += 1;
    }

    const section = sectionsByType.get(sectionId);
    if (!section) {
      return;
    }

    const definition = isWizardSectionId(sectionId)
      ? getReportSectionDefinition(sectionId)
      : undefined;
    const accordionKey = getSectionAccordionKey(section, section.section_type);

    items.push({
      id: accordionKey,
      accordionKey,
      section,
      order: items.length + 1,
      title:
        section.display_name ??
        fallbackCustomTitle ??
        definition?.title ??
        sectionId,
      description: isCustom ? "" : (definition?.description ?? ""),
      error: section.error,
      status: section.status,
      canExpand: canExpandReportSection(section, false),
      pendingContext: section.pending_context,
    });
  });

  return items;
}
