"use client";

import { CloseIcon } from "@/components/ui";
import { cn } from "@/lib/cn";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReportRewritePreset } from "../../api/reportRewritePreview";
import type { EditableTextSelection } from "../../utils/reportBlockEditing";

const PRESETS: Array<{ id: ReportRewritePreset; label: string }> = [
  { id: "more-concise", label: "More Concise" },
  { id: "executive-tone", label: "Executive Tone" },
  { id: "patient-friendly", label: "Patient-friendly" },
  { id: "add-citation", label: "Add Citation" },
  { id: "stronger-evidence-framing", label: "Stronger Evidence Framing" },
];

type RewriteWithAiPopoverProps = {
  selection: EditableTextSelection;
  isRewriting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onRewrite: (
    instruction: string,
    preset: ReportRewritePreset | null,
  ) => Promise<void>;
};

export function RewriteWithAiPopover({
  selection,
  isRewriting,
  errorMessage,
  onClose,
  onRewrite,
}: RewriteWithAiPopoverProps) {
  const [instruction, setInstruction] = useState("");
  const [selectedPreset, setSelectedPreset] =
    useState<ReportRewritePreset | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const position = useMemo(() => {
    const viewportPadding = 16;
    const panelWidth = Math.min(480, window.innerWidth - viewportPadding * 2);
    const estimatedPanelHeight = 377;
    const preferredLeft =
      selection.anchorRect.left + selection.anchorRect.width / 2 - panelWidth / 2;
    const left = Math.min(
      Math.max(viewportPadding, preferredLeft),
      window.innerWidth - panelWidth - viewportPadding,
    );
    const belowTop = selection.anchorRect.bottom + 12;
    const top =
      belowTop + estimatedPanelHeight <= window.innerHeight - viewportPadding
        ? belowTop
        : Math.max(
            viewportPadding,
            selection.anchorRect.top - estimatedPanelHeight - 12,
          );

    return { left, top, width: panelWidth };
  }, [selection]);

  useEffect(() => {
    const focusFrame = window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isRewriting) {
        event.preventDefault();
        onClose();
      }
    };

    const closeOnViewportChange = () => {
      if (!isRewriting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [isRewriting, onClose]);

  return createPortal(
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="rewrite-with-ai-title"
      aria-busy={isRewriting}
      className="fixed z-[60] overflow-hidden rounded-button border border-border-default bg-[#171717] font-[family-name:var(--font-inter)] text-white shadow-2xl"
      style={position}
    >
      <header className="flex h-[67px] items-center justify-between border-b border-border-default px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/report-generation/editing/rewrite-sparkle-brand.svg"
            alt=""
            width={20}
            height={20}
            className="size-5"
          />
          <h2 id="rewrite-with-ai-title" className="text-card-title font-medium">
            Rewrite with AI
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isRewriting}
          className="inline-flex size-6 items-center justify-center transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50"
          aria-label="Close rewrite panel"
        >
          <CloseIcon className="size-5" />
        </button>
      </header>

      <div className="px-6 pb-6 pt-6">
        <textarea
          ref={inputRef}
          value={instruction}
          onChange={(event) => {
            setInstruction(event.target.value);
            if (event.target.value.trim()) {
              setSelectedPreset(null);
            }
          }}
          disabled={isRewriting}
          placeholder="e.g. Make this more concise and HTA focused..."
          aria-label="Rewrite instruction"
          className="h-24 w-full resize-none rounded-card border border-border-default bg-surface-default px-4 py-4 text-input text-white outline-none placeholder:text-white/36 focus:border-brand/60 disabled:opacity-60"
        />

        <div className="mt-4 flex flex-wrap gap-2" aria-label="Rewrite presets">
          {PRESETS.map((preset) => {
            const selected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                disabled={isRewriting}
                onClick={() => {
                  setSelectedPreset(selected ? null : preset.id);
                  setInstruction("");
                }}
                className={cn(
                  "inline-flex h-8 items-center rounded-card border px-3 text-helper font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50",
                  selected
                    ? "border-brand-chip-border bg-brand-bg text-brand"
                    : "border-border-default bg-surface-default text-white hover:bg-surface-elevated",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {errorMessage && (
          <p className="mt-4 text-helper text-red-400" role="alert">
            {errorMessage}
          </p>
        )}

        <footer className="mt-9 flex items-center justify-end gap-7">
          <button
            type="button"
            onClick={onClose}
            disabled={isRewriting}
            className="inline-flex h-[42px] items-center text-label font-medium text-white/72 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onRewrite(instruction, selectedPreset)}
            disabled={isRewriting}
            className="inline-flex h-[42px] items-center gap-2 rounded-button bg-brand pl-3.5 pr-[18px] text-label font-medium text-white transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Image
              src="/report-generation/editing/rewrite-sparkle-white.svg"
              alt=""
              width={20}
              height={20}
              className="size-5"
            />
            {isRewriting ? "Rewriting…" : "Rewrite"}
          </button>
        </footer>
      </div>
    </aside>,
    document.body,
  );
}
