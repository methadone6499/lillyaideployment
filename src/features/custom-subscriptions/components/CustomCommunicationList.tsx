import { formatLocalDateTime } from "@/features/billing";

import type {
  CustomerCommunication,
  CustomerCommunicationKind,
} from "../schemas/customSubscriptionSchemas";
import { formatUsdAmount } from "../utils/formatCustomSubscription";

const KIND_LABELS: Record<CustomerCommunicationKind, string> = {
  action_required: "We asked for more information",
  changes_requested: "You requested changes",
  declined: "You declined the offer",
};

function formatSuggestions(communication: CustomerCommunication): string | null {
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

export function CustomCommunicationList({
  communications,
}: {
  communications: readonly CustomerCommunication[];
}) {
  if (communications.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="custom-communications-title"
      className="rounded-card border border-border-default bg-surface-default p-6"
    >
      <h2
        id="custom-communications-title"
        className="text-card-title font-medium text-white"
      >
        Messages
      </h2>
      <div className="mt-5 space-y-3">
        {communications.map((communication) => {
          const suggestions = formatSuggestions(communication);

          return (
            <article
              key={communication.id}
              className="rounded-card border border-border-default bg-surface-subtle p-4"
            >
              <h3 className="text-label font-medium text-white">
                {KIND_LABELS[communication.kind]}
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-label text-text-body">
                {communication.message}
              </p>
              {suggestions ? (
                <p className="mt-2 text-helper text-text-muted">{suggestions}</p>
              ) : null}
              <p className="mt-2 text-helper text-text-muted">
                {formatLocalDateTime(communication.created_at)}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
