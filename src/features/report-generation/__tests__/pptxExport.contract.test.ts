import assert from "node:assert/strict";

import {
  PPTX_EXPORT_DEFAULT_PROGRESS_LABEL,
  PPTX_EXPORT_PHASE_LABELS,
  PPTX_EXPORT_PHASES,
  PPTX_POLL_BUDGET_MS,
  PPTX_POLL_INTERVAL_MS,
  PPTX_POLL_TIMEOUT_MESSAGE,
} from "../constants/pptxExport";
import {
  pptxExportPhaseSchema,
  pptxExportQueueResponseSchema,
  pptxExportStatusResponseSchema,
} from "../schemas/reportSchemas";
import {
  formatPptxExportProgress,
  getPptxPhaseLabel,
  getPptxPollDelayMs,
  getRemainingPptxPollBudgetMs,
  hasPptxPollBudgetElapsed,
} from "../utils/pptxExportProgress";

const REPORT_ID = "0ec01d40-a63d-49bf-9275-007f2db66fb7";
const JOB_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const STARTED_AT = 1_700_000_000_000;

assert.deepEqual(PPTX_EXPORT_PHASES, [
  "queued",
  "pass1",
  "pass2",
  "render",
  "voiceover",
  "tts",
  "done",
]);

for (const phase of PPTX_EXPORT_PHASES) {
  assert.equal(pptxExportPhaseSchema.parse(phase), phase);
}

assert.equal(pptxExportPhaseSchema.safeParse("voiceover").success, true);
assert.equal(pptxExportPhaseSchema.safeParse("tts").success, true);
assert.equal(pptxExportPhaseSchema.safeParse("processing").success, false);
assert.equal(pptxExportPhaseSchema.safeParse("label").success, false);
assert.equal(pptxExportPhaseSchema.safeParse("extract").success, false);
assert.equal(pptxExportPhaseSchema.safeParse("").success, false);

assert.equal(getPptxPhaseLabel("voiceover"), PPTX_EXPORT_PHASE_LABELS.voiceover);
assert.equal(getPptxPhaseLabel("tts"), PPTX_EXPORT_PHASE_LABELS.tts);
assert.equal(getPptxPhaseLabel("queued"), PPTX_EXPORT_PHASE_LABELS.queued);
assert.equal(getPptxPhaseLabel("unknown"), null);
assert.equal(getPptxPhaseLabel(null), null);

assert.equal(
  formatPptxExportProgress(undefined),
  PPTX_EXPORT_DEFAULT_PROGRESS_LABEL,
);
assert.equal(
  formatPptxExportProgress(undefined, "voiceover"),
  PPTX_EXPORT_PHASE_LABELS.voiceover,
);
assert.equal(
  formatPptxExportProgress(
    { percent: 82, detail: "Writing narration for slide 4" },
    "voiceover",
  ),
  `${PPTX_EXPORT_PHASE_LABELS.voiceover}: Writing narration for slide 4 (82%)`,
);
assert.equal(
  formatPptxExportProgress(
    { percent: 91, detail: "Synthesizing audio" },
    "tts",
  ),
  `${PPTX_EXPORT_PHASE_LABELS.tts}: Synthesizing audio (91%)`,
);
assert.equal(
  formatPptxExportProgress({ detail: "Extracting presentation content" }),
  "Extracting presentation content",
);

const voiceoverStatus = pptxExportStatusResponseSchema.parse({
  report_id: REPORT_ID,
  job_id: JOB_ID,
  job_status: "processing",
  phase: "voiceover",
  progress: { percent: 70, detail: "Writing narration" },
  error: null,
  slide_count: 12,
  pptx_ready: false,
  poll_urls: {
    status: `/api/v1/reports/${REPORT_ID}/export/pptx/status`,
    download: `/api/v1/reports/${REPORT_ID}/export/pptx`,
  },
});
assert.equal(voiceoverStatus.phase, "voiceover");
assert.equal(voiceoverStatus.pptx_ready, false);
assert.equal(
  formatPptxExportProgress(voiceoverStatus.progress, voiceoverStatus.phase),
  `${PPTX_EXPORT_PHASE_LABELS.voiceover}: Writing narration (70%)`,
);

const ttsStatus = pptxExportStatusResponseSchema.parse({
  report_id: REPORT_ID,
  job_id: JOB_ID,
  job_status: "processing",
  phase: "tts",
  progress: { percent: 88, detail: "Generating speech" },
  error: null,
  pptx_ready: false,
});
assert.equal(ttsStatus.phase, "tts");

const doneStatus = pptxExportStatusResponseSchema.parse({
  report_id: REPORT_ID,
  job_id: JOB_ID,
  job_status: "completed",
  phase: "done",
  progress: { percent: 100, detail: "Presentation ready" },
  error: null,
  slide_count: 12,
  pptx_ready: true,
});
assert.equal(doneStatus.phase, "done");
assert.equal(doneStatus.job_status, "completed");
assert.equal(doneStatus.pptx_ready, true);
assert.equal(
  formatPptxExportProgress(doneStatus.progress, doneStatus.phase),
  `${PPTX_EXPORT_PHASE_LABELS.done} (100%)`,
);

const queued = pptxExportQueueResponseSchema.parse({
  job_id: JOB_ID,
  report_id: REPORT_ID,
  job_status: "queued",
  phase: "queued",
  message: "PPTX export queued",
});
assert.equal(queued.phase, "queued");

assert.equal(
  pptxExportStatusResponseSchema.safeParse({
    report_id: REPORT_ID,
    job_status: "processing",
    phase: "processing",
    pptx_ready: false,
  }).success,
  false,
);

assert.equal(PPTX_POLL_INTERVAL_MS, 2_000);
assert.equal(PPTX_POLL_BUDGET_MS, 15 * 60 * 1000);
assert.equal(PPTX_POLL_BUDGET_MS > FIVE_MINUTES_MS, true);
assert.equal(PPTX_POLL_BUDGET_MS > 150 * PPTX_POLL_INTERVAL_MS, true);
assert.match(PPTX_POLL_TIMEOUT_MESSAGE, /15 minutes/i);
assert.match(PPTX_POLL_TIMEOUT_MESSAGE, /backend may still/i);

assert.equal(getRemainingPptxPollBudgetMs(STARTED_AT, STARTED_AT), PPTX_POLL_BUDGET_MS);
assert.equal(hasPptxPollBudgetElapsed(STARTED_AT, STARTED_AT), false);
assert.equal(
  hasPptxPollBudgetElapsed(STARTED_AT, STARTED_AT + FIVE_MINUTES_MS),
  false,
);
assert.equal(
  getPptxPollDelayMs(STARTED_AT, STARTED_AT + FIVE_MINUTES_MS),
  PPTX_POLL_INTERVAL_MS,
);
assert.equal(
  getPptxPollDelayMs(STARTED_AT, STARTED_AT + PPTX_POLL_BUDGET_MS - 500),
  500,
);
assert.equal(
  getPptxPollDelayMs(STARTED_AT, STARTED_AT + PPTX_POLL_BUDGET_MS),
  null,
);
assert.equal(
  hasPptxPollBudgetElapsed(STARTED_AT, STARTED_AT + PPTX_POLL_BUDGET_MS),
  true,
);
assert.equal(
  hasPptxPollBudgetElapsed(STARTED_AT, STARTED_AT + PPTX_POLL_BUDGET_MS + 1),
  true,
);
