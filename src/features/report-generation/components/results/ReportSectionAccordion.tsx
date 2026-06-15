"use client";

import { Badge, StatusPill } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ChevronDownIcon, ChevronUpIcon } from "@/components/ui";
import type { GeneratedReportSection } from "../../types";

type ReportSectionAccordionProps = {
  section: GeneratedReportSection;
  expanded: boolean;
  onToggle: () => void;
};

export function ReportSectionAccordion({
  section,
  expanded,
  onToggle,
}: ReportSectionAccordionProps) {
  const isComplete = section.status === "complete";
  const canExpand = isComplete && section.content;

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
          {section.order}
        </Badge>
        <div className="min-w-0 flex-1">
          <h3 className="text-card-title font-medium text-white">
            {section.title}
          </h3>
          <p className="mt-4 text-helper text-text-muted">
            {section.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-7">
          <StatusPill status={section.status} />
          {canExpand &&
            (expanded ? (
              <ChevronUpIcon />
            ) : (
              <ChevronDownIcon className="size-6" />
            ))}
        </div>
      </button>

      {expanded && section.content && (
        <div className="border-t border-border-default px-8 pb-10 pt-8">
          <div className="flex flex-col gap-8 text-body-lg">
            {section.content.diseaseCode && (
              <div>
                <h4 className="text-section-heading font-medium text-text-heading">
                  Disease code
                </h4>
                <ul className="mt-6 list-disc pl-7 text-text-body">
                  <li>{section.content.diseaseCode}</li>
                </ul>
              </div>
            )}
            {section.content.diseaseDefinition && (
              <div>
                <h4 className="text-section-heading font-medium text-text-heading">
                  Disease Definition
                </h4>
                <p className="mt-6 leading-report text-text-body">
                  {section.content.diseaseDefinition}
                </p>
              </div>
            )}
            {section.content.epidemiology && (
              <div className="flex flex-col gap-8 pl-6">
                {section.content.epidemiology.prevalence && (
                  <div>
                    <h4 className="font-medium text-text-heading">
                      Prevalence
                    </h4>
                    <p className="mt-5 leading-report text-text-body">
                      {section.content.epidemiology.prevalence}
                    </p>
                  </div>
                )}
                {section.content.epidemiology.incidence && (
                  <div>
                    <h4 className="font-medium text-text-heading">
                      Incidence
                    </h4>
                    <p className="mt-5 leading-report text-text-body">
                      {section.content.epidemiology.incidence}
                    </p>
                  </div>
                )}
              </div>
            )}
            {section.content.clinicalFeatures && (
              <div>
                <h4 className="text-section-heading font-medium text-text-heading">
                  Clinical Features
                </h4>
                <p className="mt-6 leading-report text-text-body">
                  {section.content.clinicalFeatures}
                </p>
              </div>
            )}
            {section.content.paragraphs?.map((paragraph, index) => (
              <div key={index}>
                {paragraph.heading && (
                  <h4 className="font-medium text-text-heading">
                    {paragraph.heading}
                  </h4>
                )}
                <p className="mt-5 leading-report text-text-body">
                  {paragraph.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
