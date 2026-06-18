"use client";

import { Tabs } from "@/components/ui";
import { useState } from "react";
import { EvidenceTable } from "../EvidenceTable";
import { useEvidenceDiscovery } from "../../hooks/useEvidenceDiscovery";
import { useReportWizardStore } from "../../store/useReportWizardStore";
import type { EvidenceType } from "../../types";

const EVIDENCE_TABS = [
  { id: "clinical" as const, label: "Clinical Evidence" },
  { id: "economic" as const, label: "Economic Evidence" },
];

export function Step3Evidence() {
  const [activeTab, setActiveTab] = useState<EvidenceType>("clinical");
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
      <Tabs
        tabs={EVIDENCE_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
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
      {items.length > 0 && (
        <EvidenceTable
          items={items}
          selectedPmcids={selectedPmcids}
          onToggle={togglePmcid}
          onSelectAll={setSelectedPmcids}
        />
      )}
    </div>
  );
}
