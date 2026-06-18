export const reportQueryKeys = {
  root: ["report"] as const,
  byReport: (reportId: string) => ["report", reportId] as const,
  clinicalArticles: (reportId: string) =>
    ["report", reportId, "clinical-articles"] as const,
  economicArticles: (reportId: string) =>
    ["report", reportId, "economic-articles"] as const,
  comparators: (reportId: string) =>
    ["report", reportId, "comparators"] as const,
  status: (reportId: string) => ["report", reportId, "status"] as const,
  section: (reportId: string, sectionId: string) =>
    ["report", reportId, "section", sectionId] as const,
};
