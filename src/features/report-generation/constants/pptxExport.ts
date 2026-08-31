export const PPTX_EXPORT_PHASES = [
  "queued",
  "pass1",
  "pass2",
  "render",
  "voiceover",
  "tts",
  "done",
] as const;

export type PptxExportPhaseId = (typeof PPTX_EXPORT_PHASES)[number];

export const PPTX_EXPORT_PHASE_LABELS = {
  queued: "Queued",
  pass1: "Building slides",
  pass2: "Refining slides",
  render: "Rendering presentation",
  voiceover: "Writing voiceover",
  tts: "Generating speech",
  done: "Presentation ready",
} as const satisfies Record<PptxExportPhaseId, string>;

export type PptxExportPhaseLabelKey = keyof typeof PPTX_EXPORT_PHASE_LABELS;

export const PPTX_EXPORT_DEFAULT_PROGRESS_LABEL = "Preparing presentation…";

export const PPTX_POLL_INTERVAL_MS = 2_000;
export const PPTX_POLL_BUDGET_MS = 15 * 60 * 1000;

export const PPTX_POLL_TIMEOUT_MESSAGE =
  "Presentation export timed out after 15 minutes. The backend may still be generating the file — wait a bit and try downloading again.";
