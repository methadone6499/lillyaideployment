"use client";

import { cn } from "@/lib/cn";
import {
  Checkbox,
  ChevronDownIcon,
  ChevronUpIcon,
  RadioCircle,
} from "@/components/ui";
import type { ArticleCandidate } from "../types";
import { getArticleSelectionId } from "../utils/getArticleSelectionId";
import { getTextAvailability } from "../utils/getTextAvailability";
import { useState } from "react";

const relevanceNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

function formatRelevanceNumber(value: number): string {
  return relevanceNumberFormatter.format(value);
}

function formatCriterionName(criterion: string): string {
  const words = criterion.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

type EvidenceTableProps = {
  items: ArticleCandidate[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onUploadArticle?: (article: ArticleCandidate) => void;
};

function getSourceLink(item: ArticleCandidate): string | null {
  if (item.pmcid) {
    return (
      item.pmc_url ??
      `https://pmc.ncbi.nlm.nih.gov/articles/${item.pmcid}/`
    );
  }
  return (
    item.pubmed_url ??
    (item.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${item.pmid}/` : null)
  );
}

export function EvidenceTable({
  items,
  selectedIds,
  onToggle,
  onSelectAll,
  onUploadArticle,
}: EvidenceTableProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const selectableIds = items.map(getArticleSelectionId);
  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.includes(id));

  const evidenceRowClass =
    "grid min-w-[1000px] grid-cols-[40px_minmax(260px,1fr)_130px_104px_90px_86px_86px_32px] gap-x-4";

  return (
    <div className="flex flex-col gap-6 overflow-x-auto">
      <div
        className={cn(
          evidenceRowClass,
          "h-14 items-center rounded-card bg-surface-subtle px-7",
        )}
      >
        <Checkbox
          checked={allSelected}
          onChange={() => {
            if (selectableIds.length === 0) return;
            onSelectAll(allSelected ? [] : selectableIds);
          }}
          aria-label="Select all evidence"
        />

        <span className="text-body-lg font-medium text-text-muted">Title</span>
        <span className="text-body-lg font-medium text-text-muted">AI score</span>
        <span />
        <span className="text-body-lg font-medium text-text-muted">Year</span>
        <span className="text-body-lg font-medium text-text-muted">PMC</span>
        <span className="text-body-lg font-medium text-text-muted">DOI</span>
        <span />
      </div>

      <div className="flex flex-col gap-6">
        {items.map((item) => {
          const selectionId = getArticleSelectionId(item);
          const selected = selectedIds.includes(selectionId);
          const expanded = expandedKey === selectionId;
          const sourceLink = getSourceLink(item);
          const textAvailability = getTextAvailability(item);
          const relevanceCriteria = Object.entries(
            item.relevance_criteria ?? {},
          );
          const legacyRelevanceBreakdown = Object.entries(
            item.relevance_breakdown ?? {},
          );

          return (
            <div
              key={selectionId}
              className={cn(
                "rounded-card border",
                selected
                  ? "border-brand-border bg-brand-bg"
                  : "border-border-default bg-surface-default",
              )}
            >
              <div className={cn(evidenceRowClass, "items-center px-7 py-8")}>
                <RadioCircle
                  selected={selected}
                  onClick={() => onToggle(selectionId)}
                  aria-label={`Select ${item.title}`}
                />

                <div className="min-w-0 overflow-hidden pr-4">
                  <p
                    className="line-clamp-3 wrap-break-word text-card-title font-medium leading-7 text-white"
                    title={item.title}
                  >
                    {item.title}
                  </p>
                </div>

                <span className="text-body-lg font-medium text-text-primary">
                  <span className="block">
                    {item.relevance_score == null
                      ? "Not scored"
                      : `${formatRelevanceNumber(item.relevance_score)} / 100`}
                  </span>
                </span>

                <span className="inline-flex h-[42px] max-w-[103px] justify-self-start items-center whitespace-nowrap rounded-card bg-brand-badge px-4 text-body-lg font-normal text-white">
                  {textAvailability === "full_text" ? "Full Text" : "Abstract"}
                </span>

                <span className="text-body-lg text-text-primary">
                  {item.year}
                </span>

                {sourceLink ? (
                  <a
                    href={sourceLink}
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
                  onClick={() =>
                    setExpandedKey(expanded ? null : selectionId)
                  }
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
                      AI relevance
                    </span>
                    <span className="text-text-muted">
                      {item.relevance_reason ??
                        "This article was retained, but the relevance scorer did not return an explanation."}
                    </span>

                    {relevanceCriteria.length > 0 ? (
                      <>
                        <span className="font-medium text-text-heading">
                          Score details
                        </span>
                        <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
                          {relevanceCriteria.map(([criterion, details]) => (
                            <div
                              key={criterion}
                              className="grid grid-cols-[minmax(0,1fr)_auto] grid-rows-2 items-center gap-x-3 rounded-card border border-border-default bg-surface-subtle px-3 py-2 text-helper"
                            >
                              <span className="col-start-1 row-start-1 font-medium text-text-heading">
                                {formatCriterionName(criterion)}
                              </span>
                              <span className="col-start-1 row-start-2 text-text-primary">
                                {details.label}
                              </span>
                              <span className="col-start-2 row-span-2 row-start-1 whitespace-nowrap text-right text-text-muted">
                                {`${formatRelevanceNumber(details.points)} / ${formatRelevanceNumber(details.max_points)} points · ${formatRelevanceNumber(details.match_percent)}% match`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : legacyRelevanceBreakdown.length > 0 ? (
                      <>
                        <span className="font-medium text-text-heading">
                          Score details
                        </span>
                        <span className="flex flex-wrap gap-2 text-text-muted">
                          {legacyRelevanceBreakdown.map(
                            ([criterion, matchPercent]) => (
                              <span
                                key={criterion}
                                className="rounded-card border border-border-default bg-surface-subtle px-3 py-1 text-helper"
                              >
                                {formatCriterionName(criterion)}: {" "}
                                {formatRelevanceNumber(matchPercent)}% match
                              </span>
                            ),
                          )}
                        </span>
                      </>
                    ) : null}

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
                  {onUploadArticle ? (
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onUploadArticle(item)}
                        className="inline-flex h-11 items-center rounded-button border border-border-default bg-surface-default px-4 text-label font-medium text-white transition-colors hover:border-brand-border hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        {textAvailability === "full_text"
                          ? "Replace PDF"
                          : "Upload PDF"}
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
