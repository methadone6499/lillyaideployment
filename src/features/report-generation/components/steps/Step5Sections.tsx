"use client";

import { useEffect } from "react";
import { Card, Switch, TextLink } from "@/components/ui";
import { cn } from "@/lib/cn";
import { REPORT_SECTION_DEFINITIONS } from "../../constants/reportSections";
import { useReportWizardStore } from "../../store/useReportWizardStore";
import {
  getToggleableSectionIds,
  isSectionAvailable,
} from "../../utils/sectionOrdering";

export function Step5Sections() {
  const selectedSectionIds = useReportWizardStore(
    (s) => s.selectedSectionIds,
  );
  const selectedClinicalPmcids = useReportWizardStore(
    (s) => s.selectedClinicalPmcids,
  );
  const selectedEconomicPmcids = useReportWizardStore(
    (s) => s.selectedEconomicPmcids,
  );
  const selectedComparators = useReportWizardStore(
    (s) => s.selectedComparators,
  );
  const toggleSectionId = useReportWizardStore((s) => s.toggleSectionId);
  const selectAllSections = useReportWizardStore((s) => s.selectAllSections);
  const deselectAllSections = useReportWizardStore(
    (s) => s.deselectAllSections,
  );
  const reconcileSectionsAtStep5 = useReportWizardStore(
    (s) => s.reconcileSectionsAtStep5,
  );

  const sectionInputs = {
    selectedClinicalPmcids,
    selectedEconomicPmcids,
    selectedComparators,
  };

  useEffect(() => {
    reconcileSectionsAtStep5();
  }, [reconcileSectionsAtStep5]);

  const toggleableSectionIds = getToggleableSectionIds(sectionInputs);

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
          <TextLink onClick={() => selectAllSections(toggleableSectionIds)}>
            Select All
          </TextLink>
          <TextLink variant="white" onClick={deselectAllSections}>
            Deselect All
          </TextLink>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {REPORT_SECTION_DEFINITIONS.map((section) => {
          const available = isSectionAvailable(section.id, sectionInputs);
          const selected =
            available && selectedSectionIds.includes(section.id);

          return (
            <Card
              key={section.id}
              variant={selected ? "accent" : "default"}
              className={cn(
                "flex items-center justify-between px-9 py-6",
                !available && "opacity-60",
              )}
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
                onChange={() => {
                  if (available) {
                    toggleSectionId(section.id);
                  }
                }}
                className={cn(!available && "cursor-not-allowed opacity-50")}
                aria-label={`Toggle ${section.title}`}
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
