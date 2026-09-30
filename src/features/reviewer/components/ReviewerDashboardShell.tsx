"use client";

import { AppHeader } from "@/components/shared/AppHeader";
import { useAuthUser } from "@/features/auth";
import {
  DashboardGreeting,
  DashboardHeaderActions,
} from "@/features/dashboard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useState } from "react";

import { useReviewerAssignments, useReviewerDashboard } from "../hooks/useReviewerQueries";
import type { ReviewerDashboardFilters } from "../schemas/reviewerSchemas";
import { ReviewerKpiGrid } from "./ReviewerKpiGrid";
import {
  ReviewerReportsTable,
  type ReviewerTableFilter,
} from "./ReviewerReportsTable";

export function ReviewerDashboardShell() {
  const { displayName } = useAuthUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ReviewerTableFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const filters: Omit<ReviewerDashboardFilters, "cursor"> = {
    limit: 6,
    search: debouncedSearch.trim() || undefined,
    status:
      statusFilter !== "all" && statusFilter !== "overdue"
        ? statusFilter
        : undefined,
    overdue: statusFilter === "overdue" ? true : undefined,
  };
  const dashboardQuery = useReviewerDashboard(filters);
  const historyQuery = useReviewerAssignments({
    limit: 20,
    status: filters.status,
    overdue: filters.overdue,
  }, showHistory);
  const overview = dashboardQuery.data?.pages[0];

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: ReviewerTableFilter) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader actions={<DashboardHeaderActions notifications={[]} />} />

      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-4 pt-10 pb-14 sm:px-6 lg:px-12 lg:pt-[57px]">
        <DashboardGreeting
          user={{ displayName: overview?.reviewer.full_name ?? displayName }}
        />

        <div className="mt-10 xl:mt-[55px]">
          {overview?.stats ? (
            <ReviewerKpiGrid stats={overview.stats} />
          ) : (
            <div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
              aria-label="Loading reviewer summary"
            >
              {Array.from({ length: 5 }, (_, index) => (
                <div
                  key={index}
                  className="min-h-[150px] animate-pulse rounded-button border border-border-default bg-surface-default"
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 xl:mt-[60px]">
          <div className="mb-4 flex gap-3">
            <button type="button" className={`rounded-button px-4 py-2 text-label ${!showHistory ? "bg-brand text-white" : "border border-border-default text-text-muted"}`} onClick={() => { setShowHistory(false); setCurrentPage(1); setStatusFilter("all"); }}>Current assignments</button>
            <button type="button" className={`rounded-button px-4 py-2 text-label ${showHistory ? "bg-brand text-white" : "border border-border-default text-text-muted"}`} onClick={() => { setShowHistory(true); setCurrentPage(1); setStatusFilter("all"); setSearchQuery(""); }}>Assignment history</button>
          </div>
          <ReviewerReportsTable
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            currentPage={currentPage}
            query={showHistory ? historyQuery : dashboardQuery}
            isHistory={showHistory}
            onSearchChange={handleSearchChange}
            onStatusFilterChange={handleStatusFilterChange}
            onPageChange={setCurrentPage}
          />
        </div>
      </main>
    </div>
  );
}
