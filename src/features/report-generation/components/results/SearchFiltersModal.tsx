"use client";

import type { GenerationFilters } from "@/features/reports";
import { useEffect } from "react";
import { Chip, CloseIcon } from "@/components/ui";
import { getAppliedSearchFilters } from "../../utils/getAppliedSearchFilters";

type SearchFiltersModalProps = {
  open: boolean;
  onClose: () => void;
  filters: GenerationFilters;
};

export function SearchFiltersModal({
  open,
  onClose,
  filters,
}: SearchFiltersModalProps) {
  const groups = getAppliedSearchFilters(filters);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-filters-modal-title"
        className="flex max-h-[min(90vh,820px)] w-full max-w-[1000px] flex-col overflow-hidden rounded-button border border-border-default bg-[#171717]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-6 pb-4 pt-[25px]">
          <h2
            id="search-filters-modal-title"
            className="text-card-title font-medium text-white"
          >
            LillyAI Search Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-6 items-center justify-center text-white transition-opacity hover:opacity-80"
            aria-label="Close search filters"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="h-px w-full shrink-0 bg-border-default" aria-hidden />

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6 pt-6">
          <p className="text-input leading-[18px] text-text-muted">
            Search criteria and filters applied to retrieve evidence from
            database
          </p>

          {groups.length > 0 ? (
            <div className="flex flex-col gap-6">
              {groups.map((group) => (
                <section
                  key={group.title}
                  className="flex flex-col gap-8 rounded-card border border-border-default bg-surface-default p-6"
                >
                  <h3 className="text-base font-medium text-white">
                    {group.title}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {group.labels.map((label) => (
                      <Chip
                        key={label}
                        selected
                        tabIndex={-1}
                        className="pointer-events-none"
                      >
                        {label}
                      </Chip>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No filters applied.</p>
          )}
        </div>
      </div>
    </div>
  );
}
