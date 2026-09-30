"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Chip } from "@/components/ui";
import { formatLocalDateTime, formatPlanName } from "@/features/billing";
import { DashboardPagination, DashboardSearchInput } from "@/features/dashboard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/cn";

import { useAdminCustomRequests } from "../hooks/useAdminCustomRequests";
import { CUSTOM_SEARCH_MAX_LENGTH } from "../schemas/customSubscriptionSchemas";
import {
  ADMIN_CUSTOM_REQUEST_TABS,
  buildAdminCustomRequestPath,
  countAdminCustomRequestTab,
  getAdminCustomRequestTab,
  type AdminCustomRequestTabId,
} from "../utils/adminCustomRequestQueue";
import { classifyCustomSubscriptionError } from "../utils/classifyCustomSubscriptionError";
import { formatIdentity } from "../utils/formatCustomSubscription";
import { CustomRequestStatusPill } from "./CustomStatusPill";

const ROWS_PER_PAGE = 20;
const SEARCH_DEBOUNCE_MS = 300;
const MISSING_VALUE = "—";

const rowClass =
  "grid min-w-[1180px] grid-cols-[minmax(200px,1.4fr)_minmax(180px,1.1fr)_minmax(180px,1.1fr)_minmax(150px,0.9fr)_minmax(110px,0.6fr)_minmax(170px,0.9fr)_minmax(160px,0.9fr)] items-center gap-x-6 px-6";

function isInvalidCursorKind(error: unknown): boolean {
  return classifyCustomSubscriptionError(error).kind === "invalid_cursor";
}

