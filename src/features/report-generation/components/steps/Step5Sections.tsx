"use client";

import { useEffect, useState } from "react";
import { Button, Card, Switch, TextLink } from "@/components/ui";
import { cn } from "@/lib/cn";
import { REPORT_SECTION_DEFINITIONS } from "../../constants/reportSections";
import { useListCustomSections } from "../../hooks/useGenerateReport";
import { useReportWizardStore } from "../../store/useReportWizardStore";
import {
  getCustomSectionErrorMessage,
  mapCustomSpecsToWizard,
} from "../../utils/customSections";
import {
  getSectionUnavailableReason,
  getToggleableSectionIds,
  isSectionAvailable,
} from "../../utils/sectionOrdering";
import { AddCustomSectionCard } from "./AddCustomSectionCard";
import { CustomSectionCard } from "./CustomSectionCard";
import { ReportCalculatorModal } from "../ReportCalculatorModal";
import {
  getReportCalculatorModuleLabels,
  hasReportCalculatorModules,
} from "../../utils/reportCalculator";

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
  const reportCalculatorDraft = useReportWizardStore(
    (s) => s.reportCalculatorDraft,
  );
  const setReportCalculatorDraft = useReportWizardStore(
    (s) => s.setReportCalculatorDraft,
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
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const {
    data: listedCustomSections,
    isError: isCustomSectionsError,
    error: customSectionsError,
  } = useListCustomSections(reportServiceId);

  const sectionInputs = {
    selectedClinicalArticleIds,
    selectedEconomicArticleIds,
    selectedComparators,
    hasReportCalculator: hasReportCalculatorModules(reportCalculatorDraft),
  };
  const calculatorModuleLabels = getReportCalculatorModuleLabels(
    reportCalculatorDraft,
  );

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
          const isEconomic = section.id === "economic";
          const available = isSectionAvailable(
            section.id,
            sectionInputs,
            selectedSectionIds,
          );
          const selected =
            available && selectedSectionIds.includes(section.id);
          const unavailableReason = getSectionUnavailableReason(
            section.id,
            sectionInputs,
            selectedSectionIds,
          );

          return (
            <Card
              key={section.id}
              variant={selected ? "accent" : "default"}
              className="px-9 py-6"
            >
              <div className="flex min-h-16 items-center justify-between gap-6">
                <div className="flex min-w-0 flex-col gap-2">
                  <h3 className="text-card-title leading-7 font-medium text-white">
                    {section.title}
                  </h3>
                  <p className="text-helper leading-5 text-text-muted">
                    {section.description}
                  </p>
                </div>
                <Switch
                  checked={selected}
                  disabled={
                    !available ||
                    (isEconomic && sectionInputs.hasReportCalculator)
                  }
                  onChange={() => {
                    if (available) {
                      toggleSectionId(section.id);
                    }
                  }}
                  className={cn(!available && "cursor-not-allowed")}
                  aria-label={`Toggle ${section.title}`}
                />
              </div>
              {unavailableReason ? (
                <p className="mt-4 text-helper leading-5 text-text-muted">
                  {unavailableReason}
                </p>
              ) : null}
              {isEconomic ? (
                <div className="mt-6 flex flex-col gap-4 border-t border-border-subtle pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-label font-medium text-text-heading">
                      Calculated analysis
                    </p>
                    <p className="mt-1 text-helper leading-5 text-text-muted">
                      {calculatorModuleLabels.length > 0
                        ? `${calculatorModuleLabels.join(", ")} configured for this report.`
                        : "Optional. Add dosing, cost, or budget-impact calculations."}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="small" className="shrink-0"
                    onClick={() => setCalculatorOpen(true)}
                  >
                    {calculatorModuleLabels.length > 0
                      ? "Edit calculation inputs"
                      : "Add calculation inputs"}
                  </Button>
                </div>
              ) : null}
            </Card>
          );
        })}
        {isCustomSectionsError && (
          <p className="text-helper text-amber-300" role="status">
            {getCustomSectionErrorMessage(customSectionsError, "load")}
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

      {calculatorOpen ? (
        <ReportCalculatorModal
          draft={reportCalculatorDraft}
          comparators={selectedComparators}
          onClose={() => setCalculatorOpen(false)}
          onSave={setReportCalculatorDraft}
        />
      ) : null}
    </div>
  );
}
