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

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const timeoutId = setTimeout(() => resolve(), ms);

    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeoutId);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

export async function validateDrug(
  input: { drug: string; disease?: string },
  signal?: AbortSignal,
) {
  const body: { drug: string; disease?: string } = { drug: input.drug };
  if (input.disease) {
    body.disease = input.disease;
  }

  return reportFetch("/drugs/validate", {
    method: "POST",
    body,
    schema: drugValidationResponseSchema,
    signal,
  });
}

export async function createReport(
  input: CreateReportInput,
  signal?: AbortSignal,
) {
  return reportFetch("/reports", {
    method: "POST",
    body: input,
    schema: createReportResponseSchema,
    signal,
  });
}

export async function discoverClinicalArticles(
  reportId: string,
  signal?: AbortSignal,
) {
  return reportFetch(`/reports/${reportId}/discovery/clinical-articles`, {
    method: "POST",
    schema: articleDiscoveryResponseSchema,
    signal,
  });
}

export async function discoverEconomicArticles(
  reportId: string,
  signal?: AbortSignal,
) {
  return reportFetch(`/reports/${reportId}/discovery/economic-articles`, {
    method: "POST",
    schema: articleDiscoveryResponseSchema,
    signal,
  });
}

export async function discoverComparators(
  reportId: string,
  signal?: AbortSignal,
) {
  return reportFetch(`/reports/${reportId}/discovery/comparators`, {
    method: "POST",
    schema: comparatorDiscoveryResponseSchema,
    signal,
  });
}

export async function updateReportSelections(
  reportId: string,
  input: UpdateReportSelectionsInput,
  signal?: AbortSignal,
): Promise<UpdateReportSelectionsResponse> {
  return reportFetch(`/reports/${reportId}/selections`, {
    method: "PUT",
    body: input,
    schema: updateReportSelectionsResponseSchema,
    signal,
  });
}

export async function generateReport(
  reportId: string,
  input: GenerateReportInput,
  signal?: AbortSignal,
): Promise<GenerateReportResponse> {
  return reportFetch(`/reports/${reportId}/generate`, {
    method: "POST",
    body: input,
    schema: generateReportResponseSchema,
    signal,
  });
}

export async function fetchReportStatus(
  reportId: string,
  signal?: AbortSignal,
) {
  return reportFetch(`/reports/${reportId}/status`, {
    schema: reportStatusResponseSchema,
    signal,
  });
}

export async function fetchReportSection(
  reportId: string,
  sectionId: string,
  signal?: AbortSignal,
) {
  return reportFetch(`/reports/${reportId}/sections/${sectionId}`, {
    schema: reportSectionResponseSchema,
    signal,
  });
}

export async function queuePdfExport(
  reportId: string,
  signal?: AbortSignal,
) {
  return reportFetch(`/reports/${reportId}/export/pdf`, {
    method: "POST",
    schema: pdfExportResponseSchema,
    signal,
  });
}

export async function downloadPdf(
  reportId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  return reportFetch(`/reports/${reportId}/export/pdf`, {
    responseType: "blob",
    signal,
  });
}

export async function downloadPdfWhenReady(
  reportId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  for (let attempt = 0; attempt < PDF_MAX_ATTEMPTS; attempt++) {
    if (signal?.aborted) {
      throw signal.reason;
    }

    try {
      return await downloadPdf(reportId, signal);
    } catch (error) {
      if (
        error instanceof ReportApiError &&
        error.status === 404 &&
        attempt < PDF_MAX_ATTEMPTS - 1
      ) {
        await delay(PDF_POLL_INTERVAL_MS, signal);
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
