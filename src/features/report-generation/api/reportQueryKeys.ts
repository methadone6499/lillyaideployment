export const reportQueryKeys = {
  root: ["report"] as const,
  drugValidation: (drug: string, disease: string) =>
    ["report", "drug-validation", drug, disease] as const,
  byReport: (reportServiceId: string) => ["report", reportServiceId] as const,
  clinicalArticles: (reportServiceId: string) =>
    ["report", reportServiceId, "clinical-articles"] as const,
  economicArticles: (reportServiceId: string) =>
    ["report", reportServiceId, "economic-articles"] as const,
  comparators: (reportServiceId: string) =>
    ["report", reportServiceId, "comparators"] as const,
  status: (reportServiceId: string) =>
    ["report", reportServiceId, "status"] as const,
  section: (
    reportServiceId: string,
    sectionId: string,
    sectionStatus?: string,
    reportStatus?: string,
  ) =>
    [
      "report",
      reportServiceId,
      "section",
      sectionId,
      sectionStatus ?? "unknown",
      reportStatus ?? "unknown",
    ] as const,
  pptxExportMutation: ["report", "pptx-export-mutation"] as const,
  pptxDownloadMutation: ["report", "pptx-download-mutation"] as const,
  pptxStatus: (reportServiceId: string) =>
    ["report", reportServiceId, "pptx-status"] as const,
  customSectionMutation: ["report", "custom-section-mutation"] as const,
  customSections: (reportServiceId: string) =>
    ["report", reportServiceId, "custom-sections"] as const,
  rewritePresets: (sectionType: string) =>
    ["report", "rewrite-presets", sectionType] as const,
  editableDocument: (reportServiceId: string, sectionId: string) =>
    ["report", reportServiceId, "editable-document", sectionId] as const,
  sectionRevisions: (reportServiceId: string, sectionId: string) =>
    ["report", reportServiceId, "revisions", sectionId] as const,
  sectionRevision: (
    reportServiceId: string,
    sectionId: string,
    revision: number,
  ) =>
    ["report", reportServiceId, "revisions", sectionId, revision] as const,
  rewritePreviewMutation: ["report", "rewrite-preview-mutation"] as const,
  saveEditableDocumentMutation: [
    "report",
    "save-editable-document-mutation",
  ] as const,
  restoreRevisionMutation: ["report", "restore-revision-mutation"] as const,
};
