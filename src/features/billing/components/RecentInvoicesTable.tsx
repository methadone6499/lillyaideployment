import { Card } from "@/components/ui";
import Image from "next/image";
import type { BillingInvoice } from "../schemas/billingSchemas";

type RecentInvoicesTableProps = {
  invoices: BillingInvoice[];
};

const invoiceGridClass =
  "grid min-w-[920px] grid-cols-[minmax(180px,1.55fr)_1fr_1fr_0.85fr_minmax(220px,2fr)_48px] items-center gap-x-8 px-6";

export function RecentInvoicesTable({ invoices }: RecentInvoicesTableProps) {
  return (
    <Card className="overflow-hidden rounded-button">
      <div className="flex items-end justify-between gap-5 px-6 py-5">
        <div>
          <h2 className="text-card-title font-medium text-white">
            Recent invoices
          </h2>
          <p className="mt-3 text-helper text-text-muted">Last 6 months</p>
        </div>
        <button
          type="button"
          title="Available when billing services are connected"
          className="text-label font-medium text-text-step transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          View All&nbsp; {"\u203A"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <div
          className={`${invoiceGridClass} h-10 bg-surface-subtle text-label font-medium text-text-step`}
        >
          <span>Invoice</span>
          <span>Date</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Plan</span>
          <span className="sr-only">Download</span>
        </div>

        {invoices.length > 0 ? (
          <div>
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className={`${invoiceGridClass} min-h-[81px] border-b border-border-subtle text-input text-white last:border-b-0`}
              >
                <span className="text-label font-medium">{invoice.id}</span>
                <span>{invoice.date}</span>
                <span>{invoice.amount}</span>
                <span className="justify-self-start rounded-card bg-brand/12 px-2.5 py-2 font-medium leading-none text-brand">
                  {invoice.status}
                </span>
                <span>{invoice.plan}</span>
                <button
                  type="button"
                  aria-label={`Download invoice ${invoice.id}`}
                  title="Available when billing services are connected"
                  className="flex size-12 items-center justify-center rounded-field bg-surface-elevated transition-colors hover:bg-white/16 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <Image
                    src="/billing/download.svg"
                    alt=""
                    width={20}
                    height={20}
                  />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-6 py-10 text-center text-label text-text-muted">
            No invoices are available yet.
          </p>
        )}
      </div>
    </Card>
  );
}
