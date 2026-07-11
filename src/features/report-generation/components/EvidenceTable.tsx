"use client";

import { cn } from "@/lib/cn";
import {
  Checkbox,
  ChevronDownIcon,
  ChevronUpIcon,
  RadioCircle,
} from "@/components/ui";
import type { ArticleCandidate } from "../types";
import { getTextAvailability } from "../utils/getTextAvailability";
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

function getPmcLink(item: ArticleCandidate): string | null {
  if (item.pmc_url) return item.pmc_url;
  if (item.pmcid) {
    return `https://pmc.ncbi.nlm.nih.gov/articles/${item.pmcid}/`;
  }
  return item.pubmed_url ?? null;
}

export function EvidenceTable({
  items,
  selectedPmcids,
  onToggle,
  onSelectAll,
}: EvidenceTableProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const selectableItems = items.filter(
    (item): item is ArticleCandidate & { pmcid: string } =>
      Boolean(item.pmcid),
  );

  const allSelected =
    selectableItems.length > 0 &&
    selectableItems.every((item) => selectedPmcids.includes(item.pmcid));

  const evidenceRowClass =
    "grid grid-cols-[40px_minmax(0,1fr)_167px_122px_116px_140px_32px]";

  return (
    <div className="flex flex-col gap-6">
      <div
        className={cn(
          evidenceRowClass,
          "h-14 items-center rounded-card bg-surface-subtle px-7",
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
        <span />
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
          const pmcLink = getPmcLink(item);

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
              <div className={cn(evidenceRowClass, "items-center px-7 py-8")}>
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

                <div className="min-w-0 overflow-hidden pr-4">
                  <p
                    className="wrap-break-word text-card-title font-medium leading-7 text-white"
                    title={item.title}
                  >
                    {item.title}
                  </p>
                </div>

                <span className="inline-flex h-[42px] max-w-[103px] items-center whitespace-nowrap rounded-card bg-brand-badge px-4 text-body-lg font-normal text-white">
                  {getTextAvailability(item) === "full_text"
                    ? "Full Text"
                    : "Abstract"}
                </span>

                <span className="text-body-lg text-text-primary">
                  {item.year}
                </span>

                {pmcLink ? (
                  <a
                    href={pmcLink}
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
