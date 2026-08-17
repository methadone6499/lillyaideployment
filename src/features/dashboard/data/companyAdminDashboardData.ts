import { companyReportsSchema } from "../schemas/companyAdminDashboardSchemas";

const visibleCompanyReports = [
  {
    id: "company-report-1",
    title: "Panadol - Mild Fever",
    generatedBy: "Bilal A.",
    userEmail: "bilal@example.com",
    updatedAt: "2025-05-27T00:08:00Z",
    status: "completed",
  },
  {
    id: "company-report-2",
    title: "Nusinersen - Spinal Muscular Atrophy",
    generatedBy: "Ahmad M.",
    userEmail: "ahmad@example.com",
    updatedAt: "2025-05-27T00:08:00Z",
    status: "sent_for_review",
  },
  {
    id: "company-report-3",
    title: "Pembrolizumab - Non-Small Cell Lung Cancer",
    generatedBy: "Abdullah A.",
    userEmail: "abdullah@example.com",
    updatedAt: "2025-05-27T00:08:00Z",
    status: "in_progress",
  },
  {
    id: "company-report-4",
    title: "Metformin - Type 2 Diabetes",
    generatedBy: "Huzaima A.",
    userEmail: "huzaima@example.com",
    updatedAt: "2025-05-27T00:08:00Z",
    status: "completed",
  },
  {
    id: "company-report-5",
    title: "Dupilumab - Atopic Dermatitis",
    generatedBy: "Usman A.",
    userEmail: "usman@example.com",
    updatedAt: "2025-05-27T00:08:00Z",
    status: "reviewed",
  },
  {
    id: "company-report-6",
    title: "Dapagliflozin - Heart Failure",
    generatedBy: "Nadia S.",
    userEmail: "nadia@example.com",
    updatedAt: "2025-05-27T00:08:00Z",
    status: "failed",
  },
] as const;

const additionalReportTitles = [
  "Semaglutide - Type 2 Diabetes",
  "Trastuzumab - HER2-Positive Breast Cancer",
  "Adalimumab - Rheumatoid Arthritis",
  "Osimertinib - Non-Small Cell Lung Cancer",
  "Empagliflozin - Chronic Heart Failure",
  "Risankizumab - Plaque Psoriasis",
] as const;

const additionalReportStatuses = [
  "completed",
  "sent_for_review",
  "in_progress",
  "reviewed",
  "failed",
] as const;

const additionalCompanyReports = Array.from({ length: 18 }, (_, index) => ({
  id: `company-report-${index + 7}`,
  title: additionalReportTitles[index % additionalReportTitles.length],
  generatedBy: `Company User ${index + 7}`,
  userEmail: `user${index + 7}@example.com`,
  updatedAt: new Date(Date.UTC(2025, 4, 26 - index, 12, 8)).toISOString(),
  status: additionalReportStatuses[index % additionalReportStatuses.length],
}));

export const companyAdminReports = companyReportsSchema.parse([
  ...visibleCompanyReports,
  ...additionalCompanyReports,
]);
