"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HistoryIcon, RequestErrorState, StatusPill } from "@/components/ui";
import { useAuthUser } from "@/features/auth";
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
import { getClaimVerificationGroups } from "../../utils/claimVerification";
import { isTrailingSourceHeading } from "../../utils/viewerSectionContent";
import { getReportRequestErrorMessage } from "../../utils/getReportRequestErrorMessage";
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
import { SectionVerificationPanel } from "./SectionVerificationPanel";

export type { ReportSectionAccordionItem };

type ReportSectionAccordionProps = {
  reportServiceId: string;
  reportStatus: string;
  allowEditing?: boolean;
  hideTrailingSources?: boolean;
  showSaveConfirmation?: boolean;
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
  afterContent?: ReactNode;
};

export function ReportSectionAccordion({
  reportServiceId,
  reportStatus,
  allowEditing = true,
  hideTrailingSources = false,
  showSaveConfirmation = false,
  item,
  expanded,
  isEditing,
  sessionDocument,
  onToggle,
  onRequestEdit,
  onStopEditing,
  onDirtyChange,
  onDocumentSaved,
  afterContent,
}: ReportSectionAccordionProps) {
  const { section, order, title, description, localContent, accordionKey } = item;
  const isLocalSection = localContent !== undefined;
  const sectionId = section.section_id ?? null;
  const canExpand = canExpandReportSection(section, isLocalSection);
  const canEdit =
    allowEditing &&
    reportStatus === "completed" &&
    section.status === "completed" &&
    Boolean(sectionId);

  const {
    data: sectionContent,
    isLoading: isContentLoading,
    isError: isContentError,
    error: contentError,
    isFetching: isContentFetching,
    refetch: retrySection,
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
  const [saved, setSaved] = useState(false);
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
    isFetching: isDocumentFetching,
    retryLoad: retryDocument,
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
  const verificationGroups = getClaimVerificationGroups(
    section.section_type,
    apiContent?.raw,
  );
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
    isContentError || isPersistedDocumentError;
  const hasSavedChanges = (persistedDocument?.revision ?? 0) > 0;
  const shouldHideTrailingSources =
    hideTrailingSources && !isTrailingSourceHeading(title);

  useEffect(() => {
    onDirtyChange(accordionKey, isDirty);
  }, [accordionKey, isDirty, onDirtyChange]);

  useEffect(
    () => () => {
      onDirtyChange(accordionKey, false);
    },
    [accordionKey, onDirtyChange],
  );

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 4_000);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const startEditing = () => {
    if (rootRef.current && canEdit) {
      setSaved(false);
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
    setSaved(false);
    discardDraft();
    setSaveError(null);
    setSaveConflictAction("none");
    setConfirmation(null);
    onDirtyChange(accordionKey, false);
    onStopEditing();
  };

  const handleDraftBlocks = (blocks: EditableBlock[]) => {
    setSaved(false);
    setSaveError(null);
    setSaveConflictAction("none");
    setDraftBlocks(blocks);
  };

  const persistDraft = async () => {
    if (!draft || !sectionId || isSaving) {
      return;
    }

    setSaved(false);
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
      setSaved(showSaveConfirmation);
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

    setSaved(false);
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
    setSaved(false);
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
            {showSaveConfirmation && saved ? (
              <span className="text-label font-medium text-brand" role="status">
                Saved
              </span>
            ) : null}
            {hasSavedChanges && !isEditing && persistedDocument && (
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="inline-flex h-12 items-center gap-2 rounded-button border border-border-default bg-surface-default px-5 text-label font-medium text-white transition-colors hover:border-brand-border hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
                  className="inline-flex h-12 items-center rounded-button border border-border-default bg-surface-default px-5 text-label font-medium text-white transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-text-muted"
                >
                  Cancel
                </button>
                {isDirty && (
                  <button
                    type="button"
                    onClick={() => setConfirmation("save")}
                    disabled={isSaving}
                    className="inline-flex h-12 items-center rounded-button bg-brand px-5 text-label font-medium text-brand-foreground transition-colors hover:bg-[#059669] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-surface-default disabled:text-text-muted"
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
                  className="inline-flex h-12 items-center rounded-button border border-border-default bg-surface-subtle px-5 text-label font-medium text-white transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
          <RequestErrorState
            title="Couldn’t load the editor"
            message={getReportRequestErrorMessage(documentError, "Try loading this section’s editor again. Your report has not been changed.")}
            onRetry={() => void retryDocument()}
            retryPending={isDocumentFetching}
          />
        )}
        {isEditing && draft && sectionId ? (
          <div className="text-body-lg">
            <p className="mb-8 rounded-surface border border-brand-border bg-brand-bg px-4 py-3 text-helper text-text-muted">
              Edit text directly. Highlight text inside one editable field to
              open Rewrite with AI. Tables, labels, and other compiler-owned
              structure cannot be edited.
            </p>
            {saveError && (
              <div
                className="mb-8 rounded-surface border border-red-400/30 bg-red-400/10 px-4 py-3"
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
              hideTrailingSources={shouldHideTrailingSources}
              onChange={handleDraftBlocks}
              onRewriteAccepted={acceptRewriteId}
            />
          </div>
        ) : (
          !isEditing && (
            <>
              {isReadOnlyContentLoading && !isReadOnlyContentError && !renderedContent && (
                <p className="text-body-lg text-text-muted">Loading section…</p>
              )}
              {isReadOnlyContentError && !renderedContent && (
                <RequestErrorState
                  title="Couldn’t load this section"
                  message={getReportRequestErrorMessage(contentError ?? documentError, "Try loading this section again. You can still open other report sections.")}
                  onRetry={() => {
                    if (isContentError) void retrySection();
                    if (isPersistedDocumentError) void retryDocument();
                  }}
                  retryPending={isContentFetching || isDocumentFetching}
                />
              )}
              {isPersistedDocumentError && renderedContent ? (
                <RequestErrorState
                  className="mb-6"
                  title="Couldn’t load saved edits"
                  message={getReportRequestErrorMessage(documentError, "The original section is shown below. Try again to load its saved edits.")}
                  onRetry={() => void retryDocument()}
                  retryPending={isDocumentFetching}
                />
              ) : null}
              {renderedContent && (
                <div className="text-body-lg">
                  <SectionContentRenderer
                    content={renderedContent}
                    skipFirstHeading={!isLocalSection}
                    hideTrailingSources={shouldHideTrailingSources}
                  />
                  <SectionVerificationPanel
                    groups={verificationGroups}
                    isStale={hasSavedChanges}
                    onEdit={canEdit ? startEditing : undefined}
                  />
                </div>
              )}
            </>
          )
        )}
        {afterContent}
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
