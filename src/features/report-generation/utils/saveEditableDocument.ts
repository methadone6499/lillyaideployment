import { getEditingErrorCode } from "../api/reportApiError";
import type {
  EditableDocumentResponse,
  EditingActor,
  EditingErrorCode,
  SaveEditableDocumentInput,
} from "../types";
import { getReportRequestErrorMessage } from "./getReportRequestErrorMessage";

export const SAVE_EDITABLE_DOCUMENT_MISSING_ACTOR_MESSAGE =
  "Your account is required to save edits.";

export const SAVE_EDITABLE_DOCUMENT_GENERIC_FAILURE_MESSAGE =
  "Unable to save this section. Try again.";

export const SAVE_EDITABLE_DOCUMENT_ERROR_MESSAGES: Record<
  EditingErrorCode,
  string
> = {
  stale_revision:
    "This section changed since you started editing. Refresh the document and try again.",
  duplicate_client_op_id:
    "This save request was already used. Save again to persist your changes.",
  inactive_section:
    "This section is no longer part of the current report. Refresh the report to continue.",
  report_not_editable:
    "This report cannot be edited in its current status.",
  validation_failed:
    "These edits change a protected part of the report. Keep the original structure and try saving again.",
  section_not_ready: "This section is not ready to edit yet.",
};

export type SaveEditableDocumentConflictAction =
  | "refresh_document"
  | "refresh_report_status"
  | "none";

export function createClientOperationId(): string {
  return crypto.randomUUID();
}

export function createSaveEditableDocumentInput(args: {
  document: Pick<EditableDocumentResponse, "revision" | "blocks">;
  acceptedRewriteIds: readonly string[];
  actor: EditingActor | null;
  clientOpId?: string;
}):
  | { ok: true; input: SaveEditableDocumentInput }
  | { ok: false; error: string } {
  if (!args.actor) {
    return { ok: false, error: SAVE_EDITABLE_DOCUMENT_MISSING_ACTOR_MESSAGE };
  }

  return {
    ok: true,
    input: {
      base_revision: args.document.revision,
      document: { blocks: args.document.blocks },
      accepted_rewrite_ids: args.acceptedRewriteIds
        .map((rewriteId) => rewriteId.trim())
        .filter((rewriteId) => rewriteId.length > 0),
      actor: args.actor,
      client_op_id: args.clientOpId ?? createClientOperationId(),
    },
  };
}

export function getSaveEditableDocumentConflictAction(
  error: unknown,
): SaveEditableDocumentConflictAction {
  const code = getEditingErrorCode(error);
  if (code === "stale_revision") {
    return "refresh_document";
  }
  if (code === "inactive_section") {
    return "refresh_report_status";
  }
  return "none";
}

export function shouldRetrySaveEditableDocument(): boolean {
  return false;
}

export function getSaveEditableDocumentFailureMessage(error: unknown): string {
  const code = getEditingErrorCode(error);
  if (code) {
    return SAVE_EDITABLE_DOCUMENT_ERROR_MESSAGES[code];
  }

  if (error instanceof Error && "code" in error && error.code === "invalid_response") {
    return "We could not confirm this section was saved. Check the latest version before trying again.";
  }
  return getReportRequestErrorMessage(error, SAVE_EDITABLE_DOCUMENT_GENERIC_FAILURE_MESSAGE);
}
