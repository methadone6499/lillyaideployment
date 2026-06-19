import {
  articleDiscoveryResponseSchema,
  comparatorDiscoveryResponseSchema,
  createReportResponseSchema,
  drugValidationResponseSchema,
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
import { ReportApiError, reportFetch } from "./reportFetch";

const PDF_POLL_INTERVAL_MS = 2_000;
const PDF_MAX_ATTEMPTS = 30;

export { ReportApiError } from "./reportFetch";
export { clearAuthToken, getAuthToken, setAuthToken } from "./reportAuth";

export async function validateDrug(input: { drug: string; disease?: string }) {
  const body: { drug: string; disease?: string } = { drug: input.drug };
  if (input.disease) {
    body.disease = input.disease;
  }

  return reportFetch("/drugs/validate", {
    method: "POST",
    body,
    schema: drugValidationResponseSchema,
  });
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

export async function downloadPdfWhenReady(reportId: string): Promise<Blob> {
  for (let attempt = 0; attempt < PDF_MAX_ATTEMPTS; attempt++) {
    try {
      return await downloadPdf(reportId);
    } catch (error) {
      if (
        error instanceof ReportApiError &&
        error.status === 404 &&
        attempt < PDF_MAX_ATTEMPTS - 1
      ) {
        await new Promise((resolve) => setTimeout(resolve, PDF_POLL_INTERVAL_MS));
        continue;
      }
      throw error;
    }
  }

  throw new ReportApiError(
    408,
    "PDF is still being prepared. Please try again.",
  );
}
