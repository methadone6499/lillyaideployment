"use client";

import { Button, PlusIcon, Tabs } from "@/components/ui";
import { useCallback, useMemo, useState } from "react";
import { ArticleUploadDialog } from "../ArticleUploadDialog";
import { EvidenceTable } from "../EvidenceTable";
import { EvidenceTextFilter } from "../EvidenceTextFilter";
import { useEvidenceDiscovery } from "../../hooks/useEvidenceDiscovery";
import { useReportWizardStore } from "../../store/useReportWizardStore";
import type {
  ArticleCandidate,
  EvidenceType,
  TextAvailabilityFilter,
} from "../../types";
import { getArticleUploadSelectionId } from "../../utils/articleUploads";
import { getArticleSelectionId } from "../../utils/getArticleSelectionId";
import { matchesTextAvailabilityFilter } from "../../utils/getTextAvailability";

const EVIDENCE_TABS = [
  { id: "clinical" as const, label: "Clinical Evidence" },
  { id: "economic" as const, label: "Economic Evidence" },
];

export function Step3Evidence() {
  const [activeTab, setActiveTab] = useState<EvidenceType>("clinical");
  const [textAvailabilityFilter, setTextAvailabilityFilter] =
    useState<TextAvailabilityFilter>("all");
  const [uploadTarget, setUploadTarget] = useState<
    ArticleCandidate | "manual" | null
  >(null);
  const reportServiceId = useReportWizardStore((s) => s.reportServiceId);
  const selectedClinicalArticleIds = useReportWizardStore(
    (s) => s.selectedClinicalArticleIds,
  );
  const selectedEconomicArticleIds = useReportWizardStore(
    (s) => s.selectedEconomicArticleIds,
  );
  const toggleClinicalArticleId = useReportWizardStore(
    (s) => s.toggleClinicalArticleId,
  );
  const toggleEconomicArticleId = useReportWizardStore(
    (s) => s.toggleEconomicArticleId,
  );
  const setSelectedClinicalArticleIds = useReportWizardStore(
    (s) => s.setSelectedClinicalArticleIds,
  );
  const setSelectedEconomicArticleIds = useReportWizardStore(
    (s) => s.setSelectedEconomicArticleIds,
  );
  const articleUploads = useReportWizardStore((s) => s.articleUploads);
  const upsertArticleUpload = useReportWizardStore(
    (s) => s.upsertArticleUpload,
  );
  const removeArticleUpload = useReportWizardStore(
    (s) => s.removeArticleUpload,
  );

  const isClinical = activeTab === "clinical";
  const selectedArticleIds = isClinical
    ? selectedClinicalArticleIds
    : selectedEconomicArticleIds;
  const toggleArticleId = isClinical
    ? toggleClinicalArticleId
    : toggleEconomicArticleId;
  const setSelectedArticleIds = isClinical
    ? setSelectedClinicalArticleIds
    : setSelectedEconomicArticleIds;

  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useEvidenceDiscovery(reportServiceId, activeTab);

  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        matchesTextAvailabilityFilter(item, textAvailabilityFilter),
      ),
    [items, textAvailabilityFilter],
  );
  const visibleUploads = useMemo(
    () => articleUploads.filter((upload) => upload.bucket === activeTab),
    [activeTab, articleUploads],
  );

  const handleSelectAll = useCallback(
    (visibleIds: string[]) => {
      if (visibleIds.length === 0) {
        const visibleSelectable = new Set(
          filteredItems.map(getArticleSelectionId),
        );
        setSelectedArticleIds(
          selectedArticleIds.filter((id) => !visibleSelectable.has(id)),
        );
        return;
      }

      setSelectedArticleIds([
        ...new Set([...selectedArticleIds, ...visibleIds]),
      ]);
    },
    [filteredItems, selectedArticleIds, setSelectedArticleIds],
  );

  if (!reportServiceId) {
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs
          tabs={EVIDENCE_TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <div className="flex flex-wrap items-center gap-4">
          <EvidenceTextFilter
            value={textAvailabilityFilter}
            onChange={setTextAvailabilityFilter}
          />
          <Button
            variant="secondary"
            className="h-12"
            leadingIcon={<PlusIcon />}
            onClick={() => setUploadTarget("manual")}
          >
            Upload article PDF
          </Button>
        </div>
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
      {visibleUploads.length > 0 ? (
        <div className="rounded-card border border-brand-border bg-brand-bg px-6 py-5">
          <h3 className="text-card-title font-medium text-text-heading">
            Uploaded article PDFs
          </h3>
          <div className="mt-4 flex flex-col gap-3">
            {visibleUploads.map((upload) => {
              const selectionId = getArticleUploadSelectionId(upload);
              const selected = selectedArticleIds.includes(selectionId);
              return (
                <div
                  key={upload.upload_id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-border-default bg-surface-subtle px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-label font-medium text-white">
                      {upload.fileName}
                    </p>
                    <p className="mt-1 text-helper text-text-muted">
                      {upload.pmcid || upload.pmid} · {upload.match_status.replaceAll("_", " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => toggleArticleId(selectionId)}
                      className="text-label font-medium text-brand hover:text-brand/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      {selected ? "Deselect" : "Select"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeArticleUpload(upload.upload_id)}
                      className="text-label text-text-muted hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      Detach upload
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {filteredItems.length > 0 && (
        <EvidenceTable
          items={filteredItems}
          selectedIds={selectedArticleIds}
          onToggle={toggleArticleId}
          onSelectAll={handleSelectAll}
          onUploadArticle={setUploadTarget}
        />
      )}
      {uploadTarget ? (
        <ArticleUploadDialog
          key={
            uploadTarget === "manual"
              ? `${activeTab}:manual`
              : `${activeTab}:${getArticleSelectionId(uploadTarget)}`
          }
          reportServiceId={reportServiceId}
          bucket={activeTab}
          article={uploadTarget === "manual" ? undefined : uploadTarget}
          onAccepted={(upload) => {
            upsertArticleUpload(upload);
            setUploadTarget(null);
          }}
          onClose={() => setUploadTarget(null)}
        />
      ) : null}
    </div>
  );
}
