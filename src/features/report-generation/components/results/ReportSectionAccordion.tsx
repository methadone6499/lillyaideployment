"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Badge,
  ChevronDownIcon,
  ChevronUpIcon,
  StatusPill,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { reportQueryKeys } from "../../api/reportQueryKeys";
import { useReportSection } from "../../hooks/useGenerateReport";
import type {
  ReportSectionContent,
  ReportSectionResponse,
  ReportStatusSection,
  SectionType,
} from "../../types";
import {
  cloneReportSectionContent,
  reportSectionContentMatches,
} from "../../utils/reportBlockEditing";
import { EditableSectionContent } from "./EditableSectionContent";
import { ReportEditorConfirmationDialog } from "./ReportEditorConfirmationDialog";
import { SectionContentRenderer } from "./SectionContentRenderer";

export type ReportSectionAccordionItem = {
  section: ReportStatusSection;
  order: number;
  title: string;
  description: string;
  accordionKey: string;
  pendingContext?: string[];
  /** Frontend-only sections render this content locally without an API fetch. */
  localContent?: ReportSectionContent;
};

type ReportSectionAccordionProps = {
  reportServiceId: string;
  reportStatus: string;
  item: ReportSectionAccordionItem;
  expanded: boolean;
  isEditing: boolean;
  sessionContent?: ReportSectionContent;
  onToggle: (element: HTMLDivElement) => void;
  onRequestEdit: (element: HTMLDivElement) => void;
  onStopEditing: () => void;
  onDirtyChange: (accordionKey: string, dirty: boolean) => void;
  onSessionSave: (
    accordionKey: string,
    content: ReportSectionContent,
  ) => void;
};

