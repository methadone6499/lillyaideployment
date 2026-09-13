import { isReportApiError } from "../api/reportApiError";
import type {
  CreateRewritePreviewInput,
  EditableBlock,
  EditableDocumentResponse,
  EditingActor,
  RewritePreset,
  RewritePreviewResponse,
  RewritePreviewStatus,
} from "../types";
import { toRewritePresetSectionType } from "./reportEditing";
import {
  applyReplacementBlocks,
  toApiTextSelection,
  type EditableTextSelection,
} from "./reportBlockEditing";

export const REWRITE_PREVIEW_STATUS_MESSAGES: Record<
  Exclude<RewritePreviewStatus, "ready">,
  string
> = {
  stale_selection:
    "This selection is no longer valid. Highlight the text again to rewrite it.",
  stale_revision:
    "This section changed since you started editing. Refresh the document and try again.",
  no_relevant_evidence:
    "No supporting evidence was found for this rewrite. Try a different selection or instruction.",
  evidence_index_not_ready:
    "Evidence lookup is still preparing. Wait a moment and try again.",
  unsupported_request:
    "This rewrite request is not supported. Try a different preset or instruction.",
  validation_failed:
    "The rewrite could not be validated. Adjust the selection or instruction and try again.",
};

export const REWRITE_PREVIEW_APPLY_FAILED_MESSAGE =
  "The rewrite could not be applied to this section. Highlight the text again and try again.";

export const REWRITE_PREVIEW_MISSING_CHOICE_MESSAGE =
  "Choose a preset or enter an instruction.";

export const REWRITE_PREVIEW_BOTH_CHOICES_MESSAGE =
  "Provide a preset or an instruction, not both.";

export const REWRITE_PREVIEW_MISSING_ACTOR_MESSAGE =
  "Your account is required to rewrite with AI.";

export const REWRITE_PREVIEW_STALE_SELECTION_MESSAGE =
  "The selected text changed. Highlight it again to rewrite it.";

export const REWRITE_PREVIEW_GENERIC_FAILURE_MESSAGE =
  "Unable to preview this rewrite. Try again.";

export function filterRewritePresets(
  presets: readonly RewritePreset[],
  sectionType: string,
): RewritePreset[] {
  const normalized = toRewritePresetSectionType(sectionType);
  return presets.filter((preset) =>
    preset.section_types.some(
      (candidate) => toRewritePresetSectionType(candidate) === normalized,
    ),
  );
}

export function getRewritePreviewStatusMessage(
  preview: Pick<RewritePreviewResponse, "status" | "message">,
): string | null {
  if (preview.status === "ready") {
    return null;
  }

  const serverMessage = preview.message?.trim();
  if (serverMessage) {
    return serverMessage;
  }

  return REWRITE_PREVIEW_STATUS_MESSAGES[preview.status];
}

export function getRewritePreviewFailureMessage(error: unknown): string {
  if (isReportApiError(error) && error.message.trim()) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return REWRITE_PREVIEW_GENERIC_FAILURE_MESSAGE;
}

export function resolveRewritePreviewChoice(
  instruction: string,
  presetId: string | null,
):
  | { ok: true; value: { preset_id: string } | { instruction: string } }
  | { ok: false; error: string } {
  const trimmedInstruction = instruction.trim();
  const trimmedPresetId = presetId?.trim() ?? "";
  const hasPreset = trimmedPresetId.length > 0;
  const hasInstruction = trimmedInstruction.length > 0;

  if (hasPreset === hasInstruction) {
    return {
      ok: false,
      error: hasPreset
        ? REWRITE_PREVIEW_BOTH_CHOICES_MESSAGE
        : REWRITE_PREVIEW_MISSING_CHOICE_MESSAGE,
    };
  }

  if (hasPreset) {
    return { ok: true, value: { preset_id: trimmedPresetId } };
  }

  return { ok: true, value: { instruction: trimmedInstruction } };
}

export function createRewritePreviewInputFromEditor(args: {
  baseRevision: number;
  blocks: EditableBlock[];
  selection: Pick<
    EditableTextSelection,
    "target" | "start" | "end" | "selectedText"
  >;
  actor: EditingActor | null;
  instruction: string;
  presetId: string | null;
}):
  | { ok: true; input: CreateRewritePreviewInput }
  | { ok: false; error: string } {
  if (!args.actor) {
    return { ok: false, error: REWRITE_PREVIEW_MISSING_ACTOR_MESSAGE };
  }

  const choice = resolveRewritePreviewChoice(args.instruction, args.presetId);
  if (!choice.ok) {
    return choice;
  }

  const selection = toApiTextSelection(args.blocks, args.selection);
  if (!selection) {
    return { ok: false, error: REWRITE_PREVIEW_STALE_SELECTION_MESSAGE };
  }

  return {
    ok: true,
    input: {
      base_revision: args.baseRevision,
      selection,
      actor: args.actor,
      ...choice.value,
    },
  };
}

export function applyReadyRewritePreview(
  blocks: EditableBlock[],
  preview: Pick<
    RewritePreviewResponse,
    "status" | "rewrite_id" | "replacement_blocks"
  >,
): { blocks: EditableBlock[]; rewriteId: string } | null {
  if (preview.status !== "ready" || preview.replacement_blocks.length === 0) {
    return null;
  }

  const nextBlocks = applyReplacementBlocks(blocks, preview.replacement_blocks);
  if (!nextBlocks) {
    return null;
  }

  return { blocks: nextBlocks, rewriteId: preview.rewrite_id };
}

export function appendAcceptedRewriteId(
  current: readonly string[],
  rewriteId: string,
): string[] {
  const id = rewriteId.trim();
  if (!id || current.includes(id)) {
    return current as string[];
  }

  return [...current, id];
}

export function shouldResetAcceptedRewriteIds(
  saved: Pick<
    EditableDocumentResponse,
    "report_id" | "section_id" | "revision"
  > | null,
  source: Pick<EditableDocumentResponse, "report_id" | "section_id" | "revision">,
): boolean {
  if (!saved) {
    return true;
  }

  return (
    saved.report_id !== source.report_id ||
    saved.section_id !== source.section_id ||
    saved.revision !== source.revision
  );
}
