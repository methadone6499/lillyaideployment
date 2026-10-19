"use client";

import { RequestErrorState } from "@/components/ui";
import { useAuthUser } from "@/features/auth";
import {
  DashboardPageFrame,
} from "@/features/dashboard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useState } from "react";

import { useReviewerAssignments, useReviewerDashboard } from "../hooks/useReviewerQueries";
import type { ReviewerDashboardFilters } from "../schemas/reviewerSchemas";
import {
  getReviewerAssignmentFilters,
  type ReviewerAssignmentFilter,
} from "../utils/reviewerAssignmentFilters";
import { ReviewerKpiGrid } from "./ReviewerKpiGrid";
import { ReviewerReportsTable } from "./ReviewerReportsTable";
import { getReviewerRequestErrorMessage } from "../utils/classifyReviewerError";

export function ReviewerDashboardShell() {
  const { displayName } = useAuthUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ReviewerAssignmentFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const currentFilters: Omit<ReviewerDashboardFilters, "cursor"> = {
    limit: 6,
    search: !showHistory ? debouncedSearch.trim() || undefined : undefined,
    ...getReviewerAssignmentFilters("current", showHistory ? "all" : statusFilter),
  };
  const summaryQuery = useReviewerDashboard({
    limit: 6,
    ...getReviewerAssignmentFilters("current", "all"),
  });
  const dashboardQuery = useReviewerDashboard(currentFilters, !showHistory);
  const historyQuery = useReviewerAssignments({
    limit: 20,
    ...getReviewerAssignmentFilters("history", showHistory ? statusFilter : "all"),
  }, showHistory);
  const overview = summaryQuery.data?.pages[0];

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: ReviewerAssignmentFilter) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return (
    <DashboardPageFrame
      displayName={overview?.reviewer.full_name ?? displayName}
      summary={
        <>
          {summaryQuery.isError ? (
            <RequestErrorState
              className={overview?.stats ? "mb-4" : undefined}
              title={overview?.stats ? "Couldn’t refresh your summary" : "Couldn’t load your summary"}
              message={getReviewerRequestErrorMessage(summaryQuery.error, overview?.stats ? "Previously loaded counts are shown below. Try refreshing the summary again." : "Try loading the summary again. You can retry the assignment list separately if needed.")}
              onRetry={() => void summaryQuery.refetch()}
              retryPending={summaryQuery.isFetching}
            />
          ) : null}
          {overview?.stats ? (
            <ReviewerKpiGrid stats={overview.stats} />
          ) : !summaryQuery.isError ? (
            <div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
              aria-label="Loading reviewer summary"
            >
              {Array.from({ length: 5 }, (_, index) => (
                <div
                  key={index}
                  className="min-h-[150px] animate-pulse rounded-surface border border-border-default bg-surface-default"
                />
              ))}
            </div>
          ) : null}
        </>
      }
    >
      <div>
        <div className="mb-4 flex gap-3">
          <button type="button" className={`h-12 rounded-button px-5 text-label font-medium transition-colors ${!showHistory ? "bg-brand text-brand-foreground" : "border border-border-default bg-surface-default text-text-muted hover:bg-surface-elevated"}`} onClick={() => { setShowHistory(false); setCurrentPage(1); setStatusFilter("all"); }}>Current assignments</button>
          <button type="button" className={`h-12 rounded-button px-5 text-label font-medium transition-colors ${showHistory ? "bg-brand text-brand-foreground" : "border border-border-default bg-surface-default text-text-muted hover:bg-surface-elevated"}`} onClick={() => { setShowHistory(true); setCurrentPage(1); setStatusFilter("all"); setSearchQuery(""); }}>Assignment history</button>
        </div>
        <ReviewerReportsTable
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          currentPage={currentPage}
          query={showHistory ? historyQuery : dashboardQuery}
          queryScope={JSON.stringify(showHistory ? historyQuery.queryKey : dashboardQuery.queryKey)}
          isHistory={showHistory}
          onSearchChange={handleSearchChange}
          onStatusFilterChange={handleStatusFilterChange}
          onPageChange={setCurrentPage}
        />
      </div>
    </DashboardPageFrame>
  );
}
