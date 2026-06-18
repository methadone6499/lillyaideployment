"use client";

import { cn } from "@/lib/cn";
import {
  Checkbox,
  ChevronDownIcon,
  ChevronUpIcon,
  RadioCircle,
} from "@/components/ui";
import type { ArticleCandidate } from "../types";
import { useState } from "react";

type EvidenceTableProps = {
  items: ArticleCandidate[];
  selectedPmcids: string[];
  onToggle: (pmcid: string) => void;
  onSelectAll: (pmcids: string[]) => void;
};

function getRowKey(item: ArticleCandidate): string {
  return item.pmcid ?? item.pmid;
}

export function EvidenceTable({
  items,
  selectedPmcids,
  onToggle,
  onSelectAll,
}: EvidenceTableProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(
    items[0] ? getRowKey(items[0]) : null,
  );

  const selectableItems = items.filter(
    (item): item is ArticleCandidate & { pmcid: string } =>
      Boolean(item.pmcid),
  );

  const allSelected =
    selectableItems.length > 0 &&
    selectableItems.every((item) => selectedPmcids.includes(item.pmcid));

  const evidenceGridClass =
    "grid grid-cols-[40px_minmax(0,1fr)_96px_112px_112px_32px] items-center gap-5";

  return (
    <div className="flex flex-col gap-6">
      <div
        className={cn(
          evidenceGridClass,
          "h-14 rounded-card bg-surface-subtle px-7",
        )}
      >
        <Checkbox
          checked={allSelected}
          onChange={() => {
            if (selectableItems.length === 0) return;
            onSelectAll(
              allSelected
                ? []
                : selectableItems.map((item) => item.pmcid),
            );
          }}
          aria-label="Select all evidence"
        />

        <span className="text-body-lg font-medium text-text-muted">Title</span>
        <span className="text-body-lg font-medium text-text-muted">Year</span>
        <span className="text-body-lg font-medium text-text-muted">PMC</span>
        <span className="text-body-lg font-medium text-text-muted">DOI</span>
        <span />
      </div>

      <div className="flex flex-col gap-6">
        {items.map((item) => {
          const rowKey = getRowKey(item);
          const selectable = Boolean(item.pmcid);
          const selected = selectable && selectedPmcids.includes(item.pmcid!);
          const expanded = expandedKey === rowKey;

          return (
            <div
              key={rowKey}
              className={cn(
                "rounded-card border",
                selected
                  ? "border-brand-border bg-brand-bg"
                  : "border-border-default bg-surface-default",
                !selectable && "opacity-70",
              )}
            >
              <div className={cn(evidenceGridClass, "px-7 py-8")}>
                <RadioCircle
                  selected={selected}
                  onClick={
                    selectable && item.pmcid
                      ? () => onToggle(item.pmcid!)
                      : undefined
                  }
                  aria-label={`Select ${item.title}`}
                  className={cn(!selectable && "cursor-not-allowed opacity-50")}
                />

                <span className="min-w-0 text-card-title font-medium text-white">
                  {item.title}
                </span>

                <span className="text-body-lg text-text-primary">
                  {item.year}
                </span>

                {item.pmcid ? (
                  <a
                    href={`https://pmc.ncbi.nlm.nih.gov/articles/${item.pmcid}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body-lg font-medium text-brand underline"
                  >
                    Link
                  </a>
                ) : (
                  <span className="text-body-lg text-text-muted">—</span>
                )}

                {item.doi ? (
                  <a
                    href={`https://doi.org/${item.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body-lg font-medium text-brand underline"
                  >
                    Link
                  </a>
                ) : (
                  <span className="text-body-lg text-text-muted">—</span>
                )}

                <button
                  type="button"
                  onClick={() => setExpandedKey(expanded ? null : rowKey)}
                  className="text-white"
                  aria-label={expanded ? "Collapse" : "Expand"}
                >
                  {expanded ? (
                    <ChevronUpIcon />
                  ) : (
                    <ChevronDownIcon className="size-6" />
                  )}
                </button>
              </div>

              {expanded && (
                <div className="border-t border-border-default px-[83px] pb-8 pt-6">
                  <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-6 gap-y-5 text-body-lg">
                    <span className="font-medium text-text-heading">
                      Authors
                    </span>
                    <span className="text-text-muted">
                      {item.authors.length > 0
                        ? item.authors.join(", ")
                        : "—"}
                    </span>

                    <span className="font-medium text-text-heading">
                      Journal
                    </span>
                    <span className="text-text-muted">{item.journal}</span>

                    <span className="font-medium text-text-heading">
                      Abstract
                    </span>
                    <p className="leading-report-lg text-text-muted">
                      {item.abstract}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
