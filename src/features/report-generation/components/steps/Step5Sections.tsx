"use client";

import { useEffect } from "react";
import { Card, Switch, TextLink } from "@/components/ui";
import { cn } from "@/lib/cn";
import { REPORT_SECTION_DEFINITIONS } from "../../constants/reportSections";
import { useListCustomSections } from "../../hooks/useGenerateReport";
import { useReportWizardStore } from "../../store/useReportWizardStore";
import {
  getCustomSectionErrorMessage,
  mapCustomSpecsToWizard,
} from "../../utils/customSections";
import {
  getToggleableSectionIds,
  isSectionAvailable,
} from "../../utils/sectionOrdering";
import { AddCustomSectionCard } from "./AddCustomSectionCard";
import { CustomSectionCard } from "./CustomSectionCard";

export function Step5Sections() {
  const selectedSectionIds = useReportWizardStore(
    (s) => s.selectedSectionIds,
  );
  const selectedClinicalArticleIds = useReportWizardStore(
    (s) => s.selectedClinicalArticleIds,
  );
  const selectedEconomicArticleIds = useReportWizardStore(
    (s) => s.selectedEconomicArticleIds,
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
  const reportServiceId = useReportWizardStore((s) => s.reportServiceId);
  const customSections = useReportWizardStore((s) => s.customSections);
  const setCustomSections = useReportWizardStore((s) => s.setCustomSections);

  const {
    data: listedCustomSections,
    isError: isCustomSectionsError,
    error: customSectionsError,
  } = useListCustomSections(reportServiceId);

  const sectionInputs = {
    selectedClinicalArticleIds,
    selectedEconomicArticleIds,
    selectedComparators,
  };

  useEffect(() => {
    reconcileSectionsAtStep5();
  }, [reconcileSectionsAtStep5]);

  useEffect(() => {
    if (!listedCustomSections) {
      return;
    }
    setCustomSections(mapCustomSpecsToWizard(listedCustomSections.sections));
  }, [listedCustomSections, setCustomSections]);

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
        {REPORT_SECTION_DEFINITIONS.filter(
          (section) => section.id !== "compliance",
        ).map((section) => {
          const available = isSectionAvailable(
            section.id,
            sectionInputs,
            selectedSectionIds,
          );
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
                disabled={!available}
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
        {isCustomSectionsError && (
          <p className="text-helper text-amber-300" role="status">
            {getCustomSectionErrorMessage(customSectionsError)}
          </p>
        )}
        {customSections.map((section, index) => (
          <CustomSectionCard
            key={section.customId}
            section={section}
            index={index}
            reportServiceId={reportServiceId}
          />
        ))}
        <AddCustomSectionCard />
      </div>
    </div>
  );
}