export function ReportSectionAccordion({
  reportServiceId,
  reportStatus,
  item,
  expanded,
  isEditing,
  sessionContent,
  onToggle,
  onRequestEdit,
  onStopEditing,
  onDirtyChange,
  onSessionSave,
}: ReportSectionAccordionProps) {
  const { section, order, title, description, localContent, accordionKey } = item;
  const isLocalSection = localContent !== undefined;
  const isComplete = section.status === "completed";
  const isPartiallyComplete = section.status === "partially_completed";
  const canExpand =
    (isComplete || isPartiallyComplete) &&
    (isLocalSection || Boolean(section.section_id));
  const canEdit = isComplete && canExpand;

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
  const queryClient = useQueryClient();
  const rootRef = useRef<HTMLDivElement>(null);
  const sourceContentRef = useRef<ReportSectionContent | undefined>(undefined);
  const [savedContent, setSavedContent] = useState<ReportSectionContent | null>(
    null,
  );
  const [draftContent, setDraftContent] = useState<ReportSectionContent | null>(
    null,
  );
  const [confirmation, setConfirmation] = useState<"save" | "discard" | null>(
    null,
  );

  const apiContent = isLocalSection ? localContent : sectionContent?.content;
  const sourceContent = sessionContent ?? apiContent;
  const isDirty = !reportSectionContentMatches(draftContent, savedContent);

  useEffect(() => {
    if (!sourceContent) {
      return;
    }

    const sourceChanged = sourceContentRef.current !== sourceContent;
    if ((sourceChanged && !isEditing) || !draftContent || !savedContent) {
      const nextSavedContent = cloneReportSectionContent(sourceContent);
      setSavedContent(nextSavedContent);
      setDraftContent(cloneReportSectionContent(nextSavedContent));
    }
    sourceContentRef.current = sourceContent;
  }, [draftContent, isEditing, savedContent, sourceContent]);

  useEffect(() => {
    onDirtyChange(accordionKey, isDirty);
  }, [accordionKey, isDirty, onDirtyChange]);

  useEffect(
    () => () => {
      onDirtyChange(accordionKey, false);
    },
    [accordionKey, onDirtyChange],
  );

  const toggle = () => {
    if (rootRef.current && canExpand) {
      onToggle(rootRef.current);
    }
  };

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

  const discardDraft = () => {
    if (savedContent) {
      setDraftContent(cloneReportSectionContent(savedContent));
    }
    setConfirmation(null);
    onDirtyChange(accordionKey, false);
    onStopEditing();
  };

  const saveDraftForSession = () => {
    if (!draftContent) {
      return;
    }

    const snapshot = cloneReportSectionContent(draftContent);
    setSavedContent(snapshot);
    setDraftContent(cloneReportSectionContent(snapshot));
    onSessionSave(accordionKey, snapshot);

    if (!isLocalSection && section.section_id) {
      const queryKey = reportQueryKeys.section(
        reportServiceId,
        section.section_id,
        section.status,
        reportStatus,
      );
      queryClient.setQueryData<ReportSectionResponse>(queryKey, (current) =>
        current ? { ...current, content: snapshot } : current,
      );
    }

    setConfirmation(null);
    onDirtyChange(accordionKey, false);
    onStopEditing();
  };

  const renderedContent = sessionContent ?? apiContent;

  return (
    <div
      ref={rootRef}
      className={cn(
        "rounded-card border",
        expanded
          ? "border-brand-border bg-brand-bg"
          : "border-border-default bg-surface-default",
      )}
    >
      <div className="flex items-center gap-5 px-8 py-6">
        <button
          type="button"
          onClick={toggle}
          disabled={!canExpand}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
            !canExpand && "cursor-default",
          )}
        >
          <Badge variant="brand" className="size-12 shrink-0">
            {order}
          </Badge>
          <span className="min-w-0 flex-1">
            <span className="block text-card-title font-medium text-white">
              {title}
            </span>
            {description ? (
              <span className="mt-4 block text-helper text-text-muted">
                {description}
              </span>
            ) : null}
            {section.error && (
              <span className="mt-3 block text-helper text-red-400" role="alert">
                {section.error}
              </span>
            )}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-5">
          {sessionContent && !isEditing && (
            <span className="hidden text-helper text-brand sm:inline" role="status">
              Saved for this session
            </span>
          )}
          <StatusPill status={section.status} />
          {isEditing ? (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={stopEditing}
                className="text-label font-medium text-white/72 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Cancel
              </button>
              {isDirty && (
                <button
                  type="button"
                  onClick={() => setConfirmation("save")}
                  className="inline-flex h-10 items-center rounded-button bg-brand px-4 text-label font-medium text-white transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
          {canExpand && (
            <button
              type="button"
              onClick={toggle}
              className="inline-flex size-8 items-center justify-center text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
              aria-expanded={expanded}
            >
              {expanded ? (
                <ChevronUpIcon />
              ) : (
                <ChevronDownIcon className="size-6" />
              )}
            </button>
          )}
        </div>
      </div>

      {expanded && canExpand && (
        <div className="border-t border-border-default px-8 pb-10 pt-8">
          {isContentLoading && !renderedContent && (
            <p className="text-body-lg text-text-muted">Loading section…</p>
          )}
          {isContentError && !renderedContent && (
            <p className="text-body-lg text-red-400" role="alert">
              {contentError instanceof Error
                ? contentError.message
                : "Unable to load section content."}
            </p>
          )}
          {isEditing && draftContent ? (
            <div className="text-body-lg">
              <p className="mb-8 rounded-card border border-brand-border bg-brand-bg px-4 py-3 text-helper text-text-muted">
                Edit text directly. Highlight text inside one editable field to
                open Rewrite with AI. Changes are saved only for this session.
              </p>
              <EditableSectionContent
                reportServiceId={reportServiceId}
                sectionId={section.section_id ?? accordionKey}
                content={draftContent}
                skipFirstHeading={!isLocalSection}
                onChange={setDraftContent}
              />
            </div>
          ) : (
            renderedContent && (
              <div className="text-body-lg">
                <SectionContentRenderer
                  content={renderedContent}
                  skipFirstHeading={!isLocalSection}
                />
              </div>
            )
          )}
        </div>
      )}

      <ReportEditorConfirmationDialog
        open={confirmation === "save"}
        title={`Save changes to ${title}?`}
        description="This preview updates the report only for this browser session. The original generated content will return after a refresh until the editing API is connected."
        confirmLabel="Save for session"
        onConfirm={saveDraftForSession}
        onCancel={() => setConfirmation(null)}
      />
      <ReportEditorConfirmationDialog
        open={confirmation === "discard"}
        title="Discard unsaved changes?"
        description={`Your unsaved edits to ${title} will be removed.`}
        confirmLabel="Discard changes"
        onConfirm={discardDraft}
        onCancel={() => setConfirmation(null)}
      />
    </div>
  );
}

export function getSectionAccordionKey(
  section: ReportStatusSection,
  sectionType: SectionType,
): string {
  return section.section_id ?? sectionType;
}
