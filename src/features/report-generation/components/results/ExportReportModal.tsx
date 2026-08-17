"use client";

import { CloseIcon } from "@/components/ui";
import { cn } from "@/lib/cn";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type ExportFormat = "pdf" | "docx" | "presentation";

type ExportReportModalProps = {
  open: boolean;
  onClose: () => void;
  onExport: () => Promise<void>;
  isExporting: boolean;
  errorMessage?: string | null;
};

type ExportFormatOption = {
  id: ExportFormat;
  label: string;
  description: string;
  available: boolean;
};

const EXPORT_FORMATS: ExportFormatOption[] = [
  {
    id: "pdf",
    label: "PDF",
    description: "Submission-ready · A4 NICE template",
    available: true,
  },
  {
    id: "docx",
    label: "Word (DOCX)",
    description: "Editable · track changes preserved",
    available: false,
  },
  {
    id: "presentation",
    label: "Presentation",
    description: "AI-generated slide deck with narration",
    available: false,
  },
];

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function ExportReportModal({
  open,
  onClose,
  onExport,
  isExporting,
  errorMessage,
}: ExportReportModalProps) {
  const [selectedFormat, setSelectedFormat] =
    useState<ExportFormat>("pdf");
  const dialogRef = useRef<HTMLDivElement>(null);
  const selectedFormatRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  const isExportingRef = useRef(isExporting);
  const exportInFlightRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
    isExportingRef.current = isExporting;
  }, [isExporting, onClose]);

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
      selectedFormatRef.current?.focus();
    });

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!isExportingRef.current) {
          event.preventDefault();
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

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
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

  const requestClose = () => {
    if (!isExporting) {
      onClose();
    }
  };

  const handleExport = async () => {
    if (
      selectedFormat !== "pdf" ||
      isExporting ||
      exportInFlightRef.current
    ) {
      return;
    }

    exportInFlightRef.current = true;

    try {
      await onExport();
      onClose();
    } catch {
      // The parent owns and renders the normalized export error message.
    } finally {
      exportInFlightRef.current = false;
    }
  };

  const descriptionIds = errorMessage
    ? "export-report-description export-report-error"
    : "export-report-description";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          requestClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-report-title"
        aria-describedby={descriptionIds}
        aria-busy={isExporting}
        tabIndex={-1}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[560px] flex-col overflow-hidden rounded-button border border-border-default bg-[#171717] font-[family-name:var(--font-inter)] text-white"
      >
        <header className="flex h-[67px] shrink-0 items-center justify-between border-b border-border-default px-6">
          <h2
            id="export-report-title"
            className="text-card-title font-medium text-white"
          >
            Export report
          </h2>
          <button
            type="button"
            onClick={requestClose}
            disabled={isExporting}
            className="inline-flex size-6 items-center justify-center text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close export report"
          >
            <CloseIcon className="size-5" />
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto px-6 pb-6 pt-5">
          <p
            id="export-report-description"
            className="text-input leading-[18px] text-text-muted"
          >
            Choose a format. Citations and tables will be preserved.
          </p>

          <fieldset className="mt-5 grid grid-cols-1 gap-4 min-[600px]:grid-cols-3">
            <legend className="sr-only">Export format</legend>
            {EXPORT_FORMATS.map((format) => {
              const isSelected = selectedFormat === format.id;

              return (
                <label
                  key={format.id}
                  className={cn(
                    "relative flex min-h-[123px] flex-col rounded-button border p-[15px] transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand",
                    isSelected
                      ? "border-brand/20 bg-[rgba(16,185,129,0.12)]"
                      : "border-border-default bg-surface-default",
                    format.available ? "cursor-pointer" : "cursor-not-allowed",
                  )}
                >
                  <input
                    ref={format.id === "pdf" ? selectedFormatRef : undefined}
                    type="radio"
                    name="export-format"
                    value={format.id}
                    checked={isSelected}
                    disabled={!format.available || isExporting}
                    onChange={() => setSelectedFormat(format.id)}
                    className="sr-only"
                  />

                  <span className="relative size-4" aria-hidden>
                    <Image
                      src="/report-generation/export/format-document.svg"
                      alt=""
                      width={14}
                      height={15}
                      className="absolute left-px top-px h-[15px] w-[14px]"
                    />
                  </span>

                  <span
                    aria-hidden
                    className="absolute right-3 top-[11px] flex size-[14px] items-center justify-center rounded-button border border-border-default bg-surface-default"
                  >
                    {isSelected && (
                      <span className="size-2 rounded-full bg-brand" />
                    )}
                  </span>

                  <span className="mt-4 text-label font-medium leading-normal text-white">
                    {format.label}
                  </span>
                  <span className="mt-2 text-helper leading-[18px] text-text-muted">
                    {format.description}
                  </span>
                </label>
              );
            })}
          </fieldset>

          {errorMessage && (
            <p
              id="export-report-error"
              className="mt-4 text-helper leading-[18px] text-red-400"
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          <footer className="mt-9 flex flex-wrap items-center justify-end gap-7">
            <button
              type="button"
              onClick={requestClose}
              disabled={isExporting}
              className="inline-flex h-[42px] items-center justify-center text-label font-medium text-white/72 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={isExporting || selectedFormat !== "pdf"}
              className="inline-flex h-[42px] items-center justify-center gap-2 rounded-button bg-brand pl-[18px] pr-3 text-label font-medium text-white transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? "Exporting…" : "Export"}
              <span className="relative size-[18px]" aria-hidden>
                <Image
                  src="/report-generation/export/download-arrow.svg"
                  alt=""
                  width={12}
                  height={12}
                  className="absolute left-0.75 top-0.75 size-3"
                />
              </span>
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
