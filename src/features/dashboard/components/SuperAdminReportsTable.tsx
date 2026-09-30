"use client";

import { hasPermission, useAuthUser } from "@/features/auth";
import {
  generationStatusSchema,
  reviewStatusSchema,
  useAdminReports,
  type AdminReportSummary,
  type GenerationStatus,
  type ReviewStatus,
} from "@/features/reports";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AdminReportCommentsDialog } from "@/features/reviewer";
import { cn } from "@/lib/cn";
import { ApiRequestError } from "@/services/ApiRequestError";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { DashboardStatusPillStatus } from "../types";
import { formatReportDateTime } from "../utils/formatReportDateTime";
import { DashboardPagination } from "./DashboardPagination";
import { DashboardSearchInput } from "./DashboardSearchInput";
import {
  DashboardStatusFilter,
  type DashboardStatusFilterOption,
} from "./DashboardStatusFilter";
import { DashboardStatusPill } from "./DashboardStatusPill";

const ROWS_PER_PAGE = 6;
const SEARCH_DEBOUNCE_MS = 300;
const MAX_SEARCH_LENGTH = 100;

type SuperAdminStatusFilterValue = GenerationStatus | ReviewStatus | "all";

const SUPER_ADMIN_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "completed", label: "Completed" },
  { value: "generating", label: "In Progress" },
  { value: "failed", label: "Failed" },
  { value: "unassigned", label: "Unassigned" },
  { value: "awaiting_assignment", label: "Awaiting Assignment" },
  { value: "pending", label: "Pending Review" },
  { value: "in_review", label: "In Review" },
  { value: "reviewed", label: "Reviewed" },
] as const satisfies readonly DashboardStatusFilterOption<SuperAdminStatusFilterValue>[];

const superAdminReportRowClass =
  "grid min-w-[1280px] grid-cols-[minmax(200px,1.4fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(180px,1.2fr)_minmax(140px,1fr)_minmax(148px,180px)_minmax(140px,180px)_110px] items-center gap-x-6 px-6";

function getListErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 403) {
      return "You do not have permission to view reports.";
    }

    return error.message || "Unable to load reports. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load reports. Please try again.";
}

function isInvalidCursorError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 400 &&
    error.code === "invalid_cursor"
  );
}

function getSuperAdminReportDisplayStatus(
  report: AdminReportSummary,
): DashboardStatusPillStatus {
  if (report.generation_status === "failed") {
    return "failed";
  }

  if (report.generation_status === "generating") {
    return "generating";
  }

  if (report.generation_status === "completed") {
    return report.review_status === "unassigned" ? "completed" : report.review_status;
  }

  return "completed";
}

export function SuperAdminReportsTable() {
  const { authMe } = useAuthUser();
  const canReadAdminReports = hasPermission(authMe, "admin:reports_read");
  const canManageReportComments = hasPermission(
    authMe,
    "admin:report_comments_manage",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<SuperAdminStatusFilterValue>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [commentsReport, setCommentsReport] = useState<AdminReportSummary | null>(null);
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  const search =
    debouncedSearch.trim().length > 0
      ? debouncedSearch.trim().slice(0, MAX_SEARCH_LENGTH)
      : undefined;
  const generationStatus = generationStatusSchema.safeParse(statusFilter);
  const reviewStatus = reviewStatusSchema.safeParse(statusFilter);

  const reportsQuery = useAdminReports({
    limit: ROWS_PER_PAGE,
    search,
    generationStatus: generationStatus.success
      ? generationStatus.data
      : undefined,
    reviewStatus: reviewStatus.success ? reviewStatus.data : undefined,
    enabled: canReadAdminReports,
  });
  const hasActiveFilters = Boolean(
    search || generationStatus.success || reviewStatus.success,
  );

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

  const handleStatusFilterChange = (value: SuperAdminStatusFilterValue) => {
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
    (canReadAdminReports &&
      reportsQuery.isLoading &&
      reports.length === 0 &&
      !reportsQuery.isError);
  const showPermissionDenied = Boolean(authMe) && !canReadAdminReports;
  const showError =
    canReadAdminReports &&
    reportsQuery.isError &&
    reports.length === 0 &&
    !isInvalidCursorError(reportsQuery.error);
  const showEmpty =
    canReadAdminReports &&
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
    <section aria-label="Reports" aria-busy={reportsQuery.isFetching}>
      <div className="overflow-hidden rounded-button border border-border-default bg-surface-default">
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-card-title font-medium text-white">Reports</h2>

          <div className="flex w-full flex-col gap-3 sm:max-w-[664px] sm:flex-1 sm:flex-row sm:items-center sm:gap-4">
            <DashboardSearchInput
              value={searchQuery}
              label="Search report name or users"
              placeholder="Search report name, users"
              maxLength={MAX_SEARCH_LENGTH}
              onChange={handleSearchChange}
            />

            <DashboardStatusFilter
              value={statusFilter}
              options={SUPER_ADMIN_STATUS_FILTER_OPTIONS}
              showSelectedLabel
              onChange={handleStatusFilterChange}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <div
            className={cn(
              superAdminReportRowClass,
              "h-14 bg-surface-subtle text-label font-medium text-text-step",
            )}
          >
            <span>Report Name</span>
            <span>Generated by</span>
            <span>Company</span>
            <span>User Email</span>
            <span>Reviewer</span>
            <span>Last Updated</span>
            <span>Status</span>
            <span>Comments</span>
          </div>

          <div className="flex flex-col">
            {showInitialLoading ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">
                Loading reports…
              </p>
            ) : showPermissionDenied ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">
                You do not have permission to view reports.
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
                  ? "No reports match your search or status filter."
                  : "No reports have been generated yet."}
              </p>
            ) : (
              reports.map((report, index) => (
                <div
                  key={report.id}
                  className={cn(
                    superAdminReportRowClass,
                    "relative min-h-[86px] border-b border-border-subtle py-3 text-left transition-colors last:border-b-0 hover:bg-brand-bg",
                  )}
                >
                  <Link href={`/reports/${report.id}`} aria-label={`Open ${report.title}`} className="absolute inset-0 z-0" />
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
                    {report.company?.name || "Personal"}
                  </span>

                  <span className="min-w-0 truncate text-label font-medium text-white">
                    {report.creator.email}
                  </span>

                  <span className="min-w-0 truncate text-label font-medium text-white">
                    {report.reviewer?.full_name || "Unassigned"}
                  </span>

                  <span className="text-label font-medium whitespace-nowrap text-white">
                    {formatReportDateTime(report.updated_at)}
                  </span>

                  <span className="justify-self-start">
                    <DashboardStatusPill
                      status={getSuperAdminReportDisplayStatus(report)}
                    />
                  </span>

                  {canManageReportComments ? <button
                    type="button"
                    className="relative z-10 justify-self-start rounded-button border border-border-default px-3 py-2 text-label font-medium text-white hover:bg-surface-elevated"
                    onClick={() => setCommentsReport(report)}
                    aria-label={`Comments for ${report.title}`}
                  >
                    Comments
                  </button> : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {isUpdatingResults ? "Updating report results." : ""}
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
            ariaLabel="Reports pagination"
            onPageChange={handlePageChange}
          />
        </div>
      ) : null}
      {canManageReportComments && commentsReport ? (
        <AdminReportCommentsDialog
          reportId={commentsReport.id}
          reportTitle={commentsReport.title}
          onClose={() => setCommentsReport(null)}
        />
      ) : null}
    </section>
  );
}
