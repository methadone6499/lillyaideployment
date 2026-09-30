import { formatLocalDateTime } from "@/features/billing";
import { cn } from "@/lib/cn";

import type {
  AdminCommunication,
  AdminCommunicationKind,
} from "../schemas/customSubscriptionSchemas";
import {
  formatIdentity,
  formatUsdAmount,
} from "../utils/formatCustomSubscription";

const KIND_LABELS: Record<AdminCommunicationKind, string> = {
  action_required: "Asked the customer for information",
  changes_requested: "Customer requested changes",
  declined: "Customer declined the offer",
  closed: "Closed with a customer-visible reason",
  internal_note: "Internal note",
};

function formatSuggestions(communication: AdminCommunication): string | null {
  const parts = [
    communication.suggested_seats !== null
      ? `${communication.suggested_seats} seats`
      : null,
    communication.suggested_reports !== null
      ? `${communication.suggested_reports} reports / month`
      : null,
    communication.suggested_amount_minor !== null
      ? `${formatUsdAmount(communication.suggested_amount_minor)} / month`
      : null,
  ].filter((part): part is string => part !== null);

  return parts.length > 0 ? `Suggested: ${parts.join(" · ")}` : null;
}

export function AdminCommunicationTimeline({
  communications,
}: {
  communications: readonly AdminCommunication[];
}) {
  if (communications.length === 0) {
    return (
      <p className="text-label text-text-muted">No messages or notes yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {communications.map((communication) => {
        const isInternal = communication.visibility === "internal";
        const suggestions = formatSuggestions(communication);

        return (
          <article
            key={communication.id}
            className={cn(
              "rounded-card border p-4",
              isInternal
                ? "border-border-default border-l-2 border-l-brand bg-brand-bg"
                : "border-border-default bg-surface-subtle",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-label font-medium text-white">
                {KIND_LABELS[communication.kind]}
              </h3>
              <span
                className={cn(
                  "rounded-card px-2 py-1 text-helper font-medium",
                  isInternal
                    ? "bg-brand/12 text-brand"
                    : "bg-white/10 text-text-muted",
                )}
              >
                {isInternal ? "Internal — not visible to the customer" : "Visible to customer"}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-label text-text-body">
              {communication.message}
            </p>
            {suggestions ? (
              <p className="mt-2 text-helper text-text-muted">{suggestions}</p>
            ) : null}
            <p className="mt-2 text-helper text-text-muted">
              {formatIdentity(communication.author)} ·{" "}
              {formatLocalDateTime(communication.created_at)}
            </p>
          </article>
        );
      })}
    </div>
  );
}
