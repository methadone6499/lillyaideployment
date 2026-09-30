"use client";

import { Button, CloseIcon } from "@/components/ui";
import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ReviewerCompletionDialog({
  open,
  isSubmitting,
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => cancelRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, onCancel, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="review-completion-title"
        aria-describedby="review-completion-description"
        className="w-full max-w-[500px] overflow-hidden rounded-button border border-border-default bg-[#171717] text-white"
      >
        <header className="flex h-[67px] items-center justify-between border-b border-border-default px-6">
          <h2 id="review-completion-title" className="text-card-title font-medium">
            Complete this review?
          </h2>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            aria-label="Close confirmation"
            className="inline-flex size-6 items-center justify-center disabled:opacity-50"
          >
            <CloseIcon className="size-5" />
          </button>
        </header>
        <div className="p-6">
          <p id="review-completion-description" className="text-label leading-6 text-text-body">
            Completing the review makes your notes read-only and unlocks the report for its owner.
          </p>
          <footer className="mt-8 flex flex-wrap justify-end gap-4">
            <button
              ref={cancelRef}
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="inline-flex h-[52px] items-center justify-center rounded-button border border-border-default bg-surface-default px-5 text-body-lg font-medium text-white transition-colors hover:bg-surface-elevated disabled:opacity-50"
            >
              Keep reviewing
            </button>
            <Button disabled={isSubmitting} onClick={onConfirm}>
              {isSubmitting ? "Completing..." : "Complete review"}
            </Button>
          </footer>
        </div>
      </div>
    </div>
  );
}
