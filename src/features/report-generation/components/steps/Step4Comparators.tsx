"use client";

import { Button, Card, PlusIcon, RadioCircle, TextField } from "@/components/ui";
import { useState } from "react";
import { useComparatorDiscovery } from "../../hooks/useComparatorDiscovery";
import { useReportWizardStore } from "../../store/useReportWizardStore";

export function Step4Comparators() {
  const reportId = useReportWizardStore((s) => s.reportId);
  const selectedComparators = useReportWizardStore(
    (s) => s.selectedComparators,
  );
  const customComparators = useReportWizardStore((s) => s.customComparators);
  const toggleComparator = useReportWizardStore((s) => s.toggleComparator);
  const addCustomComparator = useReportWizardStore(
    (s) => s.addCustomComparator,
  );

  const [draftName, setDraftName] = useState("");

  const {
    data: suggestions = [],
    isLoading,
    isError,
    error,
  } = useComparatorDiscovery(reportId);

  const customOnly = customComparators.filter(
    (name) => !suggestions.includes(name),
  );

  const allComparators = [
    ...suggestions.map((name) => ({ name, isCustom: false as const })),
    ...customOnly.map((name) => ({ name, isCustom: true as const })),
  ];

  const handleAdd = () => {
    const name = draftName.trim();
    if (!name) return;
    addCustomComparator(name);
    setDraftName("");
  };

  if (!reportId) {
    return (
      <p className="text-body-lg text-red-400" role="alert">
        Report is not configured. Go back to Filters and continue again.
      </p>
    );
  }

  if (isLoading) {
    return (
      <p className="text-body-lg text-text-muted">Loading comparators…</p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-card-title font-medium text-white">Comparators</h2>
        <p className="text-helper text-text-muted">
          Based on indication, MoA, and head-to-head trials retrieved.
        </p>
      </div>

      {isError && (
        <p className="text-body-lg text-amber-300" role="status">
          {error instanceof Error
            ? error.message
            : "Failed to load comparator suggestions. You can add comparators manually."}
        </p>
      )}

      {allComparators.length === 0 && (
        <p className="text-body-lg text-text-muted">
          No comparator suggestions were returned. Add comparators manually
          below.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {allComparators.map((comparator) => {
          const selected = selectedComparators.includes(comparator.name);
          return (
            <Card
              key={comparator.name}
              variant={selected ? "accent" : "default"}
              className="flex h-[88px] items-center gap-5 px-7"
            >
              <RadioCircle
                selected={selected}
                onClick={() => toggleComparator(comparator.name)}
                aria-label={`Select ${comparator.name}`}
              />
              <span className="text-card-title font-medium text-white">
                {comparator.name}
              </span>
            </Card>
          );
        })}

        <Card variant="subtle" className="p-9">
          <div className="flex flex-col gap-4">
            <h3 className="text-card-title font-medium text-white">
              Add custom comparator
            </h3>
            <p className="text-helper text-text-muted">
              Enter a comparator name to include it in the report.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <TextField
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="e.g. Rybelsus (semaglutide oral)"
              containerClassName="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
            <Button
              variant="secondary"
              onClick={handleAdd}
              disabled={!draftName.trim()}
              leadingIcon={<PlusIcon />}
              className="shrink-0"
            >
              Add
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
