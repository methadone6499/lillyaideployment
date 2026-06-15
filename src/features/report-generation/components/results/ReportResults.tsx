"use client";

import {
  ArrowNarrowLeftIcon,
  ArrowNarrowRightIcon,
  Button,
  PlusIcon,
} from "@/components/ui";
import { useState } from "react";
import { useReportJobStatus } from "../../hooks/useGenerateReport";
import { useReportWizardStore } from "../../store/useReportWizardStore";
import { ReportSectionAccordion } from "./ReportSectionAccordion";

export function ReportResults() {
  const generationJobId = useReportWizardStore((s) => s.generationJobId);
  const setStep = useReportWizardStore((s) => s.setStep);
  const resetWizard = useReportWizardStore((s) => s.resetWizard);

  const { data: jobStatus, isLoading } = useReportJobStatus(generationJobId);
  const [expandedId, setExpandedId] = useState<string | null>(
    "disease-overview",
  );

  if (isLoading || !jobStatus) {
    return (
      <p className="text-body-lg text-text-muted">Generating report…</p>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-7">
          <h1 className="text-page-title font-medium text-text-heading">
            {jobStatus.reportTitle}
          </h1>
          <p className="text-body-lg text-text-body">
            Evidence Report - Generated on {jobStatus.generatedAt}
          </p>
        </div>
        <Button
          variant="secondary"
          leadingIcon={<PlusIcon />}
          onClick={() => setStep(2)}
        >
          Filters
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {jobStatus.sections.map((section) => (
          <ReportSectionAccordion
            key={section.id}
            section={section}
            expanded={expandedId === section.id}
            onToggle={() =>
              setExpandedId(
                expandedId === section.id ? null : section.id,
              )
            }
          />
        ))}
      </div>

      <footer className="mt-auto border-t border-border-default pt-7">
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => {
              resetWizard();
              setStep(1);
            }}
            leadingIcon={<ArrowNarrowLeftIcon />}
            className="pl-3.5 pr-5"
          >
            Back to Evaluation
          </Button>
          <Button
            trailingIcon={<ArrowNarrowRightIcon />}
            className="pl-5 pr-3"
            onClick={() => window.alert("Report download would start here.")}
          >
            Get Report
          </Button>
        </div>
      </footer>
    </div>
  );
}