export function AdminCustomRequestQueue() {
  const [tabId, setTabId] = useState<AdminCustomRequestTabId>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const tab = getAdminCustomRequestTab(tabId);
  const requestsQuery = useAdminCustomRequests({
    statuses: tab.statuses,
    search: debouncedSearch,
    limit: ROWS_PER_PAGE,
  });
  const loadedPageCount = requestsQuery.data?.pages.length ?? 0;
  const safeCurrentPage = Math.min(currentPage, Math.max(loadedPageCount, 1));
  const requests = useMemo(
    () => requestsQuery.data?.pages[safeCurrentPage - 1]?.items ?? [],
    [requestsQuery.data, safeCurrentPage],
  );
  const counts = requestsQuery.data?.pages[0]?.counts_by_status;
  const totalPages = Math.max(
    1,
    loadedPageCount + (requestsQuery.hasNextPage ? 1 : 0),
  );
  const listError = requestsQuery.error
    ? classifyCustomSubscriptionError(requestsQuery.error)
    : null;
  const showInitialLoading =
    requestsQuery.isLoading && requests.length === 0 && !requestsQuery.isError;
  const showError =
    requestsQuery.isError &&
    requests.length === 0 &&
    !isInvalidCursorKind(requestsQuery.error);
  const showEmpty =
    !showInitialLoading &&
    !showError &&
    requests.length === 0 &&
    !requestsQuery.isFetching;
  const showNextPageError =
    requests.length > 0 &&
    requestsQuery.isFetchNextPageError &&
    !isInvalidCursorKind(requestsQuery.error);

  const handleTabChange = (nextTabId: AdminCustomRequestTabId) => {
    setTabId(nextTabId);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value.slice(0, CUSTOM_SEARCH_MAX_LENGTH));
    setCurrentPage(1);
  };

  const handlePageChange = async (page: number) => {
    if (page < 1 || page === safeCurrentPage) {
      return;
    }

    if (page <= loadedPageCount) {
      setCurrentPage(page);
      return;
    }

    if (page === loadedPageCount + 1 && requestsQuery.hasNextPage) {
      const result = await requestsQuery.fetchNextPage();

      if (result.isError) {
        if (isInvalidCursorKind(result.error)) {
          setCurrentPage(1);
        }
        return;
      }

      setCurrentPage(page);
    }
  };

  return (
    <section
      aria-label="Custom plan requests"
      aria-busy={requestsQuery.isFetching}
      className="mt-9 lg:mt-12"
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="Request status">
        {ADMIN_CUSTOM_REQUEST_TABS.map((option) => (
          <Chip
            key={option.id}
            selected={option.id === tabId}
            onClick={() => handleTabChange(option.id)}
          >
            {option.label}
            <span className="ml-2 text-text-muted">
              {countAdminCustomRequestTab(counts, option)}
            </span>
          </Chip>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-button border border-border-default bg-surface-default">
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-card-title font-medium text-white">{tab.label}</h2>
          <DashboardSearchInput
            value={searchQuery}
            maxLength={CUSTOM_SEARCH_MAX_LENGTH}
            label="Search Custom plan requests"
            placeholder="Search company, email or name"
            className="sm:max-w-[520px]"
            onChange={handleSearchChange}
          />
        </div>

        <div className="overflow-x-auto">
          <div
            className={cn(
              rowClass,
              "h-14 bg-surface-subtle text-label font-medium text-text-step",
            )}
          >
            <span>Company</span>
            <span>Requester</span>
            <span>Billing owner</span>
            <span>Requested</span>
            <span>Current plan</span>
            <span>Status</span>
            <span>Updated</span>
          </div>

          <div className="flex flex-col">
            {showInitialLoading ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">
                Loading Custom plan requests…
              </p>
            ) : showError ? (
              <div
                className="flex flex-col items-center gap-4 px-6 py-10 text-center text-label text-text-muted"
                role="alert"
              >
                <p>{listError?.message}</p>
                <button
                  type="button"
                  className="rounded-button border border-border-default px-4 py-2 font-medium text-white transition-colors hover:bg-surface-elevated"
                  onClick={() => {
                    void requestsQuery.refetch();
                  }}
                >
                  Try again
                </button>
              </div>
            ) : showEmpty ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">
                {debouncedSearch.trim()
                  ? "No requests match your search."
                  : "No requests in this queue."}
              </p>
            ) : (
              requests.map((request) => (
                <Link
                  key={request.id}
                  href={buildAdminCustomRequestPath(request.id)}
                  className={cn(
                    rowClass,
                    "min-h-[86px] border-b border-border-subtle py-3 text-left last:border-b-0 hover:bg-brand-bg focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-label font-medium text-white">
                      {request.company_name}
                    </span>
                    <span className="block truncate text-helper text-text-muted">
                      {request.billing_email}
                    </span>
                  </span>
                  <span className="min-w-0 truncate text-label text-white">
                    {formatIdentity(request.requester)}
                  </span>
                  <span className="min-w-0 truncate text-label text-white">
                    {formatIdentity(request.billing_owner)}
                  </span>
                  <span className="min-w-0 truncate text-label text-white">
                    {request.requested_seats} seats · {request.requested_reports}{" "}
                    reports
                  </span>
                  <span className="min-w-0 truncate text-label text-white">
                    {request.current_plan_type
                      ? formatPlanName(request.current_plan_type)
                      : MISSING_VALUE}
                  </span>
                  <span className="justify-self-start">
                    <CustomRequestStatusPill status={request.status} />
                  </span>
                  <span className="min-w-0 truncate text-helper text-text-muted">
                    {formatLocalDateTime(request.updated_at)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {showNextPageError ? (
        <div
          className="mt-4 flex items-center justify-end gap-3 px-2 text-label text-text-muted"
          role="alert"
        >
          <span>{listError?.message}</span>
          <button
            type="button"
            className="rounded-button border border-border-default px-3 py-1.5 font-medium text-white transition-colors hover:bg-surface-elevated"
            disabled={requestsQuery.isFetchingNextPage}
            onClick={() => {
              void requestsQuery.fetchNextPage();
            }}
          >
            Retry
          </button>
        </div>
      ) : null}

      {totalPages > 1 ? (
        <div className="mt-4 px-2">
          <DashboardPagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            isPageChangePending={requestsQuery.isFetchingNextPage}
            ariaLabel="Custom plan requests pagination"
            onPageChange={handlePageChange}
          />
        </div>
      ) : null}
    </section>
  );
}
