"use client";

import { Button, Card, PlusIcon, RadioCircle, TextField } from "@/components/ui";
import { useState } from "react";
import { validateComparatorName } from "../../api/reportApi";
import { useComparators } from "../../hooks/useComparators";
import { useReportWizardStore } from "../../store/useReportWizardStore";

export function Step4Comparators() {
  const drugName = useReportWizardStore((s) => s.drugName);
  const indications = useReportWizardStore((s) => s.indications);
  const selectedComparatorIds = useReportWizardStore(
    (s) => s.selectedComparatorIds,
  );
  const customComparators = useReportWizardStore((s) => s.customComparators);
  const toggleComparatorId = useReportWizardStore(
    (s) => s.toggleComparatorId,
  );
  const addCustomComparator = useReportWizardStore(
    (s) => s.addCustomComparator,
  );

  const [draftName, setDraftName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: comparators = [], isLoading } = useComparators(
    drugName,
    indications,
  );

  const allComparators = [
    ...comparators,
    ...customComparators.map((name) => ({
      id: `custom-${name}`,
      name,
      isCustom: true as const,
    })),
  ];

  const handleAdd = async () => {
    if (!draftName.trim()) return;
    setIsAdding(true);
    try {
      const validated = await validateComparatorName(draftName);
      if (validated) {
        addCustomComparator(validated.name);
        setDraftName("");
      }
    } finally {
      setIsAdding(false);
    }
  };

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

      <div className="flex flex-col gap-6">
        {allComparators.map((comparator) => {
          const selected = selectedComparatorIds.includes(comparator.id);
          return (
            <Card
              key={comparator.id}
              variant={selected ? "accent" : "default"}
              className="flex h-[88px] items-center gap-5 px-7"
            >
              <RadioCircle
                selected={selected}
                onClick={() => toggleComparatorId(comparator.id)}
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
              Spell-checked against drug database
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <TextField
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="e.g. Rybelsus (semaglutide oral)"
              containerClassName="flex-1"
            />
            <Button
              variant="secondary"
              onClick={handleAdd}
              disabled={isAdding || !draftName.trim()}
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
