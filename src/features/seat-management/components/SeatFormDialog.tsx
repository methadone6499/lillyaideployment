"use client";

import { useEffect, useId, useRef, type FormEvent, type ReactNode } from "react";

import { cn } from "@/lib/cn";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type SeatFormDialogProps = {
  open: boolean;
  title: string;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  confirmTone?: "brand" | "danger";
  hideConfirm?: boolean;
  cancelLabel?: string;
  closeDisabled?: boolean;
  children: ReactNode;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function SeatFormDialog({
  open,
  title,
  confirmLabel = "Confirm",
  confirmDisabled = false,
  confirmTone = "brand",
  hideConfirm = false,
  cancelLabel = "Cancel",
  closeDisabled = false,
  children,
  onClose,
  onSubmit,
}: SeatFormDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLFormElement>(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    closeDisabledRef.current = closeDisabled;
  }, [closeDisabled]);

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
      const initialField =
        dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]");
      initialField?.focus();
    });

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (!closeDisabledRef.current) {
          onCloseRef.current();
        }

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
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !closeDisabled) {
          onClose();
        }
      }}
    >
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        noValidate
        onSubmit={onSubmit}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[640px] flex-col overflow-hidden rounded-button border border-border-default bg-[#171717] font-[family-name:var(--font-inter)] text-white shadow-2xl"
      >
        <header className="flex min-h-[58px] shrink-0 items-center border-b border-border-default px-6 py-4">
          <h2 id={titleId} className="text-card-title font-medium text-white">
            {title}
          </h2>
        </header>

        <div className="min-h-0 overflow-y-auto px-6 py-6 sm:px-7">
          {children}
        </div>

        <footer
          className={cn(
            "flex shrink-0 items-center gap-4 border-t border-border-default px-6 py-5 sm:px-7",
            hideConfirm ? "justify-end" : "justify-between",
          )}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            className="inline-flex h-[42px] items-center justify-center rounded-button border border-border-default bg-white/[0.04] px-[18px] text-label font-medium text-white/72 transition-colors hover:bg-surface-default hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          {hideConfirm ? null : (
            <button
              type="submit"
              disabled={confirmDisabled}
              className={cn(
                "inline-flex h-[42px] items-center justify-center rounded-button px-[18px] text-label font-medium text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                confirmTone === "danger"
                  ? "bg-[#d92244] hover:bg-[#c01e3c] focus-visible:outline-[#d92244]"
                  : "bg-brand hover:bg-brand/90 focus-visible:outline-brand",
              )}
            >
              {confirmLabel}
            </button>
          )}
        </footer>
      </form>
    </div>
  );
}
