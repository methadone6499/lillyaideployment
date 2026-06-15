"use client";

import {
  Button,
  Card,
  PlusIcon,
  Switch,
  TextLink,
} from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { fetchReportSections } from "../../api/reportApi";
import { useReportWizardStore } from "../../store/useReportWizardStore";

export function Step5Sections() {
  const selectedSectionIds = useReportWizardStore(
    (s) => s.selectedSectionIds,
  );
  const toggleSectionId = useReportWizardStore((s) => s.toggleSectionId);
  const selectAllSections = useReportWizardStore((s) => s.selectAllSections);
  const deselectAllSections = useReportWizardStore(
    (s) => s.deselectAllSections,
  );

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["report-sections"],
    queryFn: fetchReportSections,
  });

  if (isLoading) {
    return (
      <p className="text-body-lg text-text-muted">Loading sections…</p>
    );
  }

  const allSectionIds = sections.map((s) => s.id);

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
          <TextLink onClick={() => selectAllSections(allSectionIds)}>
            Select All
          </TextLink>
          <TextLink variant="white" onClick={deselectAllSections}>
            Deselect All
          </TextLink>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {sections.map((section) => {
          const selected = selectedSectionIds.includes(section.id);
          return (
            <Card
              key={section.id}
              variant={selected ? "accent" : "default"}
              className="flex items-center justify-between px-9 py-6"
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
                onChange={() => toggleSectionId(section.id)}
                aria-label={`Toggle ${section.title}`}
              />
            </Card>
          );
        })}

        <Card variant="subtle" className="flex flex-col gap-6 p-9 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4">
            <h3 className="text-card-title font-medium text-white">
              Add new section
            </h3>
            <p className="text-helper text-text-muted">
              Enter prompt to explain your custom section
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button variant="secondary" leadingIcon={<PlusIcon />}>
              Generate via AI
            </Button>
            <Button variant="secondary" leadingIcon={<PlusIcon />}>
              Upload Document Template
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
