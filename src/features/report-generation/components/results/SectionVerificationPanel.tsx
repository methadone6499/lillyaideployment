"use client";

import { cn } from "@/lib/cn";
import { useMemo, useState } from "react";
import type {
  ClaimVerificationGroup,
  ClaimVerificationStatus,
} from "../../types";

type SectionVerificationPanelProps = {
  groups: readonly ClaimVerificationGroup[];
  isStale?: boolean;
  onEdit?: () => void;
};

type StatusFilter = "all" | ClaimVerificationStatus;

const STATUS_ORDER: readonly ClaimVerificationStatus[] = [
  "supported",
  "partially_supported",
  "contradicted",
  "not_found",
  "unverifiable",
];

const STATUS_META: Record<
  ClaimVerificationStatus,
  { label: string; badgeClass: string }
> = {
  supported: {
    label: "Supported",
    badgeClass: "border-brand-border bg-brand-bg text-brand",
  },
  partially_supported: {
    label: "Partially supported",
    badgeClass: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  },
  contradicted: {
    label: "Contradicted",
    badgeClass: "border-red-400/30 bg-red-400/10 text-red-300",
  },
  not_found: {
    label: "Not found",
    badgeClass: "border-border-default bg-surface-subtle text-text-body",
  },
  unverifiable: {
    label: "Unverifiable",
    badgeClass: "border-border-default bg-surface-subtle text-text-muted",
  },
};

function formatConfidence(value: number | null | undefined): string | null {
  if (value == null) return null;
  const percent = value <= 1 ? value * 100 : value;
  return `${Math.round(percent)}% confidence`;
}

export function SectionVerificationPanel({
  groups,
  isStale = false,
  onEdit,
}: SectionVerificationPanelProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const counts = useMemo(() => {
    const next = Object.fromEntries(
      STATUS_ORDER.map((status) => [status, 0]),
    ) as Record<ClaimVerificationStatus, number>;
    for (const group of groups) {
      for (const status of STATUS_ORDER) {
        next[status] += group.verification.counts[status];
      }
    }
    return next;
  }, [groups]);
  const totalClaims = STATUS_ORDER.reduce(
    (total, status) => total + counts[status],
    0,
  );

  if (groups.length === 0) return null;

  return (
    <section className="mt-10 rounded-card border border-border-default bg-surface-default p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-card-title font-medium text-text-heading">
              Evidence verification
            </h3>
            <span className="rounded-card border border-brand-border bg-brand-bg px-2.5 py-1 text-helper font-medium text-brand">
              AI checked
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-helper leading-5 text-text-muted">
            Numeric values and factual claims were checked against their assigned
            evidence. Review warnings before editing the section.
          </p>
          {isStale ? (
            <p className="mt-3 text-helper text-amber-200">
              Verification reflects the originally generated content. This
              section has saved edits that were not re-verified.
            </p>
          ) : null}
        </div>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-10 items-center rounded-button border border-border-default bg-surface-subtle px-4 text-label font-medium text-white transition-colors hover:border-brand-border hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Edit section
          </button>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Verification filters">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-card border px-3 py-2 text-helper font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
            filter === "all"
              ? "border-brand-chip-border bg-brand-bg text-brand"
              : "border-border-default bg-surface-subtle text-text-body hover:bg-surface-elevated",
          )}
        >
          All {totalClaims}
        </button>
        {STATUS_ORDER.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            disabled={counts[status] === 0}
            className={cn(
              "rounded-card border px-3 py-2 text-helper font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40",
              filter === status
                ? STATUS_META[status].badgeClass
                : "border-border-default bg-surface-subtle text-text-body hover:bg-surface-elevated",
            )}
          >
            {STATUS_META[status].label} {counts[status]}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {groups.map((group) => {
          const claims = group.verification.claims.filter(
            (claim) => filter === "all" || claim.status === filter,
          );
          if (claims.length === 0) return null;

          return (
            <div key={group.id}>
              {groups.length > 1 ? (
                <h4 className="mb-3 text-label font-medium text-text-heading">
                  {group.label}
                </h4>
              ) : null}
              <div className="flex flex-col gap-3">
                {claims.map((claim) => {
                  const confidence = formatConfidence(claim.confidence);
                  const suggestion =
                    claim.suggested_value?.trim() ||
                    claim.suggested_claim?.trim();
                  return (
                    <details
                      key={claim.claim_id}
                      className="group rounded-card border border-border-default bg-surface-subtle px-4 py-3"
                    >
                      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                        <span className="min-w-0 flex-1">
                          <span className="block text-helper font-medium text-text-muted">
                            {[claim.subject_id, claim.field]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                          <span className="mt-1 block text-label leading-6 text-text-heading">
                            {claim.claim_text}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "rounded-card border px-2.5 py-1 text-helper font-medium",
                            STATUS_META[claim.status].badgeClass,
                          )}
                        >
                          {STATUS_META[claim.status].label}
                        </span>
                      </summary>

                      <div className="mt-4 grid gap-4 border-t border-border-default pt-4 text-helper leading-5 sm:grid-cols-2">
                        {claim.reason ? (
                          <div>
                            <p className="font-medium text-text-heading">Assessment</p>
                            <p className="mt-1 text-text-muted">{claim.reason}</p>
                          </div>
                        ) : null}
                        {claim.source_passage ? (
                          <div>
                            <p className="font-medium text-text-heading">Evidence</p>
                            <p className="mt-1 text-text-muted">
                              {claim.source_passage}
                            </p>
                            {claim.source_file ? (
                              <p className="mt-2 text-text-step">
                                {claim.source_file}
                                {claim.source_section
                                  ? ` · ${claim.source_section}`
                                  : ""}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                        {suggestion ? (
                          <div className="sm:col-span-2">
                            <p className="font-medium text-text-heading">
                              Suggested correction
                            </p>
                            <p className="mt-1 text-text-muted">{suggestion}</p>
                          </div>
                        ) : null}
                        {confidence ? (
                          <p className="text-text-step sm:col-span-2">
                            {confidence}
                          </p>
                        ) : null}
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
