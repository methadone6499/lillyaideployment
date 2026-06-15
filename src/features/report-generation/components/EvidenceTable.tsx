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

  const evidenceGridClass = "grid grid-cols-[40px_minmax(0,1fr)_96px_112px_112px_32px] items-center gap-5"

  return (
    <div className="flex flex-col gap-6">
      <div className={cn(evidenceGridClass, "h-14 rounded-card bg-surface-subtle px-7")}>
        <Checkbox
          checked={allSelected}
          onChange={() =>
            onSelectAll(allSelected ? [] : items.map((item) => item.id))
          }
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
              <div className={cn(evidenceGridClass, "px-7 py-8")}>
                <RadioCircle
                  selected={selected}
                  onClick={() => onToggle(item.id)}
                  aria-label={`Select ${item.title}`}
                />

                <span className="min-w-0 text-card-title font-medium text-white">
                  {item.title}
                </span>

                <span className="text-body-lg text-text-primary">{item.year}</span>

                <a className="text-body-lg font-medium text-brand underline">Link</a>

                <a className="text-body-lg font-medium text-brand underline">Link</a>

                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                  className="text-white"
                  aria-label={expanded ? "Collapse" : "Expand"}
                >
                  {expanded ? <ChevronUpIcon /> : <ChevronDownIcon className="size-6" />}
                </button>
              </div>

              {expanded && (
                <div className="border-t border-border-default px-[83px] pb-8 pt-6">
                  <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-6 gap-y-5 text-body-lg">
                    <span className="font-medium text-text-heading">Study Design</span>
                    <span className="text-text-muted">{item.studyDesign}</span>

                    <span className="font-medium text-text-heading">Journal</span>
                    <span className="text-text-muted">{item.journal}</span>

                    <span className="font-medium text-text-heading">Abstract</span>
                    <p className="leading-report-lg text-text-muted">{item.abstract}</p>
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
