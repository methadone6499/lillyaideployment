"use client";

import { Button, CloseIcon } from "@/components/ui";
import { useEffect, useId, useRef } from "react";
import type { Reviewer } from "../schemas/reviewerSchemas";

type ReviewerStatusDialogProps = {
  reviewer: Pick<Reviewer, "email">;
  activate: boolean;
  pending: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ReviewerStatusDialog({
  reviewer,
  activate,
  pending,
  errorMessage,
  onCancel,
  onConfirm,
}: ReviewerStatusDialogProps) {
  const id = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const latest = useRef({ pending, onCancel });

  useEffect(() => {
    latest.current = { pending, onCancel };
  }, [pending, onCancel]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!latest.current.pending) latest.current.onCancel();
        return;
      }
      if (event.key !== "Tab") return;
      const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>(
        "button:not([disabled])",
      );
      const first = buttons?.[0];
      const last = buttons?.[buttons.length - 1];
      if (!first || !last) {
        event.preventDefault();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
      else document.getElementById("reviewers-title")?.focus();
    };
  }, []);

  const action = activate ? "Reactivate" : "Suspend";
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        aria-busy={pending}
        className="w-full max-w-[500px] rounded-surface border border-border-default bg-[#171717] text-white"
      >
        <header className="flex items-center justify-between gap-4 border-b border-border-default px-6 py-4">
          <h2 id={`${id}-title`} className="text-card-title font-medium">{action} reviewer?</h2>
          <button type="button" disabled={pending} onClick={onCancel} aria-label="Close confirmation" className="inline-flex size-10 shrink-0 items-center justify-center rounded-field text-text-muted hover:bg-surface-elevated hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed">
            <CloseIcon className="size-5" />
          </button>
        </header>
        <div className="p-6">
          <p className="break-all text-label font-medium">{reviewer.email}</p>
          <p id={`${id}-description`} className="mt-3 text-label leading-6 text-text-body">
            {activate
              ? "Reactivating restores reviewer access and makes this reviewer eligible for new assignments."
              : "This reviewer will lose access to reviewer tools and will no longer receive new assignments."}
          </p>
          {errorMessage ? <p role="alert" className="mt-4 text-label text-status-danger">{errorMessage}</p> : null}
          <footer className="mt-6 flex flex-wrap justify-end gap-3">
            <Button ref={cancelRef} variant="secondary" disabled={pending} onClick={onCancel}>Cancel</Button>
            <Button variant={activate ? "primary" : "destructiveSolid"} disabled={pending} onClick={onConfirm}>
              {pending ? (activate ? "Reactivating…" : "Suspending…") : `${action} reviewer`}
            </Button>
          </footer>
        </div>
      </div>
    </div>
  );
}
