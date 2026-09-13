import {
  createRewritePreviewInputSchema,
  restoreRevisionInputSchema,
  saveEditableDocumentInputSchema,
  type CreateRewritePreviewInput,
  type CreateRewritePreviewRequest,
  type EditingActor,
  type RestoreRevisionInput,
  type SaveEditableDocumentInput,
  type SaveEditableDocumentRequest,
} from "../schemas/editingSchemas";

export function toRewritePresetSectionType(sectionType: string): string {
  const trimmed = sectionType.trim();
  if (trimmed === "custom" || trimmed.startsWith("custom:")) {
    return "custom";
  }
  return trimmed;
}

export function toEditingActor(user: {
  id: string;
  full_name?: string | null;
}): EditingActor {
  const name = user.full_name?.trim();
  return {
    id: user.id,
    name: name || user.id,
  };
}

export function getRewritePresetsPath(sectionType?: string | null): string {
  const trimmed = sectionType?.trim();
  if (!trimmed) {
    return "/rewrite-presets";
  }

  const params = new URLSearchParams({
    section_type: toRewritePresetSectionType(trimmed),
  });
  return `/rewrite-presets?${params.toString()}`;
}

export function getEditableDocumentPath(
  reportServiceId: string,
  sectionId: string,
): string {
  return `/reports/${reportServiceId}/sections/${sectionId}/editable-document`;
}

export function getRewritePreviewsPath(
  reportServiceId: string,
  sectionId: string,
): string {
  return `/reports/${reportServiceId}/sections/${sectionId}/rewrite-previews`;
}

export function getSectionRevisionsPath(
  reportServiceId: string,
  sectionId: string,
): string {
  return `/reports/${reportServiceId}/sections/${sectionId}/revisions`;
}

export function getSectionRevisionPath(
  reportServiceId: string,
  sectionId: string,
  revision: number,
): string {
  return `${getSectionRevisionsPath(reportServiceId, sectionId)}/${revision}`;
}

export function getRestoreSectionRevisionPath(
  reportServiceId: string,
  sectionId: string,
  revision: number,
): string {
  return `${getSectionRevisionPath(reportServiceId, sectionId, revision)}/restore`;
}

export function buildCreateRewritePreviewRequest(
  input: CreateRewritePreviewInput,
): CreateRewritePreviewRequest {
  const parsed = createRewritePreviewInputSchema.parse(input);
  const request = {
    base_revision: parsed.base_revision,
    selection: parsed.selection,
    actor: parsed.actor,
  };

  if (parsed.preset_id) {
    return { ...request, preset_id: parsed.preset_id };
  }

  if (!parsed.instruction) {
    throw new Error("Provide exactly one of preset_id or instruction.");
  }

  return { ...request, instruction: parsed.instruction };
}

export function buildSaveEditableDocumentRequest(
  input: SaveEditableDocumentInput,
): SaveEditableDocumentRequest {
  return saveEditableDocumentInputSchema.parse(input);
}

export function buildRestoreRevisionRequest(
  input: RestoreRevisionInput,
): RestoreRevisionInput {
  return restoreRevisionInputSchema.parse(input);
}
