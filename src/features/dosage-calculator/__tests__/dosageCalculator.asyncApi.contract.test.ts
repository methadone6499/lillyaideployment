import assert from "node:assert/strict";

import {
  DOSAGE_CALCULATOR_API_ROOT,
  DOSAGE_CALCULATOR_STATUS_POLL_INTERVAL_MS,
  getDosageCalculatorResultPath,
  getDosageCalculatorStatusPath,
} from "../api/dosageCalculatorApi";
import { DosageCalculatorApiError } from "../api/dosageCalculatorFetch";
import { dosageCalculatorQueryKeys } from "../api/dosageCalculatorQueryKeys";
import type { DosageCalculatorStatusResponse } from "../schemas/dosageCalculatorSchemas";
import {
  classifyDosageCalculatorError,
  DosageCalculatorJobFailedError,
  getDosageCalculatorFailedJobError,
  isDosageCalculatorAbortError,
} from "../utils/classifyDosageCalculatorError";
import { isDosageCalculatorQueryKey } from "../utils/clearDosageCalculatorSession";
import {
  shouldRetryDosageCalculatorEnqueue,
  shouldRetryDosageCalculatorResultQuery,
  shouldRetryDosageCalculatorStatusQuery,
} from "../utils/shouldRetryDosageCalculatorQuery";

const JOB_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const POLL_URLS = {
  status: `/api/v1/dosage-calculator/${JOB_ID}`,
  result: `/api/v1/dosage-calculator/${JOB_ID}/result`,
  markdown: `/api/v1/dosage-calculator/${JOB_ID}/markdown`,
};

function buildFailedStatus(
  overrides: Partial<DosageCalculatorStatusResponse> = {},
): DosageCalculatorStatusResponse {
  return {
    job_id: JOB_ID,
    job_status: "failed",
    phase: "extract",
    progress: { percent: 40, detail: "Label extraction failed" },
    error: "DailyMed download failed",
    poll_urls: POLL_URLS,
    ...overrides,
  };
}

assert.equal(DOSAGE_CALCULATOR_STATUS_POLL_INTERVAL_MS, 4_000);
assert.equal(DOSAGE_CALCULATOR_API_ROOT, "/dosage-calculator");
assert.equal(
  getDosageCalculatorStatusPath(JOB_ID),
  `/dosage-calculator/${JOB_ID}`,
);
assert.equal(
  getDosageCalculatorResultPath(JOB_ID),
  `/dosage-calculator/${JOB_ID}/result`,
);
assert.equal(getDosageCalculatorResultPath(JOB_ID).includes("markdown"), false);
assert.equal(getDosageCalculatorStatusPath(JOB_ID).includes("markdown"), false);
assert.throws(() => getDosageCalculatorStatusPath(""));
assert.throws(() => getDosageCalculatorResultPath("   "));

assert.deepEqual(dosageCalculatorQueryKeys.root, ["dosage-calculator"]);
assert.deepEqual(dosageCalculatorQueryKeys.status(JOB_ID), [
  "dosage-calculator",
  "job",
  JOB_ID,
  "status",
]);
assert.deepEqual(dosageCalculatorQueryKeys.result(JOB_ID), [
  "dosage-calculator",
  "job",
  JOB_ID,
  "result",
]);
assert.equal(isDosageCalculatorQueryKey(dosageCalculatorQueryKeys.root), true);
assert.equal(isDosageCalculatorQueryKey(["report", JOB_ID]), false);

const workerError = classifyDosageCalculatorError(
  new DosageCalculatorApiError(503, "Celery worker is not reachable"),
);
assert.equal(workerError?.kind, "worker_unavailable");
assert.equal(workerError?.retryable, true);
assert.match(workerError?.message ?? "", /unavailable|try again/i);

const stillProcessing = classifyDosageCalculatorError(
  new DosageCalculatorApiError(409, "Dosage calculation is still processing"),
);
assert.equal(stillProcessing?.kind, "still_processing");
assert.equal(stillProcessing?.retryable, false);

