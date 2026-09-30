import { formatLocalDateTime } from "@/features/billing";

import type { CustomRequest } from "../schemas/customSubscriptionSchemas";

export function CustomRequestSummary({ request }: { request: CustomRequest }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Company", value: request.company_name },
    { label: "Billing email", value: request.billing_email },
    { label: "Contact phone", value: request.contact_phone ?? "—" },
    { label: "Seats requested", value: String(request.requested_seats) },
    {
      label: "Reports per month requested",
      value: String(request.requested_reports),
    },
    { label: "Last updated", value: formatLocalDateTime(request.updated_at) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-card bg-surface-subtle p-4">
            <dt className="text-helper text-text-muted">{row.label}</dt>
            <dd className="mt-1 break-words text-label font-medium text-white">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      {request.notes ? (
        <div className="rounded-card bg-surface-subtle p-4">
          <p className="text-helper text-text-muted">Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-label text-text-body">
            {request.notes}
          </p>
        </div>
      ) : null}
    </div>
  );
}
