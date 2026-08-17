"use client";

import { CloseIcon } from "@/components/ui";
import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type ReportEditorConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ReportEditorConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Continue editing",
  onConfirm,
  onCancel,
}: ReportEditorConfirmationDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => {
      cancelRef.current?.focus();
    });
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="report-editor-confirmation-title"
        aria-describedby="report-editor-confirmation-description"
        tabIndex={-1}
        className="w-full max-w-[480px] overflow-hidden rounded-button border border-border-default bg-[#171717] font-[family-name:var(--font-inter)] text-white"
      >
        <header className="flex h-[67px] items-center justify-between border-b border-border-default px-6">
          <h2
            id="report-editor-confirmation-title"
            className="text-card-title font-medium"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex size-6 items-center justify-center transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label="Close confirmation"
          >
            <CloseIcon className="size-5" />
          </button>
        </header>

        <div className="px-6 pb-6 pt-6">
          <p
            id="report-editor-confirmation-description"
            className="text-label leading-6 text-text-body"
          >
            {description}
          </p>
          <footer className="mt-8 flex flex-wrap items-center justify-end gap-7">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="inline-flex h-[42px] items-center text-label font-medium text-white/72 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex h-[42px] items-center rounded-button bg-brand px-[18px] text-label font-medium text-white transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {confirmLabel}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
