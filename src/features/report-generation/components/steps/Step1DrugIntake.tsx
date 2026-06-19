"use client";

import { Card, TextField, TextLink } from "@/components/ui";
import { useDrugSuggestion } from "../../hooks/useDrugSuggestion";
import { useReportWizardStore } from "../../store/useReportWizardStore";

export function Step1DrugIntake() {
  const drugName = useReportWizardStore((s) => s.drugName);
  const indications = useReportWizardStore((s) => s.indications);
  const setDrugName = useReportWizardStore((s) => s.setDrugName);
  const setIndications = useReportWizardStore((s) => s.setIndications);

  const { data: validation } = useDrugSuggestion(drugName, indications);

  const showSuggestion =
    validation &&
    !validation.accepted &&
    validation.suggestion !== null;

  return (
    <Card variant="default" className="w-full max-w-[744px] p-6">
      <div className="flex flex-col gap-8">
        <TextField
          label="Drug name"
          required
          value={drugName}
          onChange={(e) => setDrugName(e.target.value)}
          placeholder="Enter drug name"
        />
        {showSuggestion && (
          <p className="-mt-4 text-input text-text-muted">
            Do you mean{" "}
            <TextLink
              className="text-input"
              onClick={() => setDrugName(validation.suggestion!)}
            >
              {validation.suggestion}
            </TextLink>
            ?
          </p>
        )}
        <TextField
          label="Indication(s)"
          required
          value={indications}
          onChange={(e) => setIndications(e.target.value)}
          placeholder="Enter indication"
        />
      </div>
    </Card>
  );
}
