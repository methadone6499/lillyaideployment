"use client";

import Image from "next/image";

import { Card } from "@/components/ui";

type RecentInvoicesTableProps = {
  canManage: boolean;
  disabled: boolean;
  isPortalPending: boolean;
  onOpenPortal: () => void;
};

export function RecentInvoicesTable({
  canManage,
  disabled,
  isPortalPending,
  onOpenPortal,
}: RecentInvoicesTableProps) {
  return (
    <section
      aria-labelledby="billing-invoices-heading"
      className="mt-12 max-w-[1488px]"
    >
      <Card className="overflow-hidden rounded-button">
        <div className="flex items-end justify-between gap-5 px-6 py-5">
          <div>
            <h2
              id="billing-invoices-heading"
              className="text-card-title font-medium text-white"
            >
              Recent invoices
            </h2>
            <p className="mt-3 text-helper text-text-muted">
              Invoices and receipts
            </p>
          </div>
          {canManage ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onOpenPortal}
              className="inline-flex shrink-0 items-center gap-2 text-label font-medium text-text-step transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPortalPending ? "Opening..." : "View All"}
              <Image
                src="/notification-chevron.svg"
                alt=""
                width={7}
                height={12}
                className="h-3 w-[7px] rotate-180 object-contain"
              />
            </button>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] table-fixed text-left">
            <thead className="h-10 bg-surface-subtle text-label font-medium text-text-step">
              <tr>
                {["Invoice", "Date", "Amount", "Status", "Plan"].map((label) => (
                  <th key={label} scope="col" className="px-6 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-6 py-10">
                  <div className="flex items-center justify-center gap-3 text-input text-text-muted">
                    <Image
                      src="/billing/download.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 shrink-0 object-contain"
                    />
                    <p>
                      {canManage
                        ? "View your invoice history and download receipts in the billing portal."
                        : "Invoice history is available to your company billing owner."}
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
