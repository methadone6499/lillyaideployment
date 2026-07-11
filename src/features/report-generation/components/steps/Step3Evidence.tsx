"use client";

import { Tabs } from "@/components/ui";
import { useCallback, useMemo, useState } from "react";
import { EvidenceTable } from "../EvidenceTable";
import { EvidenceTextFilter } from "../EvidenceTextFilter";
import { useEvidenceDiscovery } from "../../hooks/useEvidenceDiscovery";
import { useReportWizardStore } from "../../store/useReportWizardStore";
import type { EvidenceType, TextAvailabilityFilter } from "../../types";
import { matchesTextAvailabilityFilter } from "../../utils/getTextAvailability";

const EVIDENCE_TABS = [
  { id: "clinical" as const, label: "Clinical Evidence" },
  { id: "economic" as const, label: "Economic Evidence" },
];

export function Step3Evidence() {
  const [activeTab, setActiveTab] = useState<EvidenceType>("clinical");
  const [textAvailabilityFilter, setTextAvailabilityFilter] =
    useState<TextAvailabilityFilter>("full_text");
  const reportId = useReportWizardStore((s) => s.reportId);
  const selectedClinicalPmcids = useReportWizardStore(
    (s) => s.selectedClinicalPmcids,
  );
  const selectedEconomicPmcids = useReportWizardStore(
    (s) => s.selectedEconomicPmcids,
  );
  const toggleClinicalPmcid = useReportWizardStore(
    (s) => s.toggleClinicalPmcid,
  );
  const toggleEconomicPmcid = useReportWizardStore(
    (s) => s.toggleEconomicPmcid,
  );
  const setSelectedClinicalPmcids = useReportWizardStore(
    (s) => s.setSelectedClinicalPmcids,
  );
  const setSelectedEconomicPmcids = useReportWizardStore(
    (s) => s.setSelectedEconomicPmcids,
  );

  const isClinical = activeTab === "clinical";
  const selectedPmcids = isClinical
    ? selectedClinicalPmcids
    : selectedEconomicPmcids;
  const togglePmcid = isClinical ? toggleClinicalPmcid : toggleEconomicPmcid;
  const setSelectedPmcids = isClinical
    ? setSelectedClinicalPmcids
    : setSelectedEconomicPmcids;

  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useEvidenceDiscovery(reportId, activeTab);

  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        matchesTextAvailabilityFilter(item, textAvailabilityFilter),
      ),
    [items, textAvailabilityFilter],
  );

  const handleSelectAll = useCallback(
    (visiblePmcids: string[]) => {
      if (visiblePmcids.length === 0) {
        const visibleSelectable = new Set(
          filteredItems.flatMap((item) => (item.pmcid ? [item.pmcid] : [])),
        );
        setSelectedPmcids(
          selectedPmcids.filter((pmcid) => !visibleSelectable.has(pmcid)),
        );
        return;
      }

      setSelectedPmcids([...new Set([...selectedPmcids, ...visiblePmcids])]);
    },
    [filteredItems, selectedPmcids, setSelectedPmcids],
  );

  if (!reportId) {
    return (
      <p className="text-body-lg text-red-400" role="alert">
        Report is not configured. Go back to Filters and continue again.
      </p>
    );
  }

  if (isLoading) {
    return (
      <p className="text-body-lg text-text-muted">Loading evidence…</p>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-center justify-between">
        <Tabs
          tabs={EVIDENCE_TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <EvidenceTextFilter
          value={textAvailabilityFilter}
          onChange={setTextAvailabilityFilter}
        />
      </div>
      {isError && (
        <p className="text-body-lg text-amber-300" role="status">
          {error instanceof Error
            ? error.message
            : "Failed to load evidence. You can continue with manual selections later."}
        </p>
      )}
      {items.length === 0 && !isError && (
        <p className="text-body-lg text-text-muted">
          No articles were discovered for this tab. You can continue without
          selecting evidence.
        </p>
      )}
      {items.length > 0 && filteredItems.length === 0 && !isError && (
        <p className="text-body-lg text-text-muted">
          No articles match the selected text availability filter.
        </p>
      )}
      {filteredItems.length > 0 && (
        <EvidenceTable
          items={filteredItems}
          selectedPmcids={selectedPmcids}
          onToggle={togglePmcid}
          onSelectAll={handleSelectAll}
        />
      )}
    </div>
  );
}
