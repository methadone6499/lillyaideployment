import assert from "node:assert/strict";

import { ReportApiError } from "../api/reportApiError";
import {
  PDF_EXPORT_DEFAULT_PROGRESS_LABEL,
  PDF_MAX_ATTEMPTS,
  PDF_POLL_INTERVAL_MS,
  PDF_POLL_TIMEOUT_MESSAGE,
} from "../constants/pdfExport";
import {
  PPTX_POLL_BUDGET_MS,
  PPTX_POLL_INTERVAL_MS,
  PPTX_POLL_TIMEOUT_MESSAGE,
} from "../constants/pptxExport";
import { queuePptxExportInputSchema } from "../schemas/reportSchemas";
import type {
  PptxExportQueueResponse,
  PptxExportStatusResponse,
} from "../types";
import {
  createPptxRebuildInput,
  getPdfExportPath,
  getPptxExportPath,
  getPptxExportStatusPath,
  isExportDownloadRetryableError,
  isExportInFlightError,
  runPdfRebuildThenDownload,
  runPptxRebuildThenDownload,
  shouldDownloadQueuedPptx,
  shouldRetryExportDownloadPoll,
} from "../utils/reportExport";

const REPORT_ID = "0ec01d40-a63d-49bf-9275-007f2db66fb7";
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

assert.equal(
  getPdfExportPath(REPORT_ID),
  `/reports/${REPORT_ID}/export/pdf`,
);
assert.equal(
  getPptxExportPath(REPORT_ID),
  `/reports/${REPORT_ID}/export/pptx`,
);
assert.equal(
  getPptxExportStatusPath(REPORT_ID),
  `/reports/${REPORT_ID}/export/pptx/status`,
);

const rebuildInput = createPptxRebuildInput();
assert.deepEqual(Object.keys(rebuildInput).sort(), [
  "force_regenerate",
  "idempotency_key",
]);
assert.equal(rebuildInput.force_regenerate, true);
assert.match(rebuildInput.idempotency_key ?? "", UUID_V4_PATTERN);
assert.deepEqual(
  queuePptxExportInputSchema.parse(rebuildInput),
  rebuildInput,
);

const pinnedKey = "pptx-export-001";
assert.deepEqual(createPptxRebuildInput(pinnedKey), {
  force_regenerate: true,
  idempotency_key: pinnedKey,
});
assert.notEqual(
  createPptxRebuildInput().idempotency_key,
  createPptxRebuildInput().idempotency_key,
);

const stalePdf = new ReportApiError(
  409,
  "PDF is stale after edits; request export again",
);
const missingPdf = new ReportApiError(404, "PDF not found");
const failedPdf = new ReportApiError(500, "PDF export failed");

assert.equal(isExportDownloadRetryableError(stalePdf), true);
assert.equal(isExportDownloadRetryableError(missingPdf), true);
assert.equal(isExportDownloadRetryableError(failedPdf), false);
assert.equal(isExportDownloadRetryableError(new Error("network")), false);

assert.equal(shouldRetryExportDownloadPoll(stalePdf, true), true);
assert.equal(shouldRetryExportDownloadPoll(missingPdf, true), true);
assert.equal(shouldRetryExportDownloadPoll(stalePdf, false), false);
assert.equal(shouldRetryExportDownloadPoll(failedPdf, true), false);

const inFlightPptx = new ReportApiError(409, "PPTX export already running");
assert.equal(isExportInFlightError(inFlightPptx), true);
assert.equal(isExportInFlightError(missingPdf), false);
assert.equal(isExportInFlightError(failedPdf), false);

assert.equal(
  shouldDownloadQueuedPptx({
    job_id: "job-1",
    report_id: REPORT_ID,
    job_status: "queued",
    pptx_ready: false,
  }),
  false,
);
assert.equal(
  shouldDownloadQueuedPptx({
    job_id: "job-1",
    report_id: REPORT_ID,
    job_status: "completed",
    pptx_ready: false,
  }),
  false,
);
assert.equal(
  shouldDownloadQueuedPptx({
    job_id: "job-1",
    report_id: REPORT_ID,
    job_status: "completed",
    pptx_ready: true,
  }),
  true,
);

assert.equal(PDF_POLL_INTERVAL_MS, 2_000);
assert.equal(PDF_MAX_ATTEMPTS, 30);
assert.equal(PDF_POLL_INTERVAL_MS * PDF_MAX_ATTEMPTS, 60_000);
assert.equal(PDF_EXPORT_DEFAULT_PROGRESS_LABEL, "Preparing PDF…");
assert.match(PDF_POLL_TIMEOUT_MESSAGE, /PDF is still being prepared/i);

const PDF_BLOB = new Blob(["pdf"], { type: "application/pdf" });
const PPTX_BLOB = new Blob(["pptx"], {
  type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
});

function createCallLog() {
  const calls: string[] = [];
  return {
    calls,
    record(name: string) {
      calls.push(name);
    },
  };
}

