import {
  PPTX_EXPORT_DEFAULT_PROGRESS_LABEL,
  PPTX_EXPORT_PHASE_LABELS,
  PPTX_POLL_BUDGET_MS,
  PPTX_POLL_INTERVAL_MS,
  type PptxExportPhaseLabelKey,
} from "../constants/pptxExport";
import type { PptxExportProgress } from "../types";

export function getPptxPhaseLabel(
  phase: string | null | undefined,
): string | null {
  if (!phase || !Object.hasOwn(PPTX_EXPORT_PHASE_LABELS, phase)) {
    return null;
  }

  return PPTX_EXPORT_PHASE_LABELS[phase as PptxExportPhaseLabelKey];
}

export function formatPptxExportProgress(
  progress: PptxExportProgress | undefined,
  phase?: string | null,
): string {
  const phaseLabel = getPptxPhaseLabel(phase);
  const detail = progress?.detail?.trim() ?? "";
  const percent =
    typeof progress?.percent === "number"
      ? `${Math.round(progress.percent)}%`
      : "";

  const parts: string[] = [];
  if (phaseLabel) {
    parts.push(phaseLabel);
  }
  if (detail && detail !== phaseLabel) {
    parts.push(detail);
  }

  const message =
    parts.length === 0
      ? PPTX_EXPORT_DEFAULT_PROGRESS_LABEL
      : parts.length === 2
        ? `${parts[0]}: ${parts[1]}`
        : parts[0];

  return percent ? `${message} (${percent})` : message;
}

export function getRemainingPptxPollBudgetMs(
  startedAtMs: number,
  nowMs: number,
): number {
  return PPTX_POLL_BUDGET_MS - (nowMs - startedAtMs);
}

export function hasPptxPollBudgetElapsed(
  startedAtMs: number,
  nowMs: number,
): boolean {
  return getRemainingPptxPollBudgetMs(startedAtMs, nowMs) <= 0;
}

export function getPptxPollDelayMs(
  startedAtMs: number,
  nowMs: number,
): number | null {
  const remainingMs = getRemainingPptxPollBudgetMs(startedAtMs, nowMs);
  if (remainingMs <= 0) {
    return null;
  }

  return Math.min(PPTX_POLL_INTERVAL_MS, remainingMs);
}
