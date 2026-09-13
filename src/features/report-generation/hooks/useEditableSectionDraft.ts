"use client";

import { useState } from "react";
import type { EditableBlock, EditableDocumentResponse } from "../types";
import {
  cloneEditableDocument,
  editableDocumentsMatch,
  withEditableDocumentBlocks,
} from "../utils/reportBlockEditing";
import {
  appendAcceptedRewriteId,
  shouldResetAcceptedRewriteIds,
} from "../utils/rewritePreview";
import { useEditableDocument } from "./useReportEditing";

type UseEditableSectionDraftOptions = {
  reportServiceId: string;
  sectionId: string | null;
  isEditing: boolean;
  shouldLoadDocument: boolean;
  sessionDocument?: EditableDocumentResponse;
};

export function useEditableSectionDraft({
  reportServiceId,
  sectionId,
  isEditing,
  shouldLoadDocument,
  sessionDocument,
}: UseEditableSectionDraftOptions) {
  const query = useEditableDocument(
    reportServiceId,
    sectionId,
    shouldLoadDocument && Boolean(sectionId),
  );
  const source = query.data ?? sessionDocument ?? null;
  const [saved, setSaved] = useState<EditableDocumentResponse | null>(null);
  const [draft, setDraft] = useState<EditableDocumentResponse | null>(null);
  const [syncedSource, setSyncedSource] =
    useState<EditableDocumentResponse | null>(null);
  const [acceptedRewriteIds, setAcceptedRewriteIds] = useState<string[]>([]);

  const isDirty = !editableDocumentsMatch(draft, saved);

  const applyPersistedDocument = (document: EditableDocumentResponse) => {
    const nextSaved = cloneEditableDocument(document);
    setSaved(nextSaved);
    setDraft(cloneEditableDocument(nextSaved));
    setAcceptedRewriteIds([]);
    setSyncedSource(document);
  };

  if (source !== syncedSource) {
    setSyncedSource(source);
    if (source && (!isDirty || !draft || !saved)) {
      if (shouldResetAcceptedRewriteIds(saved, source)) {
        setAcceptedRewriteIds([]);
      }
      const nextSaved = cloneEditableDocument(source);
      setSaved(nextSaved);
      setDraft(cloneEditableDocument(nextSaved));
    }
  }

  const isError =
    isEditing && Boolean(sectionId) && !sessionDocument && !draft && query.isError;
  const isLoading = isEditing && !draft && !isError;
  const isPersistedDocumentLoading =
    shouldLoadDocument && !source && query.isLoading;
  const isPersistedDocumentError =
    shouldLoadDocument && !source && query.isError;

  const setDraftBlocks = (blocks: EditableBlock[]) => {
    setDraft((current) =>
      current ? withEditableDocumentBlocks(current, blocks) : current,
    );
  };

  const acceptRewriteId = (rewriteId: string) => {
    setAcceptedRewriteIds((current) =>
      appendAcceptedRewriteId(current, rewriteId),
    );
  };

  const discardDraft = () => {
    if (saved) {
      setDraft(cloneEditableDocument(saved));
    }
    setAcceptedRewriteIds([]);
  };

  const refreshFromServer = async () => {
    const result = await query.refetch();
    if (result.error) {
      throw result.error;
    }
    if (!result.data) {
      return null;
    }

    applyPersistedDocument(result.data);
    return result.data;
  };

  return {
    draft,
    saved,
    persistedDocument: source,
    revision: draft?.revision ?? source?.revision ?? null,
    acceptedRewriteIds,
    isDirty,
    isLoading,
    isError,
    isPersistedDocumentLoading,
    isPersistedDocumentError,
    error: query.error,
    setDraftBlocks,
    acceptRewriteId,
    applyPersistedDocument,
    refreshFromServer,
    discardDraft,
  };
}
