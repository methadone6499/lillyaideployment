"use client";

import { useEffect, useRef, useState } from "react";
import { HistoryIcon, StatusPill } from "@/components/ui";
import { useAuthUser } from "@/features/auth";
import { ReportApiError } from "../../api/reportFetch";
import { useEditableSectionDraft } from "../../hooks/useEditableSectionDraft";
import { useReportSection } from "../../hooks/useGenerateReport";
import { useSaveEditableDocumentMutation } from "../../hooks/useReportEditing";
import type { EditableBlock, EditableDocumentResponse } from "../../types";
import {
  canExpandReportSection,
  type ReportSectionAccordionItem,
} from "../../utils/buildReportSectionItems";
import { toEditingActor } from "../../utils/reportEditing";
import { toReportSectionContent } from "../../utils/reportBlockEditing";
import { toDisplayVersion } from "../../utils/revisionHistory";
import {
  createSaveEditableDocumentInput,
  getSaveEditableDocumentConflictAction,
  getSaveEditableDocumentFailureMessage,
  type SaveEditableDocumentConflictAction,
} from "../../utils/saveEditableDocument";
import { EditableSectionContent } from "./EditableSectionContent";
import { ReportEditorConfirmationDialog } from "./ReportEditorConfirmationDialog";
import { ReportSectionAccordionFrame } from "./ReportSectionPresentation";
import { RevisionHistoryModal } from "./RevisionHistoryModal";
import { SectionContentRenderer } from "./SectionContentRenderer";

export type { ReportSectionAccordionItem };

