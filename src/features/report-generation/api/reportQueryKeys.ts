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
  pdfQueue: (reportServiceId: string) =>
    ["report", reportServiceId, "pdf-queue"] as const,
  pptxExportMutation: ["report", "pptx-export-mutation"] as const,
  pptxDownloadMutation: ["report", "pptx-download-mutation"] as const,
  pptxStatus: (reportServiceId: string) =>
    ["report", reportServiceId, "pptx-status"] as const,
  customSectionMutation: ["report", "custom-section-mutation"] as const,
  customSections: (reportServiceId: string) =>
    ["report", reportServiceId, "custom-sections"] as const,
};
