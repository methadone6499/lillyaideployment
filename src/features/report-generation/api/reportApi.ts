import {
  articleDiscoveryResponseSchema,
  comparatorDiscoveryResponseSchema,
  createReportResponseSchema,
  customSectionResponseSchema,
  drugValidationResponseSchema,
  generateReportResponseSchema,
  listCustomSectionsResponseSchema,
  pdfExportResponseSchema,
  pptxExportQueueResponseSchema,
  pptxExportStatusResponseSchema,
  reportSectionResponseSchema,
  reportStatusResponseSchema,
  updateReportSelectionsResponseSchema,
} from "../schemas/reportSchemas";
import type {
  CreateCustomSectionInput,
  CreateReportInput,
  CustomSectionResponse,
  GenerateReportInput,
  GenerateReportResponse,
  ListCustomSectionsResponse,
  PatchCustomSectionInput,
  PptxExportProgress,
  PptxExportQueueResponse,
  PptxExportStatusResponse,
  QueuePptxExportInput,
  UpdateReportSelectionsInput,
  UpdateReportSelectionsResponse,
} from "../types";
import { PPTX_POLL_TIMEOUT_MESSAGE } from "../constants/pptxExport";
import {
  getCustomSectionMode,
  validateCustomSectionFile,
} from "../utils/customSections";
import {
  getPptxPollDelayMs,
  hasPptxPollBudgetElapsed,
} from "../utils/pptxExportProgress";
import { ReportApiError, reportFetch } from "./reportFetch";

const CUSTOM_SECTION_MODE_HEADER = "X-Custom-Section-Mode";

const PDF_POLL_INTERVAL_MS = 2_000;
const PDF_MAX_ATTEMPTS = 30;

export type DownloadPptxWhenReadyOptions = {
  signal?: AbortSignal;
  onProgress?: (
    progress: PptxExportProgress | undefined,
    status: PptxExportStatusResponse,
  ) => void;
};

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
  reportServiceId: string,
  signal?: AbortSignal,
) {
  return reportFetch(`/reports/${reportServiceId}/discovery/clinical-articles`, {
    method: "POST",
    schema: articleDiscoveryResponseSchema,
    signal,
  });
}

export async function discoverEconomicArticles(
  reportServiceId: string,
  signal?: AbortSignal,
) {
  return reportFetch(`/reports/${reportServiceId}/discovery/economic-articles`, {
    method: "POST",
    schema: articleDiscoveryResponseSchema,
    signal,
  });
}

export async function discoverComparators(
  reportServiceId: string,
  signal?: AbortSignal,
) {
  return reportFetch(`/reports/${reportServiceId}/discovery/comparators`, {
    method: "POST",
    schema: comparatorDiscoveryResponseSchema,
    signal,
  });
}

export async function updateReportSelections(
  reportServiceId: string,
  input: UpdateReportSelectionsInput,
  signal?: AbortSignal,
): Promise<UpdateReportSelectionsResponse> {
  return reportFetch(`/reports/${reportServiceId}/selections`, {
    method: "PUT",
    body: input,
    schema: updateReportSelectionsResponseSchema,
    signal,
  });
}

export async function listCustomSections(
  reportServiceId: string,
  signal?: AbortSignal,
): Promise<ListCustomSectionsResponse> {
  return reportFetch(`/reports/${reportServiceId}/custom-sections`, {
    schema: listCustomSectionsResponseSchema,
    signal,
  });
}

export async function createOrReplaceCustomSection(
  reportServiceId: string,
  input: CreateCustomSectionInput,
  signal?: AbortSignal,
): Promise<CustomSectionResponse> {
  const title = input.title.trim();
  const prompt = input.prompt?.trim();
  if (!title) {
    throw new Error("Enter a title for this section.");
  }
  if (input.file) {
    const fileError = validateCustomSectionFile(input.file);
    if (fileError) {
      throw new Error(fileError);
    }
  }

  const file = input.file;
  const mode = getCustomSectionMode({ prompt, file });
  if (mode === "prompt" && !prompt) {
    throw new Error("Enter a prompt for this section.");
  }
  if ((mode === "file" || mode === "both") && !file) {
    throw new Error("Upload a .pdf or .docx file.");
  }

  const headers = { [CUSTOM_SECTION_MODE_HEADER]: mode };
  const path = `/reports/${reportServiceId}/custom-sections`;

  if (mode === "prompt") {
    return reportFetch(path, {
      method: "POST",
      headers,
      body: {
        title,
        prompt,
        custom_id: input.customId ?? null,
      },
      schema: customSectionResponseSchema,
      signal,
    });
  }

  if (!file) {
    throw new Error("Upload a .pdf or .docx file.");
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);
  if (prompt) {
    formData.append("prompt", prompt);
  }
  if (input.customId) {
    formData.append("custom_id", input.customId);
  }

  return reportFetch(path, {
    method: "POST",
    headers,
    body: formData,
    schema: customSectionResponseSchema,
    signal,
  });
}

export async function patchCustomSection(
  reportServiceId: string,
  customId: string,
  input: PatchCustomSectionInput,
  signal?: AbortSignal,
): Promise<void> {
  await reportFetch(
    `/reports/${reportServiceId}/custom-sections/${customId}`,
    {
      method: "PATCH",
      body: input,
      responseType: "empty",
      signal,
    },
  );
}

