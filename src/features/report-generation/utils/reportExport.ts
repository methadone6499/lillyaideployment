import { ReportApiError } from "../api/reportApiError";
import {
  PDF_MAX_ATTEMPTS,
  PDF_POLL_INTERVAL_MS,
  PDF_POLL_TIMEOUT_MESSAGE,
} from "../constants/pdfExport";
import { PPTX_POLL_TIMEOUT_MESSAGE } from "../constants/pptxExport";
import type {
  PptxExportProgress,
  PptxExportQueueResponse,
  PptxExportStatusResponse,
  QueuePptxExportInput,
} from "../types";
import {
  getPptxPollDelayMs,
  hasPptxPollBudgetElapsed,
} from "./pptxExportProgress";

export function getPdfExportPath(reportServiceId: string): string {
  return `/reports/${reportServiceId}/export/pdf`;
}

export function getPptxExportPath(reportServiceId: string): string {
  return `/reports/${reportServiceId}/export/pptx`;
}

export function getPptxExportStatusPath(reportServiceId: string): string {
  return `/reports/${reportServiceId}/export/pptx/status`;
}

export function createPptxRebuildInput(
  idempotencyKey: string = crypto.randomUUID(),
): QueuePptxExportInput {
  return {
    force_regenerate: true,
    idempotency_key: idempotencyKey,
  };
}

export function isExportInFlightError(error: unknown): boolean {
  return error instanceof ReportApiError && error.status === 409;
}

export function isExportDownloadRetryableError(error: unknown): boolean {
  return (
    error instanceof ReportApiError &&
    (error.status === 409 || error.status === 404)
  );
}

export function shouldDownloadQueuedPptx(
  queued: PptxExportQueueResponse,
): boolean {
  return queued.pptx_ready === true;
}

export function shouldRetryExportDownloadPoll(
  error: unknown,
  hasRemainingAttempts: boolean,
): boolean {
  return hasRemainingAttempts && isExportDownloadRetryableError(error);
}

export type PdfRebuildTransport = {
  queue: () => Promise<unknown>;
  download: () => Promise<Blob>;
  delay: (ms: number) => Promise<void>;
  signal?: AbortSignal;
};

export async function runPdfRebuildThenDownload(
  transport: PdfRebuildTransport,
): Promise<Blob> {
  try {
    await transport.queue();
  } catch (error) {
    if (!isExportInFlightError(error)) {
      throw error;
    }
  }

  for (let attempt = 0; attempt < PDF_MAX_ATTEMPTS; attempt++) {
    if (transport.signal?.aborted) {
      throw transport.signal.reason;
    }

    try {
      return await transport.download();
    } catch (error) {
      if (
        shouldRetryExportDownloadPoll(error, attempt < PDF_MAX_ATTEMPTS - 1)
      ) {
        await transport.delay(PDF_POLL_INTERVAL_MS);
        continue;
      }
      if (isExportDownloadRetryableError(error)) {
        break;
      }
      throw error;
    }
  }

  throw new ReportApiError(408, PDF_POLL_TIMEOUT_MESSAGE);
}

export type PptxRebuildTransport = {
  queue: () => Promise<PptxExportQueueResponse>;
  fetchStatus: () => Promise<PptxExportStatusResponse>;
  download: () => Promise<Blob>;
  delay: (ms: number) => Promise<void>;
  now?: () => number;
  startedAtMs?: number;
  signal?: AbortSignal;
  onProgress?: (
    progress: PptxExportProgress | undefined,
    status: PptxExportStatusResponse,
  ) => void;
};

export async function runPptxRebuildThenDownload(
  transport: PptxRebuildTransport,
): Promise<Blob> {
  const now = transport.now ?? Date.now;
  const startedAtMs = transport.startedAtMs ?? now();

  try {
    const queued = await transport.queue();
    if (shouldDownloadQueuedPptx(queued)) {
      try {
        return await transport.download();
      } catch (error) {
        if (!isExportDownloadRetryableError(error)) {
          throw error;
        }
      }
    }
  } catch (error) {
    if (!isExportInFlightError(error)) {
      throw error;
    }
  }

  while (!hasPptxPollBudgetElapsed(startedAtMs, now())) {
    if (transport.signal?.aborted) {
      throw transport.signal.reason;
    }

    let status: PptxExportStatusResponse;
    try {
      status = await transport.fetchStatus();
    } catch (error) {
      const delayMs = getPptxPollDelayMs(startedAtMs, now());
      if (isExportDownloadRetryableError(error) && delayMs != null) {
        await transport.delay(delayMs);
        continue;
      }
      if (isExportDownloadRetryableError(error)) {
        break;
      }
      throw error;
    }

    transport.onProgress?.(status.progress, status);

    if (status.job_status === "failed") {
      throw new ReportApiError(
        500,
        status.error?.trim() || "Presentation export failed.",
      );
    }

    if (status.pptx_ready) {
      try {
        return await transport.download();
      } catch (error) {
        const delayMs = getPptxPollDelayMs(startedAtMs, now());
        if (isExportDownloadRetryableError(error) && delayMs != null) {
          await transport.delay(delayMs);
          continue;
        }
        if (isExportDownloadRetryableError(error)) {
          break;
        }
        throw error;
      }
    }

    const delayMs = getPptxPollDelayMs(startedAtMs, now());
    if (delayMs == null) {
      break;
    }
    await transport.delay(delayMs);
  }

  throw new ReportApiError(408, PPTX_POLL_TIMEOUT_MESSAGE);
}
