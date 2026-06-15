"use client";

import { cn } from "@/lib/cn";
import {
  Checkbox,
  ChevronDownIcon,
  ChevronUpIcon,
  RadioCircle,
} from "@/components/ui";
import type { EvidenceItem } from "../types";
import { useState } from "react";

type EvidenceTableProps = {
  items: EvidenceItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
};

export function EvidenceTable({
  items,
  selectedIds,
  onToggle,
  onSelectAll,
}: EvidenceTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    items[0]?.id ?? null,
  );

  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-14 items-center rounded-card bg-surface-subtle px-[84px]">
        <span className="flex-1 text-body-lg font-medium text-text-muted">
          Title
        </span>
        <span className="w-24 text-body-lg font-medium text-text-muted">
          Year
        </span>
        <span className="w-28 text-body-lg font-medium text-text-muted">
          PMC
        </span>
        <span className="w-28 text-body-lg font-medium text-text-muted">
          DOI
        </span>
        <Checkbox
          checked={allSelected}
          onChange={() =>
            onSelectAll(
              allSelected ? [] : items.map((item) => item.id),
            )
          }
          aria-label="Select all evidence"
          className="ml-6"
        />
      </div>

      <div className="flex flex-col gap-6">
        {items.map((item) => {
          const selected = selectedIds.includes(item.id);
          const expanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className={cn(
                "rounded-card border",
                selected
                  ? "border-brand-border bg-brand-bg"
                  : "border-border-default bg-surface-default",
              )}
            >
              <div className="flex items-center gap-5 px-7 py-8">
                <RadioCircle
                  selected={selected}
                  onClick={() => onToggle(item.id)}
                  aria-label={`Select ${item.title}`}
                />
                <span className="min-w-0 flex-1 text-card-title font-medium text-white">
                  {item.title}
                </span>
                <span className="w-24 text-body-lg text-text-primary">
                  {item.year}
                </span>
                <a
                  href={item.pmcUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-28 text-body-lg font-medium text-brand underline"
                >
                  Link
                </a>
                <a
                  href={item.doiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-28 text-body-lg font-medium text-brand underline"
                >
                  Link
                </a>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(expanded ? null : item.id)
                  }
                  className="ml-2 text-white"
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
                  <div className="flex flex-col gap-5 text-body-lg">
                    <div className="flex gap-6">
                      <span className="font-medium text-text-heading">
                        Study Design
                      </span>
                      <span className="text-text-muted">
                        {item.studyDesign}
                      </span>
                    </div>
                    <div className="flex gap-[75px]">
                      <span className="font-medium text-text-heading">
                        Journal
                      </span>
                      <span className="text-text-muted">{item.journal}</span>
                    </div>
                    <div className="flex gap-6">
                      <span className="shrink-0 font-medium text-text-heading">
                        Abstract
                      </span>
                      <p className="leading-report-lg text-text-muted">
                        {item.abstract}
                      </p>
                    </div>
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