const missingJob = classifyDosageCalculatorError(
  new DosageCalculatorApiError(404, "Job not found"),
);
assert.equal(missingJob?.kind, "job_not_found");
assert.equal(missingJob?.retryable, false);
assert.match(missingJob?.message ?? "", /not be found|start a new/i);

const failedStatus = buildFailedStatus();
const failedJobError = getDosageCalculatorFailedJobError(failedStatus);
assert.ok(failedJobError instanceof DosageCalculatorJobFailedError);
assert.equal(failedJobError?.jobId, JOB_ID);
assert.equal(failedJobError?.phase, "extract");
assert.equal(failedJobError?.message, "DailyMed download failed");

const classifiedFailure = classifyDosageCalculatorError(failedJobError);
assert.equal(classifiedFailure?.kind, "job_failed");
assert.equal(classifiedFailure?.retryable, true);
assert.equal(classifiedFailure?.message, "DailyMed download failed");

assert.equal(
  getDosageCalculatorFailedJobError(
    buildFailedStatus({ job_status: "completed", error: null, phase: "done" }),
  ),
  null,
);
assert.equal(getDosageCalculatorFailedJobError(undefined), null);

const failedWithoutDetail = classifyDosageCalculatorError(
  new DosageCalculatorJobFailedError(
    buildFailedStatus({ error: null, job_status: "failed" }),
  ),
);
assert.equal(failedWithoutDetail?.kind, "job_failed");
assert.match(failedWithoutDetail?.message ?? "", /failed/i);

assert.equal(classifyDosageCalculatorError(null), null);
assert.equal(
  classifyDosageCalculatorError(new DOMException("Aborted", "AbortError")),
  null,
);
assert.equal(
  isDosageCalculatorAbortError(new DOMException("Aborted", "AbortError")),
  true,
);
assert.equal(
  isDosageCalculatorAbortError(new DosageCalculatorApiError(503, "down")),
  false,
);

assert.equal(
  shouldRetryDosageCalculatorEnqueue(
    0,
    new DosageCalculatorApiError(503, "worker down"),
  ),
  false,
);
assert.equal(
  shouldRetryDosageCalculatorEnqueue(
    0,
    new DosageCalculatorApiError(409, "conflict"),
  ),
  false,
);
assert.equal(
  shouldRetryDosageCalculatorEnqueue(
    0,
    new DosageCalculatorApiError(404, "missing"),
  ),
  false,
);
assert.equal(
  shouldRetryDosageCalculatorEnqueue(0, new TypeError("network")),
  true,
);
assert.equal(
  shouldRetryDosageCalculatorEnqueue(
    0,
    new DosageCalculatorApiError(500, "boom"),
  ),
  true,
);
assert.equal(
  shouldRetryDosageCalculatorEnqueue(
    2,
    new DosageCalculatorApiError(500, "boom"),
  ),
  false,
);
assert.equal(
  shouldRetryDosageCalculatorEnqueue(
    0,
    new DOMException("Aborted", "AbortError"),
  ),
  false,
);

assert.equal(
  shouldRetryDosageCalculatorStatusQuery(
    0,
    new DosageCalculatorApiError(404, "missing"),
  ),
  false,
);
assert.equal(
  shouldRetryDosageCalculatorResultQuery(
    0,
    new DosageCalculatorApiError(409, "still processing"),
  ),
  true,
);
assert.equal(
  shouldRetryDosageCalculatorResultQuery(
    2,
    new DosageCalculatorApiError(409, "still processing"),
  ),
  false,
);
assert.equal(
  shouldRetryDosageCalculatorResultQuery(
    0,
    new DosageCalculatorApiError(404, "missing"),
  ),
  false,
);
assert.equal(
  shouldRetryDosageCalculatorResultQuery(
    0,
    new DosageCalculatorApiError(503, "worker down"),
  ),
  false,
);