type ReportSectionAccordionProps = {
  reportServiceId: string;
  reportStatus: string;
  item: ReportSectionAccordionItem;
  expanded: boolean;
  isEditing: boolean;
  sessionDocument?: EditableDocumentResponse;
  onToggle: (element: HTMLDivElement) => void;
  onRequestEdit: (element: HTMLDivElement) => void;
  onStopEditing: () => void;
  onDirtyChange: (accordionKey: string, dirty: boolean) => void;
  onDocumentSaved: (
    accordionKey: string,
    document: EditableDocumentResponse,
  ) => void;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ReportApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function ReportSectionAccordion({
  reportServiceId,
  reportStatus,
  item,
  expanded,
  isEditing,
  sessionDocument,
  onToggle,
  onRequestEdit,
  onStopEditing,
  onDirtyChange,
  onDocumentSaved,
}: ReportSectionAccordionProps) {
  const { section, order, title, description, localContent, accordionKey } = item;
  const isLocalSection = localContent !== undefined;
  const sectionId = section.section_id ?? null;
  const canExpand = canExpandReportSection(section, isLocalSection);
  const canEdit =
    reportStatus === "completed" &&
    section.status === "completed" &&
    Boolean(sectionId);

  const {
    data: sectionContent,
    isLoading: isContentLoading,
    isError: isContentError,
    error: contentError,
  } = useReportSection(
    reportServiceId,
    section.section_id,
    !isLocalSection && canExpand && expanded,
    section.status,
    reportStatus,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const [confirmation, setConfirmation] = useState<"save" | "discard" | null>(
    null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [saveConflictAction, setSaveConflictAction] =
    useState<SaveEditableDocumentConflictAction>("none");
  const { user } = useAuthUser();
  const actor = user ? toEditingActor(user) : null;
  const saveMutation = useSaveEditableDocumentMutation();
  const {
    draft,
    persistedDocument,
    acceptedRewriteIds,
    isDirty,
    isLoading: isDocumentLoading,
    isError: isDocumentError,
    isPersistedDocumentLoading,
    isPersistedDocumentError,
    error: documentError,
    setDraftBlocks,
    acceptRewriteId,
    applyPersistedDocument,
    refreshFromServer,
    discardDraft,
  } = useEditableSectionDraft({
    reportServiceId,
    sectionId,
    isEditing,
    shouldLoadDocument: canEdit && (expanded || isEditing),
    sessionDocument,
  });
  const isSaving = saveMutation.isPending;

  const apiContent = isLocalSection ? localContent : sectionContent?.content;
  const isWaitingForPersistedDocument =
    canEdit && expanded && isPersistedDocumentLoading;
  const renderedContent = persistedDocument
    ? toReportSectionContent(persistedDocument.blocks)
    : isWaitingForPersistedDocument
      ? undefined
      : apiContent;
  const isReadOnlyContentLoading =
    isContentLoading || isPersistedDocumentLoading;
  const isReadOnlyContentError =
    isContentError && (!canEdit || isPersistedDocumentError);
  const hasSavedChanges = (persistedDocument?.revision ?? 0) > 0;

  useEffect(() => {
    onDirtyChange(accordionKey, isDirty);
  }, [accordionKey, isDirty, onDirtyChange]);

  useEffect(
    () => () => {
      onDirtyChange(accordionKey, false);
    },
    [accordionKey, onDirtyChange],
  );

  const startEditing = () => {
    if (rootRef.current && canEdit) {
      onRequestEdit(rootRef.current);
    }
  };

  const stopEditing = () => {
    if (isDirty) {
      setConfirmation("discard");
      return;
    }
    onStopEditing();
  };

  const discardUnsavedDraft = () => {
    discardDraft();
    setSaveError(null);
    setSaveConflictAction("none");
    setConfirmation(null);
    onDirtyChange(accordionKey, false);
    onStopEditing();
  };

  const handleDraftBlocks = (blocks: EditableBlock[]) => {
    setSaveError(null);
    setSaveConflictAction("none");
    setDraftBlocks(blocks);
  };

  const persistDraft = async () => {
    if (!draft || !sectionId || isSaving) {
      return;
    }

    const request = createSaveEditableDocumentInput({
      document: draft,
      acceptedRewriteIds,
      actor,
    });
    if (!request.ok) {
      setSaveError(request.error);
      setSaveConflictAction("none");
      setConfirmation(null);
      return;
    }

    setSaveError(null);
    setSaveConflictAction("none");

    try {
      const savedDocument = await saveMutation.mutateAsync({
        reportServiceId,
        sectionId,
        input: request.input,
      });
      applyPersistedDocument(savedDocument);
      onDocumentSaved(accordionKey, savedDocument);
      setConfirmation(null);
      onDirtyChange(accordionKey, false);
      onStopEditing();
    } catch (error) {
      setSaveError(getSaveEditableDocumentFailureMessage(error));
      setSaveConflictAction(getSaveEditableDocumentConflictAction(error));
      setConfirmation(null);
    }
  };

  const handleRefreshDocument = async () => {
    if (isSaving) {
      return;
    }

    try {
      const refreshed = await refreshFromServer();
      if (!refreshed) {
        return;
      }

      onDocumentSaved(accordionKey, refreshed);
      setSaveError(null);
      setSaveConflictAction("none");
    } catch (error) {
      setSaveError(getSaveEditableDocumentFailureMessage(error));
      setSaveConflictAction(getSaveEditableDocumentConflictAction(error));
    }
  };

  const handleRevisionRestored = (document: EditableDocumentResponse) => {
    applyPersistedDocument(document);
    onDocumentSaved(accordionKey, document);
    setSaveError(null);
    setSaveConflictAction("none");
    setIsHistoryOpen(false);
  };

  return (
    <>
      <ReportSectionAccordionFrame
        rootRef={rootRef}
        order={order}
        title={title}
        description={description}
        error={section.error}
        expanded={expanded}
        canExpand={canExpand}
        onToggle={onToggle}
        headerTrailing={
          <>
            {hasSavedChanges && !isEditing && persistedDocument && (
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-button border border-border-default bg-surface-default px-3 text-label font-medium text-white transition-colors hover:border-brand-border hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                aria-label={`View revision history, current version ${toDisplayVersion(persistedDocument.revision)}`}
                title="View revision history"
              >
                <HistoryIcon className="size-4" />
                v{toDisplayVersion(persistedDocument.revision)}
              </button>
            )}
            {isEditing ? (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={stopEditing}
                  disabled={isSaving}
                  className="text-label font-medium text-white/72 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                {isDirty && (
                  <button
                    type="button"
                    onClick={() => setConfirmation("save")}
                    disabled={isSaving}
                    className="inline-flex h-10 items-center rounded-button bg-brand px-4 text-label font-medium text-white transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save changes
                  </button>
                )}
              </div>
            ) : (
              canEdit && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="inline-flex h-10 items-center rounded-button border border-border-default bg-surface-default px-4 text-label font-medium text-white transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Edit
                </button>
              )
            )}
            <StatusPill status={section.status} />
          </>
        }
      >
        {isEditing && isDocumentLoading && (
          <p className="text-body-lg text-text-muted">Loading editor…</p>
        )}
        {isEditing && isDocumentError && (
          <p className="text-body-lg text-red-400" role="alert">
            {getErrorMessage(
              documentError,
              "Unable to load the editable document.",
            )}
          </p>
        )}
        {isEditing && draft && sectionId ? (
          <div className="text-body-lg">
            <p className="mb-8 rounded-card border border-brand-border bg-brand-bg px-4 py-3 text-helper text-text-muted">
              Edit text directly. Highlight text inside one editable field to
              open Rewrite with AI. Tables, labels, and other compiler-owned
              structure cannot be edited.
            </p>
            {saveError && (
              <div
                className="mb-8 rounded-card border border-red-400/30 bg-red-400/10 px-4 py-3"
                role="alert"
              >
                <p className="text-helper text-red-400">{saveError}</p>
                {saveConflictAction === "refresh_document" && (
                  <button
                    type="button"
                    onClick={() => {
                      void handleRefreshDocument();
                    }}
                    className="mt-3 text-helper font-medium text-white transition-colors hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    Refresh document
                  </button>
                )}
              </div>
            )}
            <EditableSectionContent
              reportServiceId={reportServiceId}
              sectionId={sectionId}
              sectionType={draft.section_type}
              revision={draft.revision}
              actor={actor}
              blocks={draft.blocks}
              skipFirstHeading={!isLocalSection}
              onChange={handleDraftBlocks}
              onRewriteAccepted={acceptRewriteId}
            />
          </div>
        ) : (
          !isEditing && (
            <>
              {isReadOnlyContentLoading && !renderedContent && (
                <p className="text-body-lg text-text-muted">Loading section…</p>
              )}
              {isReadOnlyContentError && !renderedContent && (
                <p className="text-body-lg text-red-400" role="alert">
                  {getErrorMessage(
                    contentError,
                    "Unable to load section content.",
                  )}
                </p>
              )}
              {renderedContent && (
                <div className="text-body-lg">
                  <SectionContentRenderer
                    content={renderedContent}
                    skipFirstHeading={!isLocalSection}
                  />
                </div>
              )}
            </>
          )
        )}
      </ReportSectionAccordionFrame>

      <ReportEditorConfirmationDialog
        open={confirmation === "save"}
        title={`Save changes to ${title}?`}
        description="This saves your edits to the report section. You can keep working after a refresh."
        confirmLabel={isSaving ? "Saving…" : "Save changes"}
        isConfirming={isSaving}
        onConfirm={() => {
          void persistDraft();
        }}
        onCancel={() => {
          if (!isSaving) {
            setConfirmation(null);
          }
        }}
      />
      <ReportEditorConfirmationDialog
        open={confirmation === "discard"}
        title="Discard unsaved changes?"
        description={`Your unsaved edits to ${title} will be removed.`}
        confirmLabel="Discard changes"
        onConfirm={discardUnsavedDraft}
        onCancel={() => setConfirmation(null)}
      />
      {isHistoryOpen && sectionId && persistedDocument && (
        <RevisionHistoryModal
          reportServiceId={reportServiceId}
          sectionId={sectionId}
          sectionTitle={title}
          currentRevision={persistedDocument.revision}
          actor={actor}
          skipFirstHeading={!isLocalSection}
          onClose={() => setIsHistoryOpen(false)}
          onRestored={handleRevisionRestored}
        />
      )}
    </>
  );
}
