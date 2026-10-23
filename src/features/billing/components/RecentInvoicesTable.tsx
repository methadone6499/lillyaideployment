"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button, Card, TextLink } from "@/components/ui";
import { buildLoginRedirect } from "@/features/auth";
import { useRetryCooldown } from "@/hooks/useRetryCooldown";

import { useBillingHistory } from "../hooks/useBillingHistory";
import type { BillingHistoryItem } from "../schemas/billingHistorySchemas";
import { getBillingHistoryError } from "../utils/billingHistoryErrors";
import {
  formatHistoryAmount,
  formatHistoryDate,
  formatHistoryStatus,
} from "../utils/formatBillingHistory";
import { BillingRequestId } from "./BillingRequestId";

type RecentInvoicesTableProps = {
  canManage: boolean;
  disabled: boolean;
  isPortalPending: boolean;
  onOpenPortal: () => void;
};

function InvoiceRow({ item }: { item: BillingHistoryItem }) {
  const documentUrl = item.document_url ?? item.hosted_url;
  const documentLabel = item.kind === "top_up" ? "receipt" : "invoice";
  const statusClass = item.status === "paid"
    ? "text-status-success"
    : item.status === "disputed"
      ? "text-status-danger"
      : ["partially_refunded", "refunded"].includes(item.status)
        ? "text-status-running"
        : "text-text-body";

  return (
    <tr className="border-t border-border-subtle text-input text-text-body">
      <th scope="row" className="break-words px-6 py-5 text-label font-medium text-white [overflow-wrap:anywhere]">
        {item.reference}
      </th>
      <td className="px-6 py-5 tabular-nums">
        <time dateTime={item.date}>{formatHistoryDate(item.date)}</time>
      </td>
      <td className="px-6 py-5 tabular-nums">
        {formatHistoryAmount(item.amount_minor, item.currency)}
      </td>
      <td className={`px-6 py-5 ${statusClass}`}>
        {item.status === "paid" ? (
          <span className="inline-flex h-[30px] items-center justify-center rounded-field bg-brand-border px-2.5 font-medium">
            {formatHistoryStatus(item.status)}
          </span>
        ) : formatHistoryStatus(item.status)}
      </td>
      <td className="break-words px-6 py-5 [overflow-wrap:anywhere]">{item.description}</td>
      <td className="px-6 py-5 text-center">
        {documentUrl ? (
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${documentLabel} for ${item.reference} (opens in a new tab)`}
            title={`View ${documentLabel}`}
            className="inline-flex size-10 items-center justify-center rounded-field transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Image src="/billing/download.svg" alt="" width={20} height={20} className="size-5 object-contain" />
          </a>
        ) : (
          <span className="text-text-muted" aria-label="Document unavailable" title="Document unavailable">—</span>
        )}
      </td>
    </tr>
  );
}

function InvoiceSkeletonRows() {
  return Array.from({ length: 4 }, (_, row) => (
    <tr key={row} aria-hidden="true" className="border-t border-border-subtle">
      {Array.from({ length: 6 }, (_, column) => (
        <td key={column} className="px-6 py-6">
          <div className="h-4 rounded bg-surface-elevated motion-safe:animate-pulse" />
        </td>
      ))}
    </tr>
  ));
}

export function RecentInvoicesTable({
  canManage,
  disabled,
  isPortalPending,
  onOpenPortal,
}: RecentInvoicesTableProps) {
  const history = useBillingHistory();
  const router = useRouter();
  const pathname = usePathname();
  const cooldown = useRetryCooldown(history.retryAt);
  const errorInfo = history.error ? getBillingHistoryError(history.error) : null;
  const invalidSession = errorInfo?.invalidSession ?? false;
  const paginationDisabled = history.isFetching || cooldown > 0 || invalidSession;

  useEffect(() => {
    if (invalidSession) {
      router.replace(buildLoginRedirect(pathname));
    }
  }, [invalidSession, pathname, router]);

  return (
    <section
      aria-labelledby="billing-invoices-heading"
      className="mt-12 max-w-[1488px]"
    >
      <Card className="overflow-hidden" aria-busy={history.isFetching}>
        <div className="flex items-end justify-between gap-5 px-6 py-5">
          <div>
            <h2
              id="billing-invoices-heading"
              className="text-card-title font-medium text-white"
            >
              Recent invoices
            </h2>
            <p className="mt-3 text-helper text-text-muted">
              Subscription invoices and report top-up receipts
            </p>
          </div>
          {canManage ? (
            <TextLink
              disabled={disabled}
              onClick={onOpenPortal}
              className="inline-flex shrink-0 items-center gap-2"
            >
              {isPortalPending ? "Opening..." : "Billing portal"}
              <Image
                src="/notification-chevron.svg"
                alt=""
                width={7}
                height={12}
                className="h-3 w-[7px] rotate-180 object-contain"
              />
            </TextLink>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] table-fixed text-left">
            <caption className="sr-only">Your invoices and top-up payments, newest first</caption>
            <thead className="h-14 bg-surface-subtle text-label font-medium text-text-step">
              <tr>
                {["Invoice", "Date", "Amount", "Status", "Plan / purchase", "Document"].map((label) => (
                  <th key={label} scope="col" className="px-6 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.items.map((item) => <InvoiceRow key={`${item.kind}:${item.id}`} item={item} />)}
              {history.isPending || invalidSession ? <InvoiceSkeletonRows /> : null}
              {!history.isPending && !history.isError && history.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-input text-text-muted">
                    No invoices or top-up payments yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {errorInfo && !invalidSession ? (
          <div role="alert" className="flex flex-col items-start gap-3 border-t border-border-subtle px-6 py-5">
            <p className="text-helper text-text-body">{errorInfo.message}</p>
            {errorInfo.retryable ? (
              <Button
                variant="secondary"
                size="compact"
                disabled={paginationDisabled}
                onClick={() => void (history.isFetchNextPageError ? history.loadMore() : history.refresh())}
              >
                {history.isFetching ? "Retrying…" : cooldown > 0 ? `Retry in ${cooldown}s` : "Try again"}
              </Button>
            ) : null}
            {errorInfo.requestId ? (
              <details className="text-label text-text-muted">
                <summary className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">Support details</summary>
                <div className="mt-2"><BillingRequestId requestId={errorInfo.requestId} /></div>
              </details>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border-subtle px-6 py-4">
          <p role="status" aria-live="polite" className="text-helper text-text-muted">
            {invalidSession ? "Redirecting to sign in…" : history.isPending ? "Loading billing history…"
              : history.isFetchingNextPage ? "Loading more payments…"
                : ""}
          </p>
          <div className="flex items-center gap-5">
            <TextLink disabled={paginationDisabled} onClick={() => void history.refresh()}>
              Refresh
            </TextLink>
            <Button
              variant="secondary"
              size="compact"
              disabled={paginationDisabled || !history.hasNextPage || history.isError}
              onClick={() => void history.loadMore()}
            >
              {history.isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
