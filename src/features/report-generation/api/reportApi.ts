import {
  articleDiscoveryResponseSchema,
  comparatorDiscoveryResponseSchema,
  createReportResponseSchema,
  drugSuggestionSchema,
  generateReportResponseSchema,
  pdfExportResponseSchema,
  reportSectionResponseSchema,
  reportStatusResponseSchema,
  updateReportSelectionsResponseSchema,
} from "../schemas/reportSchemas";
import type {
  CreateReportInput,
  GenerateReportInput,
  GenerateReportResponse,
  UpdateReportSelectionsInput,
  UpdateReportSelectionsResponse,
} from "../types";
import { reportFetch } from "./reportFetch";

export { ReportApiError } from "./reportFetch";
export { clearAuthToken, getAuthToken, setAuthToken } from "./reportAuth";

const DRUG_SUGGESTIONS: Record<string, string> = {
  panedol: "Panadol",
  panadol: "Panadol",
};

export async function fetchDrugSuggestion(
  drugName: string,
): Promise<{ original: string; suggestion: string | null }> {
  const normalized = drugName.trim().toLowerCase();
  const suggestion = DRUG_SUGGESTIONS[normalized] ?? null;
  return drugSuggestionSchema.parse({ original: drugName, suggestion });
}

export async function createReport(input: CreateReportInput) {
  return reportFetch("/reports", {
    method: "POST",
    body: input,
    schema: createReportResponseSchema,
  });
}

export async function discoverClinicalArticles(reportId: string) {
  return reportFetch(`/reports/${reportId}/discovery/clinical-articles`, {
    method: "POST",
    schema: articleDiscoveryResponseSchema,
  });
}

export async function discoverEconomicArticles(reportId: string) {
  return reportFetch(`/reports/${reportId}/discovery/economic-articles`, {
    method: "POST",
    schema: articleDiscoveryResponseSchema,
  });
}

export async function discoverComparators(reportId: string) {
  return reportFetch(`/reports/${reportId}/discovery/comparators`, {
    method: "POST",
    schema: comparatorDiscoveryResponseSchema,
  });
}

export async function updateReportSelections(
  reportId: string,
  input: UpdateReportSelectionsInput,
): Promise<UpdateReportSelectionsResponse> {
  return reportFetch(`/reports/${reportId}/selections`, {
    method: "PUT",
    body: input,
    schema: updateReportSelectionsResponseSchema,
  });
}

export async function generateReport(
  reportId: string,
  input: GenerateReportInput,
): Promise<GenerateReportResponse> {
  return reportFetch(`/reports/${reportId}/generate`, {
    method: "POST",
    body: input,
    schema: generateReportResponseSchema,
  });
}

export async function fetchReportStatus(reportId: string) {
  return reportFetch(`/reports/${reportId}/status`, {
    schema: reportStatusResponseSchema,
  });
}

export async function fetchReportSection(reportId: string, sectionId: string) {
  return reportFetch(`/reports/${reportId}/sections/${sectionId}`, {
    schema: reportSectionResponseSchema,
  });
}

export async function queuePdfExport(reportId: string) {
  return reportFetch(`/reports/${reportId}/export/pdf`, {
    method: "POST",
    schema: pdfExportResponseSchema,
  });
}

export async function downloadPdf(reportId: string): Promise<Blob> {
  return reportFetch(`/reports/${reportId}/export/pdf`, {
    responseType: "blob",
  });
}
