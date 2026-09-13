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
  PptxExportStatusResponse,
  QueuePptxExportInput,
  UpdateReportSelectionsInput,
  UpdateReportSelectionsResponse,
} from "../types";
import {
  getCustomSectionMode,
  validateCustomSectionFile,
} from "../utils/customSections";
import {
  createPptxRebuildInput,
  getPdfExportPath,
  getPptxExportPath,
  getPptxExportStatusPath,
  runPdfRebuildThenDownload,
  runPptxRebuildThenDownload,
} from "../utils/reportExport";
import { reportFetch } from "./reportFetch";

const CUSTOM_SECTION_MODE_HEADER = "X-Custom-Section-Mode";

export type DownloadPptxWhenReadyOptions = {
  signal?: AbortSignal;
  onProgress?: (
    progress: PptxExportProgress | undefined,
    status: PptxExportStatusResponse,
  ) => void;
};

export {
  ReportApiError,
  getEditingErrorCode,
  isEditingErrorCode,
  isReportApiError,
} from "./reportFetch";

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
  return reportFetch(getPdfExportPath(reportServiceId), {
    method: "POST",
    schema: pdfExportResponseSchema,
    signal,
  });
}

export async function downloadPdf(
  reportServiceId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  return reportFetch(getPdfExportPath(reportServiceId), {
    responseType: "blob",
    signal,
  });
}

export async function downloadPdfWhenReady(
  reportServiceId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  return runPdfRebuildThenDownload({
    queue: () => queuePdfExport(reportServiceId, signal),
    download: () => downloadPdf(reportServiceId, signal),
    delay: (ms) => delay(ms, signal),
    signal,
  });
}

export async function queuePptxExport(
  reportServiceId: string,
  input: QueuePptxExportInput = createPptxRebuildInput(),
  signal?: AbortSignal,
) {
  const body: QueuePptxExportInput = {
    force_regenerate: input.force_regenerate,
  };
  if (input.idempotency_key !== undefined) {
    body.idempotency_key = input.idempotency_key;
  }

  return reportFetch(getPptxExportPath(reportServiceId), {
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
  return reportFetch(getPptxExportStatusPath(reportServiceId), {
    schema: pptxExportStatusResponseSchema,
    signal,
  });
}

export async function downloadPptx(
  reportServiceId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  return reportFetch(getPptxExportPath(reportServiceId), {
    responseType: "blob",
    signal,
  });
}

export async function downloadPptxWhenReady(
  reportServiceId: string,
  options?: DownloadPptxWhenReadyOptions,
): Promise<Blob> {
  const signal = options?.signal;

  return runPptxRebuildThenDownload({
    queue: () =>
      queuePptxExport(reportServiceId, createPptxRebuildInput(), signal),
    fetchStatus: () => fetchPptxExportStatus(reportServiceId, signal),
    download: () => downloadPptx(reportServiceId, signal),
    delay: (ms) => delay(ms, signal),
    signal,
    onProgress: options?.onProgress,
  });
}
