import {
  editableDocumentResponseSchema,
  rewritePresetListResponseSchema,
  rewritePreviewResponseSchema,
  sectionRevisionListResponseSchema,
  type CreateRewritePreviewInput,
  type EditableDocumentResponse,
  type RestoreRevisionInput,
  type RewritePresetListResponse,
  type RewritePreviewResponse,
  type SaveEditableDocumentInput,
  type SectionRevisionListResponse,
} from "../schemas/editingSchemas";
import {
  buildCreateRewritePreviewRequest,
  buildRestoreRevisionRequest,
  buildSaveEditableDocumentRequest,
  getEditableDocumentPath,
  getRestoreSectionRevisionPath,
  getRewritePresetsPath,
  getRewritePreviewsPath,
  getSectionRevisionPath,
  getSectionRevisionsPath,
} from "../utils/reportEditing";
import { reportFetch } from "./reportFetch";

export async function fetchRewritePresets(
  sectionType?: string | null,
  signal?: AbortSignal,
): Promise<RewritePresetListResponse> {
  return reportFetch(getRewritePresetsPath(sectionType), {
    schema: rewritePresetListResponseSchema,
    signal,
  });
}

export async function fetchEditableDocument(
  reportServiceId: string,
  sectionId: string,
  signal?: AbortSignal,
): Promise<EditableDocumentResponse> {
  return reportFetch(getEditableDocumentPath(reportServiceId, sectionId), {
    schema: editableDocumentResponseSchema,
    signal,
  });
}

export async function saveEditableDocument(
  reportServiceId: string,
  sectionId: string,
  input: SaveEditableDocumentInput,
  signal?: AbortSignal,
): Promise<EditableDocumentResponse> {
  return reportFetch(getEditableDocumentPath(reportServiceId, sectionId), {
    method: "PUT",
    body: buildSaveEditableDocumentRequest(input),
    schema: editableDocumentResponseSchema,
    signal,
  });
}

export async function createRewritePreview(
  reportServiceId: string,
  sectionId: string,
  input: CreateRewritePreviewInput,
  signal?: AbortSignal,
): Promise<RewritePreviewResponse> {
  return reportFetch(getRewritePreviewsPath(reportServiceId, sectionId), {
    method: "POST",
    body: buildCreateRewritePreviewRequest(input),
    schema: rewritePreviewResponseSchema,
    signal,
  });
}

export async function fetchSectionRevisions(
  reportServiceId: string,
  sectionId: string,
  signal?: AbortSignal,
): Promise<SectionRevisionListResponse> {
  return reportFetch(getSectionRevisionsPath(reportServiceId, sectionId), {
    schema: sectionRevisionListResponseSchema,
    signal,
  });
}

export async function fetchSectionRevision(
  reportServiceId: string,
  sectionId: string,
  revision: number,
  signal?: AbortSignal,
): Promise<EditableDocumentResponse> {
  return reportFetch(
    getSectionRevisionPath(reportServiceId, sectionId, revision),
    {
      schema: editableDocumentResponseSchema,
      signal,
    },
  );
}

export async function restoreSectionRevision(
  reportServiceId: string,
  sectionId: string,
  revision: number,
  input: RestoreRevisionInput,
  signal?: AbortSignal,
): Promise<EditableDocumentResponse> {
  return reportFetch(
    getRestoreSectionRevisionPath(reportServiceId, sectionId, revision),
    {
      method: "POST",
      body: buildRestoreRevisionRequest(input),
      schema: editableDocumentResponseSchema,
      signal,
    },
  );
}
