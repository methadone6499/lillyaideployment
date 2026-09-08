"use client";

import { ChevronRightIcon, SearchIcon } from "@/components/ui/icons";
import { hasPermission, useAuthUser } from "@/features/auth";
import {
  useCompanyReports,
  type GenerationStatus,
} from "@/features/reports";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/cn";
import { ApiRequestError } from "@/services/ApiRequestError";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { DashboardStatusFilterValue } from "../types";
import { formatReportDateTime } from "../utils/formatReportDateTime";
import { DashboardPagination } from "./DashboardPagination";
import {
  DashboardStatusFilter,
  type DashboardStatusFilterOption,
} from "./DashboardStatusFilter";
import { DashboardStatusPill } from "./DashboardStatusPill";

const ROWS_PER_PAGE = 6;
const SEARCH_DEBOUNCE_MS = 300;
const MAX_SEARCH_LENGTH = 100;

const COMPANY_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "completed", label: "Completed" },
  { value: "generating", label: "In Progress" },
  { value: "failed", label: "Failed" },
] as const satisfies readonly DashboardStatusFilterOption<DashboardStatusFilterValue>[];

const companyReportRowClass =
  "grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(148px,180px)_140px_24px] items-center gap-x-6 px-6";

function getListErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 403) {
      return "You do not have permission to view company reports.";
    }

    return error.message || "Unable to load company reports. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load company reports. Please try again.";
}

function isInvalidCursorError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 400 &&
    error.code === "invalid_cursor"
  );
}

