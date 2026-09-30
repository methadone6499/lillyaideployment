"use client";

import { ChevronRightIcon } from "@/components/ui/icons";
import {
  DashboardPagination,
  DashboardSearchInput,
  DashboardStatusFilter,
  type DashboardStatusFilterOption,
} from "@/features/dashboard";
import { cn } from "@/lib/cn";
import Link from "next/link";

import { useReviewerAssignments, useReviewerDashboard } from "../hooks/useReviewerQueries";
import type { ReviewerDashboardItem } from "../schemas/reviewerSchemas";
import { classifyReviewerError } from "../utils/classifyReviewerError";
import { ReviewerStatusPill } from "./ReviewerStatusPill";

type ReviewerTableFilter =
  | "all"
  | "pending"
  | "in_review"
  | "completed"
  | "superseded"
  | "overdue";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In Review" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
  { value: "superseded", label: "Superseded" },
] as const satisfies readonly DashboardStatusFilterOption<ReviewerTableFilter>[];

const reportRowClass =
  "grid min-w-[1040px] grid-cols-[minmax(260px,1fr)_170px_170px_150px_24px] items-center gap-x-10 px-6";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

type Props = {
  searchQuery: string;
  statusFilter: ReviewerTableFilter;
  currentPage: number;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ReviewerTableFilter) => void;
  onPageChange: (page: number) => void;
  query: ReturnType<typeof useReviewerDashboard> | ReturnType<typeof useReviewerAssignments>;
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
  isHistory = false,
}: Props) {
  const pages = query.data?.pages ?? [];
  const page = pages[currentPage - 1];
  const reports = page?.items ?? [];
  const totalPages = Math.max(
    1,
    pages.length + (query.hasNextPage ? 1 : 0),
  );
  const error = query.isError ? classifyReviewerError(query.error) : null;
  const hasActiveFilters = (isHistory ? false : searchQuery.trim().length > 0) || statusFilter !== "all";

  const handlePageChange = async (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
      return;
    }

    if (nextPage > pages.length) {
      const result = await query.fetchNextPage();
      if (result.isError) return;
    }

    onPageChange(nextPage);
  };

  return (
    <section aria-label="Assigned reports">
      <div className="overflow-hidden rounded-button border border-border-default bg-surface-default">
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-card-title font-medium text-white">
            {isHistory ? "Assignment history" : "Assigned reports"}
          </h2>

          <div className="flex w-full flex-col gap-3 sm:max-w-[664px] sm:flex-1 sm:flex-row sm:items-center sm:gap-4">
            {!isHistory ? <DashboardSearchInput
              value={searchQuery}
              maxLength={200}
              label="Search by report title or drug name"
              placeholder="Search title or drug"
              onChange={onSearchChange}
            /> : null}
            <DashboardStatusFilter
              value={statusFilter}
              options={isHistory ? STATUS_OPTIONS : STATUS_OPTIONS.filter((option) => option.value !== "superseded")}
              showSelectedLabel
              onChange={onStatusFilterChange}
            />
          </div>
        </div>

        <div className="min-w-0 overflow-x-auto">
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
              <TableMessage message="Loading assigned reports..." />
            ) : error ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <p className="text-label text-red-400" role="alert">
                  {error.message}
                </p>
                <button
                  type="button"
                  className="text-label font-medium text-brand hover:underline"
                  onClick={() => void query.refetch()}
                >
                  Try again
                </button>
              </div>
            ) : reports.length === 0 ? (
              <TableMessage
                message={
                  hasActiveFilters
                    ? "No assignments match these filters."
                    : "No reports have been assigned yet."
                }
              />
            ) : (
              reports.map((report, index) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  rowNumber={(currentPage - 1) * (isHistory ? 20 : 6) + index + 1}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 px-2">
          <DashboardPagination
            currentPage={currentPage}
            totalPages={totalPages}
            isPageChangePending={query.isFetchingNextPage}
            ariaLabel="Assigned reports pagination"
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
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-toggle-knob bg-surface-elevated text-input font-medium text-white">
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

export type { ReviewerTableFilter };
