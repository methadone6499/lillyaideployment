"use client";

import { formatDisplayDate as formatDate } from "@/lib/formatDisplay";

import { ChevronRightIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui";
import {
  DashboardPagination,
  DashboardSearchInput,
  DashboardStatusFilter,
} from "@/features/dashboard";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { useReviewerAssignments, useReviewerDashboard } from "../hooks/useReviewerQueries";
import type { ReviewerDashboardItem } from "../schemas/reviewerSchemas";
import { classifyReviewerError } from "../utils/classifyReviewerError";
import {
  getReviewerAssignmentFilterOptions,
  type ReviewerAssignmentFilter,
} from "../utils/reviewerAssignmentFilters";
import { getReviewerAssignmentPagination } from "../utils/reviewerAssignmentPagination";
import { ReviewerStatusPill } from "./ReviewerStatusPill";

const reportRowClass =
  "grid min-w-[1040px] grid-cols-[minmax(260px,1fr)_170px_170px_150px_24px] items-center gap-x-10 px-6";

type Props = {
  searchQuery: string;
  statusFilter: ReviewerAssignmentFilter;
  currentPage: number;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ReviewerAssignmentFilter) => void;
  onPageChange: (page: number) => void;
  query: ReturnType<typeof useReviewerDashboard> | ReturnType<typeof useReviewerAssignments>;
  queryScope: string;
  isHistory?: boolean;
};

export function ReviewerReportsTable({
  searchQuery,
  statusFilter,
  currentPage,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  query,
  queryScope,
  isHistory = false,
}: Props) {
  const paginationRequestRef = useRef(0);
  useEffect(() => {
    return () => {
      // Ignore page changes from a request for a previous tab, filter, or user.
      paginationRequestRef.current += 1;
    };
  }, [queryScope]);

  const pages = query.data?.pages ?? [];
  const { currentPage: displayedPage, totalPages } = getReviewerAssignmentPagination(
    pages,
    currentPage,
    query.hasNextPage,
  );
  const page = pages[displayedPage - 1];
  const reports = page?.items ?? [];
  const error = query.isError ? classifyReviewerError(query.error) : null;
  const hasActiveFilters = (isHistory ? false : searchQuery.trim().length > 0) || statusFilter !== "all";

  const handlePageChange = async (nextPage: number) => {
    if (
      nextPage < 1 || nextPage > totalPages ||
      nextPage === displayedPage || query.isFetchingNextPage
    ) {
      return;
    }

    const requestId = ++paginationRequestRef.current;
    if (nextPage > pages.length) {
      const result = await query.fetchNextPage();
      if (result.isError || requestId !== paginationRequestRef.current) return;
    }

    onPageChange(nextPage);
  };

  return (
    <section aria-label={isHistory ? "Assignment history" : "Current assignments"}>
      <div className="rounded-surface border border-border-default bg-surface-default">
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-card-title font-medium text-white">
            {isHistory ? "Assignment history" : "Assigned reports"}
          </h2>

          <div
            className={cn(
              "flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4",
              isHistory
                ? "sm:ml-auto sm:w-auto sm:flex-none"
                : "sm:max-w-[664px] sm:flex-1",
            )}
          >
            {!isHistory ? <DashboardSearchInput
              value={searchQuery}
              maxLength={200}
              label="Search by report title or drug name"
              placeholder="Search title or drug"
              onChange={onSearchChange}
            /> : null}
            <DashboardStatusFilter
              value={statusFilter}
              options={getReviewerAssignmentFilterOptions(isHistory ? "history" : "current")}
              showSelectedLabel
              onChange={onStatusFilterChange}
            />
          </div>
        </div>

        {/* Clip the rows and scrollbar, leaving the toolbar's menu free to overflow. */}
        <div className="min-w-0 overflow-x-auto rounded-b-surface">
          <div
            className={cn(
              reportRowClass,
              "h-14 bg-surface-subtle text-label font-medium text-text-step",
            )}
          >
            <span>Report</span>
            <span>Assigned</span>
            <span>Due</span>
            <span>Status</span>
            <span className="sr-only">Open</span>
          </div>

          <div className="flex flex-col">
            {query.isPending ? (
              <TableMessage message={isHistory ? "Loading assignment history..." : "Loading current assignments..."} />
            ) : error ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <p className="text-label text-red-400" role="alert">
                  {error.message}
                </p>
                <Button
                  variant="table"
                  size="table"
                  onClick={() => void query.refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : reports.length === 0 ? (
              <TableMessage
                message={
                  hasActiveFilters
                    ? "No assignments match these filters."
                    : isHistory
                      ? "No completed or superseded assignments yet."
                      : "You have no assignments to work on."
                }
              />
            ) : (
              reports.map((report, index) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  rowNumber={(displayedPage - 1) * (isHistory ? 20 : 6) + index + 1}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 px-2">
          <DashboardPagination
            currentPage={displayedPage}
            totalPages={totalPages}
            isPageChangePending={query.isFetchingNextPage}
            ariaLabel={isHistory ? "Assignment history pagination" : "Current assignments pagination"}
            onPageChange={handlePageChange}
          />
        </div>
      ) : null}
    </section>
  );
}

function TableMessage({ message }: { message: string }) {
  return (
    <p className="px-6 py-10 text-center text-label text-text-muted">
      {message}
    </p>
  );
}

function ReportRow({
  report,
  rowNumber,
}: {
  report: ReviewerDashboardItem;
  rowNumber: number;
}) {
  return (
    <Link
      href={`/reviewer/assignments/${encodeURIComponent(report.id)}`}
      className={cn(
        reportRowClass,
        "min-h-[86px] border-b border-border-subtle py-3 text-left transition-colors last:border-b-0 hover:bg-brand-bg focus-visible:bg-brand-bg focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand",
      )}
    >
      <span className="flex min-w-0 items-center gap-4">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-row-index bg-surface-elevated text-input font-medium text-white">
          {rowNumber}
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-label font-medium text-white">
            {report.report.title}
          </span>
          <span className="truncate text-helper text-text-muted">
            {report.report.drug_name}
          </span>
        </span>
      </span>
      <span className="text-label font-medium whitespace-nowrap text-white">
        {formatDate(report.assigned_at)}
      </span>
      <span className="text-label font-medium whitespace-nowrap text-white">
        {formatDate(report.due_at)}
      </span>
      <span className="flex flex-wrap gap-2 justify-self-start">
        <ReviewerStatusPill status={report.status} />
        {report.is_overdue ? <ReviewerStatusPill status="overdue" /> : null}
      </span>
      <ChevronRightIcon className="justify-self-end text-white" />
    </Link>
  );
}