export async function deleteCustomSection(
  reportServiceId: string,
  customId: string,
  signal?: AbortSignal,
): Promise<void> {
  await reportFetch(`/reports/${reportServiceId}/custom-sections/${customId}`, {
    method: "DELETE",
    responseType: "empty",
    signal,
  });
}

export async function generateReport(
  reportServiceId: string,
  input: GenerateReportInput,
  signal?: AbortSignal,
): Promise<GenerateReportResponse> {
  return reportFetch(`/reports/${reportServiceId}/generate`, {
    method: "POST",
    body: input,
    schema: generateReportResponseSchema,
    signal,
  });
}

export async function fetchReportStatus(
  reportServiceId: string,
  signal?: AbortSignal,
) {
  return reportFetch(`/reports/${reportServiceId}/status`, {
    schema: reportStatusResponseSchema,
    signal,
  });
}

export async function fetchReportSection(
  reportServiceId: string,
  sectionId: string,
  signal?: AbortSignal,
) {
  return reportFetch(`/reports/${reportServiceId}/sections/${sectionId}`, {
    schema: reportSectionResponseSchema,
    signal,
  });
}

export async function queuePdfExport(
  reportServiceId: string,
  signal?: AbortSignal,
) {
  return reportFetch(`/reports/${reportServiceId}/export/pdf`, {
    method: "POST",
    schema: pdfExportResponseSchema,
    signal,
  });
}

export async function downloadPdf(
  reportServiceId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  return reportFetch(`/reports/${reportServiceId}/export/pdf`, {
    responseType: "blob",
    signal,
  });
}

export async function downloadPdfWhenReady(
  reportServiceId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  for (let attempt = 0; attempt < PDF_MAX_ATTEMPTS; attempt++) {
    if (signal?.aborted) {
      throw signal.reason;
    }

    try {
      return await downloadPdf(reportServiceId, signal);
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

function isPptxInFlightError(error: unknown): boolean {
  return error instanceof ReportApiError && error.status === 409;
}

function isPptxRetryablePollError(error: unknown): boolean {
  return (
    error instanceof ReportApiError &&
    (error.status === 409 || error.status === 404)
  );
}

function isQueuedPptxReady(queued: PptxExportQueueResponse): boolean {
  return queued.pptx_ready === true || queued.job_status === "completed";
}

export async function queuePptxExport(
  reportServiceId: string,
  input: QueuePptxExportInput = { force_regenerate: false },
  signal?: AbortSignal,
) {
  const body: QueuePptxExportInput = {
    force_regenerate: input.force_regenerate,
  };
  if (input.idempotency_key !== undefined) {
    body.idempotency_key = input.idempotency_key;
  }

  return reportFetch(`/reports/${reportServiceId}/export/pptx`, {
    method: "POST",
    body,
    schema: pptxExportQueueResponseSchema,
    signal,
  });
}

export async function fetchPptxExportStatus(
  reportServiceId: string,
  signal?: AbortSignal,
) {
  return reportFetch(`/reports/${reportServiceId}/export/pptx/status`, {
    schema: pptxExportStatusResponseSchema,
    signal,
  });
}

export async function downloadPptx(
  reportServiceId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  return reportFetch(`/reports/${reportServiceId}/export/pptx`, {
    responseType: "blob",
    signal,
  });
}

export async function downloadPptxWhenReady(
  reportServiceId: string,
  options?: DownloadPptxWhenReadyOptions,
): Promise<Blob> {
  const signal = options?.signal;
  const startedAtMs = Date.now();

  try {
    const queued = await queuePptxExport(
      reportServiceId,
      { force_regenerate: false },
      signal,
    );
    if (isQueuedPptxReady(queued)) {
      try {
        return await downloadPptx(reportServiceId, signal);
      } catch (error) {
        if (!isPptxInFlightError(error)) {
          throw error;
        }
      }
    }
  } catch (error) {
    if (!isPptxInFlightError(error)) {
      throw error;
    }
  }

  while (!hasPptxPollBudgetElapsed(startedAtMs, Date.now())) {
    if (signal?.aborted) {
      throw signal.reason;
    }

    let status: PptxExportStatusResponse;
    try {
      status = await fetchPptxExportStatus(reportServiceId, signal);
    } catch (error) {
      const delayMs = getPptxPollDelayMs(startedAtMs, Date.now());
      if (isPptxRetryablePollError(error) && delayMs != null) {
        await delay(delayMs, signal);
        continue;
      }
      if (isPptxRetryablePollError(error)) {
        break;
      }
      throw error;
    }

    options?.onProgress?.(status.progress, status);

    if (status.job_status === "failed") {
      throw new ReportApiError(
        500,
        status.error?.trim() || "Presentation export failed.",
      );
    }

    if (status.pptx_ready) {
      try {
        return await downloadPptx(reportServiceId, signal);
      } catch (error) {
        const delayMs = getPptxPollDelayMs(startedAtMs, Date.now());
        if (isPptxRetryablePollError(error) && delayMs != null) {
          await delay(delayMs, signal);
          continue;
        }
        if (isPptxRetryablePollError(error)) {
          break;
        }
        throw error;
      }
    }

    const delayMs = getPptxPollDelayMs(startedAtMs, Date.now());
    if (delayMs == null) {
      break;
    }
    await delay(delayMs, signal);
  }

  throw new ReportApiError(408, PPTX_POLL_TIMEOUT_MESSAGE);
}
