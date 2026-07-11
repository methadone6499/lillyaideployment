"use client";

import { cn } from "@/lib/cn";
import { useMemo, useState } from "react";
import { dashboardReports } from "../data/dashboardData";
import type { DashboardReport } from "../types";
import { DashboardPagination } from "./DashboardPagination";
import {
  DashboardStatusFilter,
  type DashboardStatusFilterValue,
} from "./DashboardStatusFilter";
import { DashboardStatusPill } from "./DashboardStatusPill";

const ROWS_PER_PAGE = 6;

const reportRowClass =
  "grid min-w-[860px] grid-cols-[minmax(260px,1fr)_240px_160px_24px] items-center gap-x-12 px-6";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-6", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-6", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function filterReports(
  reports: DashboardReport[],
  searchQuery: string,
  statusFilter: DashboardStatusFilterValue,
): DashboardReport[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return reports.filter((report) => {
    const matchesStatus =
      statusFilter === "all" || report.status === statusFilter;
    const matchesSearch =
      normalizedQuery.length === 0 ||
      report.name.toLowerCase().includes(normalizedQuery);

    return matchesStatus && matchesSearch;
  });
}

export function RecentReportsTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<DashboardStatusFilterValue>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredReports = useMemo(
    () => filterReports(dashboardReports, searchQuery, statusFilter),
    [searchQuery, statusFilter],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReports.length / ROWS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedReports = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ROWS_PER_PAGE;
    return filteredReports.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredReports, safeCurrentPage]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: DashboardStatusFilterValue) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return (
    <section
      aria-label="Recent reports"
      className="overflow-hidden rounded-button border border-border-default bg-surface-default"
    >
      <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-card-title font-medium text-white">
          Recent reports
        </h2>

        <div className="flex w-full flex-col gap-3 sm:max-w-[664px] sm:flex-1 sm:flex-row sm:items-center sm:gap-4">
          <label className="relative block w-full sm:flex-1">
            <span className="sr-only">Search report name, users</span>
            <span className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-white/28">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={searchQuery}
              placeholder="Search report name, users"
              onChange={(event) => handleSearchChange(event.target.value)}
              className="h-14 w-full rounded-button bg-surface-subtle py-4 pr-5 pl-14 text-body-lg text-white outline-none placeholder:text-white/28 focus:ring-1 focus:ring-border-default"
            />
          </label>

          <DashboardStatusFilter
            value={statusFilter}
            onChange={handleStatusFilterChange}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className={cn(
            reportRowClass,
            "h-14 bg-surface-subtle text-label font-medium text-text-step",
          )}
        >
          <span>Report Name</span>
          <span>Date/Time</span>
          <span>Status</span>
          <span className="sr-only">Open</span>
        </div>

        <div className="flex flex-col">
          {paginatedReports.length === 0 ? (
            <p className="px-6 py-10 text-center text-label text-text-muted">
              No reports match your filters.
            </p>
          ) : (
            paginatedReports.map((report, index) => {
              const rowNumber =
                (safeCurrentPage - 1) * ROWS_PER_PAGE + index + 1;

              return (
                <button
                  key={report.id}
                  type="button"
                  className={cn(
                    reportRowClass,
                    "h-[86px] border-b border-border-subtle text-left transition-colors last:border-b-0 hover:bg-brand-bg",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-4">
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-toggle-knob bg-surface-elevated text-input font-medium text-white">
                      {rowNumber}
                    </span>
                    <span className="truncate text-label font-medium text-white">
                      {report.name}
                    </span>
                  </span>

                  <span className="text-label font-medium whitespace-nowrap text-white">
                    {report.dateTime}
                  </span>

                  <span className="justify-self-start">
                    <DashboardStatusPill status={report.status} />
                  </span>

                  <ChevronRightIcon className="justify-self-end text-white" />
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="border-t border-border-default px-6 py-4">
        <DashboardPagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </section>
  );
}
