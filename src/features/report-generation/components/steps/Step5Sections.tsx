"use client";

import { Card, Switch, TextLink } from "@/components/ui";
import { REPORT_SECTION_DEFINITIONS } from "../../constants/reportSections";
import { useReportWizardStore } from "../../store/useReportWizardStore";

export function Step5Sections() {
  const selectedSectionIds = useReportWizardStore(
    (s) => s.selectedSectionIds,
  );
  const toggleSectionId = useReportWizardStore((s) => s.toggleSectionId);
  const selectAllSections = useReportWizardStore((s) => s.selectAllSections);
  const deselectAllSections = useReportWizardStore(
    (s) => s.deselectAllSections,
  );

  const allSectionIds = REPORT_SECTION_DEFINITIONS.map((section) => section.id);

  return (
    <div className="flex flex-col gap-9">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-4">
          <h2 className="text-card-title font-medium text-white">
            Report sections
          </h2>
          <p className="text-helper text-text-muted">
            Based on indication, MoA, and head-to-head trials retrieved.
          </p>
        </div>
        <div className="flex items-center gap-7">
          <TextLink onClick={() => selectAllSections(allSectionIds)}>
            Select All
          </TextLink>
          <TextLink variant="white" onClick={deselectAllSections}>
            Deselect All
          </TextLink>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {REPORT_SECTION_DEFINITIONS.map((section) => {
          const selected = selectedSectionIds.includes(section.id);
          return (
            <Card
              key={section.id}
              variant={selected ? "accent" : "default"}
              className="flex items-center justify-between px-9 py-6"
            >
              <div className="flex flex-col gap-4">
                <h3 className="text-card-title font-medium text-white">
                  {section.title}
                </h3>
                <p className="text-helper text-text-muted">
                  {section.description}
                </p>
              </div>
              <Switch
                checked={selected}
                onChange={() => toggleSectionId(section.id)}
                aria-label={`Toggle ${section.title}`}
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
