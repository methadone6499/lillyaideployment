"use client";

import { ChevronRightIcon } from "@/components/ui/icons";
import {
  DashboardPagination,
  DashboardSearchInput,
  DashboardStatusFilter,
} from "@/features/dashboard";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  REVIEWER_STATUS_FILTER_OPTIONS,
  type ReviewerAssignedReport,
  type ReviewerStatusFilterValue,
} from "../types";
import { ReviewerStatusPill } from "./ReviewerStatusPill";

const ROWS_PER_PAGE = 6;

const reportRowClass =
  "grid min-w-[980px] grid-cols-[minmax(240px,1fr)_180px_160px_140px_24px] items-center gap-x-12 px-6";

type ReviewerReportsTableProps = {
  reports: readonly ReviewerAssignedReport[];
};

function filterAssignedReports(
  reports: readonly ReviewerAssignedReport[],
  searchQuery: string,
  statusFilter: ReviewerStatusFilterValue,
): ReviewerAssignedReport[] {
  const query = searchQuery.trim().toLowerCase();

  return reports.filter((report) => {
    const matchesStatus =
      statusFilter === "all" || report.status === statusFilter;
    const matchesSearch =
      query.length === 0 || report.name.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });
}

export function ReviewerReportsTable({ reports }: ReviewerReportsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ReviewerStatusFilterValue>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredReports = useMemo(
    () => filterAssignedReports(reports, searchQuery, statusFilter),
    [reports, searchQuery, statusFilter],
  );
  const hasActiveFilters =
    searchQuery.trim().length > 0 || statusFilter !== "all";
  const totalPages = Math.max(
    1,
    Math.ceil(filteredReports.length / ROWS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageReports = filteredReports.slice(
    (safeCurrentPage - 1) * ROWS_PER_PAGE,
    safeCurrentPage * ROWS_PER_PAGE,
  );
  const showEmpty = pageReports.length === 0;

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: ReviewerStatusFilterValue) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === safeCurrentPage) {
      return;
    }

    setCurrentPage(page);
  };

  return (
    <section aria-label="Recent reports">
      <div className="overflow-hidden rounded-button border border-border-default bg-surface-default">
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-card-title font-medium text-white">
            Recent reports
          </h2>

          <div className="flex w-full flex-col gap-3 sm:max-w-[664px] sm:flex-1 sm:flex-row sm:items-center sm:gap-4">
            <DashboardSearchInput
              value={searchQuery}
              onChange={handleSearchChange}
            />

            <DashboardStatusFilter
              value={statusFilter}
              options={REVIEWER_STATUS_FILTER_OPTIONS}
              showSelectedLabel
              onChange={handleStatusFilterChange}
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
            <span>Report Name</span>
            <span>Assigned Date</span>
            <span>Deadline</span>
            <span>Status</span>
            <span className="sr-only">Open</span>
          </div>

          <div className="flex flex-col">
            {showEmpty ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">
                {hasActiveFilters
                  ? "No reports match your search or status filter."
                  : "No reports have been assigned yet."}
              </p>
            ) : (
              pageReports.map((report, index) => (
                <Link
                  key={report.platformReportId}
                  href={`/reviewer/reports/${report.platformReportId}`}
                  className={cn(
                    reportRowClass,
                    "h-[86px] border-b border-border-subtle text-left transition-colors last:border-b-0 hover:bg-brand-bg focus-visible:bg-brand-bg focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-4">
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-toggle-knob bg-surface-elevated text-input font-medium text-white">
                      {(safeCurrentPage - 1) * ROWS_PER_PAGE + index + 1}
                    </span>
                    <span className="truncate text-label font-medium text-white">
                      {report.name}
                    </span>
                  </span>

                  <span className="text-label font-medium whitespace-nowrap text-white">
                    {report.assignedDate}
                  </span>

                  <span className="text-label font-medium whitespace-nowrap text-white">
                    {report.deadline}
                  </span>

                  <span className="justify-self-start">
                    <ReviewerStatusPill status={report.status} />
                  </span>

                  <ChevronRightIcon className="justify-self-end text-white" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {showEmpty
          ? hasActiveFilters
            ? "No reports match your search or status filter."
            : "No reports have been assigned yet."
          : ""}
      </p>

      {totalPages > 1 ? (
        <div className="mt-4 px-2">
          <DashboardPagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            ariaLabel="Recent reports pagination"
            onPageChange={handlePageChange}
          />
        </div>
      ) : null}
    </section>
  );
}