export function CompanyReportsTable() {
  const { authMe } = useAuthUser();
  const canReadCompanyReports = hasPermission(authMe, "report:read_company");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<DashboardStatusFilterValue>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  const search =
    debouncedSearch.trim().length > 0
      ? debouncedSearch.trim().slice(0, MAX_SEARCH_LENGTH)
      : undefined;
  const generationStatus: GenerationStatus | undefined =
    statusFilter === "all" ? undefined : statusFilter;

  const reportsQuery = useCompanyReports({
    limit: ROWS_PER_PAGE,
    search,
    generationStatus,
    enabled: canReadCompanyReports,
  });
  const hasActiveFilters = Boolean(search || generationStatus);

  const loadedPageCount = reportsQuery.data?.pages.length ?? 0;
  const safeCurrentPage = Math.min(currentPage, Math.max(loadedPageCount, 1));
  const reports = useMemo(
    () => reportsQuery.data?.pages[safeCurrentPage - 1]?.items ?? [],
    [reportsQuery.data, safeCurrentPage],
  );
  const totalPages = Math.max(
    1,
    loadedPageCount + (reportsQuery.hasNextPage ? 1 : 0),
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value.slice(0, MAX_SEARCH_LENGTH));
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: DashboardStatusFilterValue) => {
    setStatusFilter(value);
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

    if (page === loadedPageCount + 1 && reportsQuery.hasNextPage) {
      const result = await reportsQuery.fetchNextPage();

      if (result.isError) {
        if (isInvalidCursorError(result.error)) {
          setCurrentPage(1);
        }
        return;
      }

      setCurrentPage(page);
    }
  };

  const showInitialLoading =
    !authMe ||
    (canReadCompanyReports &&
      reportsQuery.isLoading &&
      reports.length === 0 &&
      !reportsQuery.isError);
  const showPermissionDenied = Boolean(authMe) && !canReadCompanyReports;
  const showError =
    canReadCompanyReports &&
    reportsQuery.isError &&
    reports.length === 0 &&
    !isInvalidCursorError(reportsQuery.error);
  const showEmpty =
    canReadCompanyReports &&
    !showInitialLoading &&
    !showError &&
    reports.length === 0 &&
    !reportsQuery.isFetching;
  const showNextPageError =
    reports.length > 0 &&
    reportsQuery.isFetchNextPageError &&
    !isInvalidCursorError(reportsQuery.error);
  const isUpdatingResults =
    reports.length > 0 &&
    reportsQuery.isFetching &&
    !reportsQuery.isFetchingNextPage;

  return (
    <section aria-label="Company reports" aria-busy={reportsQuery.isFetching}>
      <div className="overflow-hidden rounded-button border border-border-default bg-surface-default">
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-card-title font-medium text-white">Reports</h2>

          <div className="flex w-full flex-col gap-3 sm:max-w-[664px] sm:flex-1 sm:flex-row sm:items-center sm:gap-4">
            <label className="relative block w-full sm:flex-1">
              <span className="sr-only">Search report name or users</span>
              <span className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-white/28">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={searchQuery}
                maxLength={MAX_SEARCH_LENGTH}
                placeholder="Search report name, users"
                onChange={(event) => handleSearchChange(event.target.value)}
                className="h-14 w-full rounded-button bg-surface-subtle py-4 pr-5 pl-14 text-body-lg text-white outline-none placeholder:text-white/28 focus:ring-1 focus:ring-border-default"
              />
            </label>

            <DashboardStatusFilter
              value={statusFilter}
              options={COMPANY_STATUS_FILTER_OPTIONS}
              showSelectedLabel
              onChange={handleStatusFilterChange}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <div
            className={cn(
              companyReportRowClass,
              "h-14 bg-surface-subtle text-label font-medium text-text-step",
            )}
          >
            <span>Report Name</span>
            <span>Generated by</span>
            <span>User Email</span>
            <span>Last Updated</span>
            <span>Status</span>
            <span className="sr-only">Open</span>
          </div>

          <div className="flex flex-col">
            {showInitialLoading ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">
                Loading reports…
              </p>
            ) : showPermissionDenied ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">
                You do not have permission to view company reports.
              </p>
            ) : showError ? (
              <div
                className="flex flex-col items-center gap-4 px-6 py-10 text-center text-label text-text-muted"
                role="alert"
              >
                <p>{getListErrorMessage(reportsQuery.error)}</p>
                <button
                  type="button"
                  className="rounded-button border border-border-default px-4 py-2 font-medium text-white transition-colors hover:bg-surface-elevated"
                  onClick={() => {
                    void reportsQuery.refetch();
                  }}
                >
                  Try again
                </button>
              </div>
            ) : showEmpty ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">
                {hasActiveFilters
                  ? "No company reports match your search or status filter."
                  : "No company reports have been generated yet."}
              </p>
            ) : (
              reports.map((report, index) => (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className={cn(
                    companyReportRowClass,
                    "min-h-[86px] border-b border-border-subtle py-3 text-left transition-colors last:border-b-0 hover:bg-brand-bg",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-4">
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-toggle-knob bg-surface-elevated text-input font-medium text-white">
                      {(safeCurrentPage - 1) * ROWS_PER_PAGE + index + 1}
                    </span>
                    <span className="truncate text-label font-medium text-white">
                      {report.title}
                    </span>
                  </span>

                  <span className="min-w-0 truncate text-label font-medium text-white">
                    {report.creator.full_name}
                  </span>

                  <span className="min-w-0 truncate text-label font-medium text-white">
                    {report.creator.email}
                  </span>

                  <span className="text-label font-medium whitespace-nowrap text-white">
                    {formatReportDateTime(report.updated_at)}
                  </span>

                  <span className="justify-self-start">
                    <DashboardStatusPill status={report.generation_status} />
                  </span>

                  <ChevronRightIcon className="justify-self-end text-white" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {isUpdatingResults ? "Updating company report results." : ""}
      </p>

      {showNextPageError ? (
        <div
          className="mt-4 flex items-center justify-end gap-3 px-2 text-label text-text-muted"
          role="alert"
        >
          <span>{getListErrorMessage(reportsQuery.error)}</span>
          <button
            type="button"
            className="rounded-button border border-border-default px-3 py-1.5 font-medium text-white transition-colors hover:bg-surface-elevated"
            disabled={reportsQuery.isFetchingNextPage}
            onClick={() => {
              void reportsQuery.fetchNextPage();
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
            isPageChangePending={reportsQuery.isFetchingNextPage}
            ariaLabel="Company reports pagination"
            onPageChange={handlePageChange}
          />
        </div>
      ) : null}
    </section>
  );
}
