"use client";

import { Button } from "@/components/ui";
import { useEffect, useRef, useState } from "react";

import { useCreateAdminReportCommentMutation } from "../hooks/useReviewerMutations";
import { useAdminReportComments } from "../hooks/useReviewerQueries";
import { classifyReviewerError } from "../utils/classifyReviewerError";

const localDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatLocalDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : localDateTimeFormatter.format(date);
}

export function AdminReportCommentsDialog({
  reportId,
  reportTitle,
  onClose,
}: {
  reportId: string;
  reportTitle: string;
  onClose: () => void;
}) {
  const [content, setContent] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const commentsQuery = useAdminReportComments(reportId);
  const createMutation = useCreateAdminReportCommentMutation(reportId);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !createMutation.isPending) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [createMutation.isPending, onClose]);

  const handleSave = async () => {
    setSaveError(null);
    try {
      await createMutation.mutateAsync(content.trim());
      setContent("");
    } catch (error) {
      setSaveError(classifyReviewerError(error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !createMutation.isPending) onClose();
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="admin-comments-title" className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-card border border-border-default bg-[#171717] p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="admin-comments-title" className="text-card-title font-medium">Private admin comments</h2>
            <p className="mt-1 text-label text-text-muted">{reportTitle}</p>
          </div>
          <button type="button" className="text-label text-text-muted hover:text-white" onClick={onClose} aria-label="Close comments">Close</button>
        </div>
        <label htmlFor="admin-comment-content" className="mt-6 block text-label font-medium">New comment</label>
        <textarea id="admin-comment-content" ref={inputRef} value={content} onChange={(event) => setContent(event.target.value)} rows={4} className="mt-2 w-full rounded-card border border-border-default bg-surface-subtle p-3 text-label text-white outline-none focus:border-brand" placeholder="Write a private comment..." />
        {saveError ? <p className="mt-2 text-label text-red-400" role="alert">{saveError}</p> : null}
        <div className="mt-3 flex justify-end"><Button disabled={!content.trim() || createMutation.isPending} onClick={() => void handleSave()}>{createMutation.isPending ? "Adding..." : "Add comment"}</Button></div>
        <div className="mt-7 border-t border-border-default pt-5">
          <h3 className="text-label font-medium">Previous comments</h3>
          {commentsQuery.isPending ? <p className="mt-3 text-label text-text-muted">Loading comments...</p> : null}
          {commentsQuery.isError ? <p className="mt-3 text-label text-red-400" role="alert">{classifyReviewerError(commentsQuery.error).message}</p> : null}
          {commentsQuery.data?.items.length === 0 ? <p className="mt-3 text-label text-text-muted">No comments yet.</p> : null}
          <div className="mt-3 space-y-3">
            {commentsQuery.data?.items.map((comment) => (
              <article key={comment.id} className="rounded-card border border-border-default bg-surface-subtle p-4">
                <p className="whitespace-pre-wrap text-label text-text-body">{comment.content}</p>
                <p className="mt-2 text-helper text-text-muted">{formatLocalDateTime(comment.created_at)}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
