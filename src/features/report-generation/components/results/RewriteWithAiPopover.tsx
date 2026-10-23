"use client";

import { CloseIcon } from "@/components/ui";
import { cn } from "@/lib/cn";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { RewritePreset } from "../../types";
import type { EditableTextSelection } from "../../utils/reportBlockEditing";

type RewriteWithAiPopoverProps = {
  selection: EditableTextSelection;
  presets: RewritePreset[];
  isLoadingPresets: boolean;
  presetsError: string | null;
  isRewriting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onRewrite: (instruction: string, presetId: string | null) => Promise<void>;
};

export function RewriteWithAiPopover({
  selection,
  presets,
  isLoadingPresets,
  presetsError,
  isRewriting,
  errorMessage,
  onClose,
  onRewrite,
}: RewriteWithAiPopoverProps) {
  const [instruction, setInstruction] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const selectedPreset =
    selectedPresetId &&
    presets.some((preset) => preset.preset_id === selectedPresetId)
      ? selectedPresetId
      : null;
  const canSubmit = Boolean(instruction.trim() || selectedPreset);

  const position = useMemo(() => {
    const viewportPadding = 16;
    const selectionGap = 12;
    const panelWidth = Math.min(480, window.innerWidth - viewportPadding * 2);
    const preferredPanelHeight = 440;
    const preferredLeft =
      selection.anchorRect.left + selection.anchorRect.width / 2 - panelWidth / 2;
    const left = Math.min(
      Math.max(viewportPadding, preferredLeft),
      window.innerWidth - panelWidth - viewportPadding,
    );
    const availableBelow = Math.max(
      0,
      window.innerHeight -
        viewportPadding -
        selection.anchorRect.bottom -
        selectionGap,
    );
    const availableAbove = Math.max(
      0,
      selection.anchorRect.top - selectionGap - viewportPadding,
    );
    const placeBelow =
      availableBelow >= preferredPanelHeight || availableBelow >= availableAbove;
    const maxHeight = Math.min(
      preferredPanelHeight,
      Math.max(0, window.innerHeight - viewportPadding * 2),
    );
    const preferredTop = placeBelow
      ? selection.anchorRect.bottom + selectionGap
      : selection.anchorRect.top - selectionGap - maxHeight;
    // Keep the panel usable even when it must overlap the selected text.
    const top = Math.max(
      viewportPadding,
      Math.min(preferredTop, window.innerHeight - viewportPadding - maxHeight),
    );

    return { left, top, width: panelWidth, maxHeight };
  }, [selection]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isRewriting) {
        event.preventDefault();
        onClose();
      }
    };

    const closeOnResize = () => {
      if (!isRewriting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeOnResize);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeOnResize);
    };
  }, [isRewriting, onClose]);

  return createPortal(
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="rewrite-with-ai-title"
      aria-busy={isRewriting || isLoadingPresets}
      className="fixed z-[60] flex flex-col overflow-hidden rounded-surface border border-border-default bg-[#171717] font-[family-name:var(--font-inter)] text-white shadow-2xl"
      style={position}
    >
      <header className="flex h-[67px] shrink-0 items-center justify-between border-b border-border-default px-6">
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
          className="inline-flex size-10 items-center justify-center rounded-field text-text-muted transition-colors hover:bg-surface-elevated hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-muted"
          aria-label="Close rewrite panel"
        >
          <CloseIcon className="size-5" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-6 pt-6">
        <textarea
          value={instruction}
          onChange={(event) => {
            setInstruction(event.target.value);
            if (event.target.value.trim()) {
              setSelectedPresetId(null);
            }
          }}
          disabled={isRewriting}
          placeholder="e.g. Make this more concise and HTA focused..."
          aria-label="Rewrite instruction"
          className="h-24 w-full shrink-0 resize-none rounded-card border border-border-default bg-surface-default px-4 py-4 text-input text-white outline-none transition-[border-color,box-shadow] placeholder:text-text-muted focus-visible:border-brand/60 focus-visible:ring-2 focus-visible:ring-brand/35 disabled:text-text-muted disabled:opacity-100"
        />

        {isLoadingPresets ? (
          <p className="mt-4 text-helper text-white/72">Loading presets…</p>
        ) : presetsError ? (
          <p className="mt-4 text-helper text-red-400" role="status">
            {presetsError}
          </p>
        ) : presets.length === 0 ? (
          <p className="mt-4 text-helper text-white/72">
            No presets available for this section. Enter an instruction instead.
          </p>
        ) : (
          <div
            className="mt-4 flex min-h-28 max-h-32 flex-1 flex-wrap content-start gap-2 overflow-y-auto overscroll-contain"
            aria-label="Rewrite presets"
          >
            {presets.map((preset) => {
              const selected = selectedPreset === preset.preset_id;
              return (
                <button
                  key={preset.preset_id}
                  type="button"
                  aria-pressed={selected}
                  disabled={isRewriting}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setSelectedPresetId(selected ? null : preset.preset_id);
                    setInstruction("");
                  }}
                  className={cn(
                    "inline-flex h-8 items-center rounded-field border px-3 text-helper font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-text-muted",
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
        )}

        {errorMessage && (
          <p className="mt-4 text-helper text-red-400" role="alert">
            {errorMessage}
          </p>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-end gap-7 px-6 pb-6 pt-9">
        <button
          type="button"
          onClick={onClose}
          disabled={isRewriting}
          className="inline-flex h-[52px] items-center rounded-button border border-border-default bg-surface-default px-5 text-label font-medium text-white transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-text-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void onRewrite(instruction, selectedPreset)}
          disabled={isRewriting || !canSubmit}
          className="inline-flex h-[52px] items-center gap-2 rounded-button pr-5 pl-4 bg-brand text-label font-medium text-brand-foreground transition-colors hover:bg-[#059669] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-surface-default disabled:text-text-muted"
        >
          <Image
            src="/report-generation/editing/rewrite-sparkle-white.svg"
            alt=""
            width={20}
            height={20}
            className="size-5 brightness-0"
          />
          {isRewriting ? "Rewriting…" : "Rewrite"}
        </button>
      </footer>
    </aside>,
    document.body,
  );
}