function queuedPptx(
  overrides: Partial<PptxExportQueueResponse> = {},
): PptxExportQueueResponse {
  return {
    job_id: "job-1",
    report_id: REPORT_ID,
    job_status: "queued",
    pptx_ready: false,
    ...overrides,
  };
}

function pptxStatus(
  overrides: Partial<PptxExportStatusResponse> = {},
): PptxExportStatusResponse {
  return {
    report_id: REPORT_ID,
    job_id: "job-1",
    job_status: "processing",
    phase: "queued",
    pptx_ready: false,
    ...overrides,
  };
}

async function testRebuildThenPollSequences() {
  const pdfReady = await runPdfRebuildThenDownload({
    queue: async () => undefined,
    download: async () => PDF_BLOB,
    delay: async () => {
      throw new Error("PDF happy path should not poll");
    },
  });
  assert.equal(pdfReady, PDF_BLOB);

  const pdfCalls = createCallLog();
  let pdfDownloadAttempts = 0;
  const pdfAfterRetry = await runPdfRebuildThenDownload({
    queue: async () => {
      pdfCalls.record("POST /export/pdf");
    },
    download: async () => {
      pdfDownloadAttempts += 1;
      pdfCalls.record("GET /export/pdf");
      if (pdfDownloadAttempts === 1) {
        throw new ReportApiError(
          409,
          "PDF is stale after edits; request export again",
        );
      }
      if (pdfDownloadAttempts === 2) {
        throw new ReportApiError(404, "PDF not found");
      }
      return PDF_BLOB;
    },
    delay: async (ms) => {
      assert.equal(ms, PDF_POLL_INTERVAL_MS);
      pdfCalls.record(`delay:${ms}`);
    },
  });
  assert.equal(pdfAfterRetry, PDF_BLOB);
  assert.equal(pdfDownloadAttempts, 3);
  assert.deepEqual(pdfCalls.calls, [
    "POST /export/pdf",
    "GET /export/pdf",
    `delay:${PDF_POLL_INTERVAL_MS}`,
    "GET /export/pdf",
    `delay:${PDF_POLL_INTERVAL_MS}`,
    "GET /export/pdf",
  ]);

  const pdfInFlightCalls = createCallLog();
  const pdfInFlight = await runPdfRebuildThenDownload({
    queue: async () => {
      pdfInFlightCalls.record("POST /export/pdf");
      throw new ReportApiError(409, "PDF export already running");
    },
    download: async () => {
      pdfInFlightCalls.record("GET /export/pdf");
      return PDF_BLOB;
    },
    delay: async () => {
      throw new Error("in-flight PDF should download immediately when ready");
    },
  });
  assert.equal(pdfInFlight, PDF_BLOB);
  assert.deepEqual(pdfInFlightCalls.calls, [
    "POST /export/pdf",
    "GET /export/pdf",
  ]);

  await assert.rejects(
    () =>
      runPdfRebuildThenDownload({
        queue: async () => {
          throw new ReportApiError(500, "PDF export failed");
        },
        download: async () => PDF_BLOB,
        delay: async () => undefined,
      }),
    (error: unknown) =>
      error instanceof ReportApiError &&
      error.status === 500 &&
      error.message === "PDF export failed",
  );

  await assert.rejects(
    () =>
      runPdfRebuildThenDownload({
        queue: async () => undefined,
        download: async () => {
          throw new ReportApiError(
            409,
            "PDF is stale after edits; request export again",
          );
        },
        delay: async () => undefined,
      }),
    (error: unknown) =>
      error instanceof ReportApiError &&
      error.status === 408 &&
      error.message === PDF_POLL_TIMEOUT_MESSAGE,
  );

  const pptxRebuildInput = createPptxRebuildInput("pptx-export-fresh");
  assert.deepEqual(pptxRebuildInput, {
    force_regenerate: true,
    idempotency_key: "pptx-export-fresh",
  });

  const pptxCalls = createCallLog();
  let nowMs = 1_700_000_000_000;
  let pptxStatusPolls = 0;
  const pptxReady = await runPptxRebuildThenDownload({
    queue: async () => {
      pptxCalls.record("POST /export/pptx");
      return queuedPptx();
    },
    fetchStatus: async () => {
      pptxStatusPolls += 1;
      pptxCalls.record("GET /export/pptx/status");
      if (pptxStatusPolls === 1) {
        return pptxStatus({
          phase: "pass1",
          progress: { percent: 20, detail: "Building slides" },
        });
      }
      return pptxStatus({
        job_status: "completed",
        phase: "done",
        pptx_ready: true,
        progress: { percent: 100, detail: "Presentation ready" },
      });
    },
    download: async () => {
      pptxCalls.record("GET /export/pptx");
      return PPTX_BLOB;
    },
    delay: async (ms) => {
      assert.equal(ms, PPTX_POLL_INTERVAL_MS);
      pptxCalls.record(`delay:${ms}`);
      nowMs += ms;
    },
    now: () => nowMs,
    startedAtMs: nowMs,
  });
  assert.equal(pptxReady, PPTX_BLOB);
  assert.deepEqual(pptxCalls.calls, [
    "POST /export/pptx",
    "GET /export/pptx/status",
    `delay:${PPTX_POLL_INTERVAL_MS}`,
    "GET /export/pptx/status",
    "GET /export/pptx",
  ]);

  const pptxInFlightCalls = createCallLog();
  const pptxInFlight = await runPptxRebuildThenDownload({
    queue: async () => {
      pptxInFlightCalls.record("POST /export/pptx");
      throw new ReportApiError(409, "PPTX export already running");
    },
    fetchStatus: async () => {
      pptxInFlightCalls.record("GET /export/pptx/status");
      return pptxStatus({
        job_status: "completed",
        phase: "done",
        pptx_ready: true,
      });
    },
    download: async () => {
      pptxInFlightCalls.record("GET /export/pptx");
      return PPTX_BLOB;
    },
    delay: async () => {
      throw new Error("ready in-flight PPTX should not delay");
    },
    now: () => 1_700_000_000_000,
    startedAtMs: 1_700_000_000_000,
  });
  assert.equal(pptxInFlight, PPTX_BLOB);
  assert.deepEqual(pptxInFlightCalls.calls, [
    "POST /export/pptx",
    "GET /export/pptx/status",
    "GET /export/pptx",
  ]);

  const pptxImmediateReady = await runPptxRebuildThenDownload({
    queue: async () => queuedPptx({ job_status: "completed", pptx_ready: true }),
    fetchStatus: async () => {
      throw new Error("immediate ready PPTX should not poll status");
    },
    download: async () => PPTX_BLOB,
    delay: async () => {
      throw new Error("immediate ready PPTX should not delay");
    },
  });
  assert.equal(pptxImmediateReady, PPTX_BLOB);

  const pptxStaleThenReadyCalls = createCallLog();
  let pptxDownloads = 0;
  const pptxAfterStaleDownload = await runPptxRebuildThenDownload({
    queue: async () => {
      pptxStaleThenReadyCalls.record("POST /export/pptx");
      return queuedPptx({ job_status: "completed", pptx_ready: true });
    },
    fetchStatus: async () => {
      pptxStaleThenReadyCalls.record("GET /export/pptx/status");
      return pptxStatus({
        job_status: "completed",
        phase: "done",
        pptx_ready: true,
      });
    },
    download: async () => {
      pptxDownloads += 1;
      pptxStaleThenReadyCalls.record("GET /export/pptx");
      if (pptxDownloads === 1) {
        throw new ReportApiError(
          409,
          "PPTX is stale after edits; request export again",
        );
      }
      return PPTX_BLOB;
    },
    delay: async (ms) => {
      pptxStaleThenReadyCalls.record(`delay:${ms}`);
    },
    now: () => 1_700_000_000_000,
    startedAtMs: 1_700_000_000_000,
  });
  assert.equal(pptxAfterStaleDownload, PPTX_BLOB);
  assert.deepEqual(pptxStaleThenReadyCalls.calls, [
    "POST /export/pptx",
    "GET /export/pptx",
    "GET /export/pptx/status",
    "GET /export/pptx",
  ]);

  await assert.rejects(
    () =>
      runPptxRebuildThenDownload({
        queue: async () => queuedPptx(),
        fetchStatus: async () =>
          pptxStatus({
            job_status: "failed",
            error: "Narration failed",
            pptx_ready: false,
          }),
        download: async () => PPTX_BLOB,
        delay: async () => undefined,
        now: () => 1_700_000_000_000,
        startedAtMs: 1_700_000_000_000,
      }),
    (error: unknown) =>
      error instanceof ReportApiError &&
      error.status === 500 &&
      error.message === "Narration failed",
  );

  await assert.rejects(
    () =>
      runPptxRebuildThenDownload({
        queue: async () => {
          throw new ReportApiError(500, "PPTX export failed");
        },
        fetchStatus: async () => pptxStatus(),
        download: async () => PPTX_BLOB,
        delay: async () => undefined,
      }),
    (error: unknown) =>
      error instanceof ReportApiError && error.status === 500,
  );

  await assert.rejects(
    () =>
      runPptxRebuildThenDownload({
        queue: async () => queuedPptx(),
        fetchStatus: async () => pptxStatus(),
        download: async () => PPTX_BLOB,
        delay: async () => undefined,
        now: () => 1_700_000_000_000 + PPTX_POLL_BUDGET_MS,
        startedAtMs: 1_700_000_000_000,
      }),
    (error: unknown) =>
      error instanceof ReportApiError &&
      error.status === 408 &&
      error.message === PPTX_POLL_TIMEOUT_MESSAGE,
  );
}

testRebuildThenPollSequences().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
