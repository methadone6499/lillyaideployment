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
};
