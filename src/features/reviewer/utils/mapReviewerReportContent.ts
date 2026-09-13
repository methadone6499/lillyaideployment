import type {
  ReportSectionContent,
  ReportSectionPresentationItem,
} from "@/features/report-generation";
import type {
  ReviewerReportContentBlock,
  ReviewerReportSection,
} from "../types";

function mapReviewerBlock(
  block: ReviewerReportContentBlock,
): ReportSectionContent["blocks"][number] {
  switch (block.type) {
    case "definition":
      return {
        type: "definition",
        label: block.label,
        value: block.value,
      };
    case "heading":
      return {
        type: "heading",
        level: 2,
        text: block.text,
      };
    case "paragraph":
      return {
        type: "paragraph",
        text: block.text,
      };
    case "subsection":
      return {
        type: "section",
        heading: block.heading,
        level: 3,
        blocks: [
          {
            type: "paragraph",
            text: block.body,
          },
        ],
      };
  }
}

export function toReviewerSectionPresentationItems(
  sections: readonly ReviewerReportSection[],
): ReportSectionPresentationItem[] {
  return sections.map((section) => ({
    id: section.id,
    order: section.order,
    title: section.title,
    description: section.description,
    canExpand: true,
    content: {
      blocks: section.blocks.map(mapReviewerBlock),
    },
  }));
}
