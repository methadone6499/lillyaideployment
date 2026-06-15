"use client";

import { Tabs } from "@/components/ui";
import { useState } from "react";
import { EvidenceTable } from "../EvidenceTable";
import { useEvidence } from "../../hooks/useEvidence";
import { useReportWizardStore } from "../../store/useReportWizardStore";
import type { EvidenceType } from "../../types";

const EVIDENCE_TABS = [
  { id: "clinical" as const, label: "Clinical Evidence" },
  { id: "economic" as const, label: "Economic Evidence" },
];

export function Step3Evidence() {
  const [activeTab, setActiveTab] = useState<EvidenceType>("clinical");
  const filters = useReportWizardStore((s) => s.filters);
  const selectedEvidenceIds = useReportWizardStore(
    (s) => s.selectedEvidenceIds,
  );
  const toggleEvidenceId = useReportWizardStore((s) => s.toggleEvidenceId);
  const setSelectedEvidenceIds = useReportWizardStore(
    (s) => s.setSelectedEvidenceIds,
  );

  const { data: items = [], isLoading } = useEvidence(activeTab, filters);

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
      <EvidenceTable
        items={items}
        selectedIds={selectedEvidenceIds}
        onToggle={toggleEvidenceId}
        onSelectAll={setSelectedEvidenceIds}
      />
    </div>
  );
}
