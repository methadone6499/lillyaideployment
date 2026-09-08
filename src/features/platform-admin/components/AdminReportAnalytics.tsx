"use client";

import { Button } from "@/components/ui";
import { hasPermission, useAuthUser } from "@/features/auth";
import {
  useAdminPopularDrugs,
  useAdminReportTotals,
  useAdminTopReportCompanies,
  useAdminTopReportUsers,
} from "@/features/reports";
import { ApiRequestError } from "@/services/ApiRequestError";
import { useMemo } from "react";
import { AdminReportLeaderboardCard } from "./AdminReportLeaderboardCard";
import { AdminReportTotalsCards } from "./AdminReportTotalsCards";

const lastUpdatedFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const UNKNOWN_COMPANY_LABEL = "Unknown company";
const ACCESS_DENIED_MESSAGE =
  "You do not have permission to view report analytics.";

function isAccessDeniedError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    (error.status === 403 || error.code === "permission_denied")
  );
}

function getAnalyticsRequestId(error: unknown): string | null {
  if (error instanceof ApiRequestError) {
    return error.requestId;
  }

  return null;
}

function getAnalyticsErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (isAccessDeniedError(error)) {
    return ACCESS_DENIED_MESSAGE;
  }

  if (error instanceof ApiRequestError) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function formatLastUpdated(isoTimestamp: string): string | null {
  const date = new Date(isoTimestamp);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return lastUpdatedFormatter.format(date);
}

export function AdminReportAnalytics() {
  const { authMe } = useAuthUser();
  const canReadAdminReports = hasPermission(authMe, "admin:reports_read");
  const totalsQuery = useAdminReportTotals();
  const popularDrugsQuery = useAdminPopularDrugs();
  const topUsersQuery = useAdminTopReportUsers();
  const topCompaniesQuery = useAdminTopReportCompanies();

  const authReady = Boolean(authMe);
  const queriesEnabled = authReady && canReadAdminReports;

  const popularDrugItems = useMemo(
    () =>
      (popularDrugsQuery.data?.items ?? []).map((item) => ({
        id: item.drug_name,
        primaryLabel: item.drug_name,
        reportCount: item.report_count,
      })),
    [popularDrugsQuery.data],
  );

  const topUserItems = useMemo(
    () =>
      (topUsersQuery.data?.items ?? []).map((item) => ({
        id: item.user_id,
        primaryLabel: item.full_name,
        secondaryLabel: item.email,
        reportCount: item.report_count,
      })),
    [topUsersQuery.data],
  );

  const topCompanyItems = useMemo(
    () =>
      (topCompaniesQuery.data?.items ?? []).map((item) => ({
        id: item.company_id,
        primaryLabel: item.company_name?.trim() || UNKNOWN_COMPANY_LABEL,
        reportCount: item.report_count,
        title: item.company_id,
      })),
    [topCompaniesQuery.data],
  );

  const totalsAccessDenied =
    (authReady && !canReadAdminReports) ||
    isAccessDeniedError(totalsQuery.error);
  const popularDrugsAccessDenied =
    (authReady && !canReadAdminReports) ||
    isAccessDeniedError(popularDrugsQuery.error);
  const topUsersAccessDenied =
    (authReady && !canReadAdminReports) ||
    isAccessDeniedError(topUsersQuery.error);
  const topCompaniesAccessDenied =
    (authReady && !canReadAdminReports) ||
    isAccessDeniedError(topCompaniesQuery.error);

  const lastUpdated = totalsQuery.data
    ? formatLastUpdated(totalsQuery.data.as_of)
    : null;
  const isRefreshing =
    queriesEnabled &&
    (totalsQuery.isFetching ||
      popularDrugsQuery.isFetching ||
      topUsersQuery.isFetching ||
      topCompaniesQuery.isFetching);

  const handleRefresh = () => {
    void totalsQuery.refetch();
    void popularDrugsQuery.refetch();
    void topUsersQuery.refetch();
    void topCompaniesQuery.refetch();
  };

  return (
    <section aria-label="Report analytics" className="mt-9 lg:mt-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-label text-text-muted" aria-live="polite">
            {lastUpdated ? (
              <>
                Last updated{" "}
                <time dateTime={totalsQuery.data?.as_of}>{lastUpdated}</time>
                {" · "}
                Counts use UTC calendar boundaries
              </>
            ) : (
              "Counts use UTC calendar boundaries"
            )}
          </p>
          <p className="mt-1 text-helper text-text-step">
            Includes generating, completed, and failed requests.
          </p>
        </div>

        <Button
          variant="secondary"
          disabled={!queriesEnabled || isRefreshing}
          className="w-full shrink-0 sm:w-auto"
          onClick={handleRefresh}
        >
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <AdminReportTotalsCards
        totals={
          totalsQuery.data
            ? {
                today: totalsQuery.data.today,
                thisWeek: totalsQuery.data.this_week,
                thisMonth: totalsQuery.data.this_month,
              }
            : null
        }
        isLoading={!authReady || (queriesEnabled && totalsQuery.isLoading)}
        isRefreshing={queriesEnabled && totalsQuery.isFetching}
        isAccessDenied={totalsAccessDenied}
        errorMessage={
          totalsQuery.isError && !totalsAccessDenied
            ? getAnalyticsErrorMessage(
                totalsQuery.error,
                "Unable to load report totals. Please try again.",
              )
            : null
        }
        requestId={getAnalyticsRequestId(totalsQuery.error)}
        onRetry={() => {
          void totalsQuery.refetch();
        }}
      />

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:mt-6 xl:grid-cols-3">
        <AdminReportLeaderboardCard
          title="Popular drugs"
          headingId="admin-report-analytics-popular-drugs"
          items={popularDrugItems}
          isLoading={
            !authReady || (queriesEnabled && popularDrugsQuery.isLoading)
          }
          isRefreshing={queriesEnabled && popularDrugsQuery.isFetching}
          isAccessDenied={popularDrugsAccessDenied}
          errorMessage={
            popularDrugsQuery.isError && !popularDrugsAccessDenied
              ? getAnalyticsErrorMessage(
                  popularDrugsQuery.error,
                  "Unable to load popular drugs. Please try again.",
                )
              : null
          }
          requestId={getAnalyticsRequestId(popularDrugsQuery.error)}
          onRetry={() => {
            void popularDrugsQuery.refetch();
          }}
        />
        <AdminReportLeaderboardCard
          title="Top users"
          headingId="admin-report-analytics-top-users"
          items={topUserItems}
          isLoading={!authReady || (queriesEnabled && topUsersQuery.isLoading)}
          isRefreshing={queriesEnabled && topUsersQuery.isFetching}
          isAccessDenied={topUsersAccessDenied}
          errorMessage={
            topUsersQuery.isError && !topUsersAccessDenied
              ? getAnalyticsErrorMessage(
                  topUsersQuery.error,
                  "Unable to load top users. Please try again.",
                )
              : null
          }
          requestId={getAnalyticsRequestId(topUsersQuery.error)}
          onRetry={() => {
            void topUsersQuery.refetch();
          }}
        />
        <AdminReportLeaderboardCard
          title="Top companies"
          headingId="admin-report-analytics-top-companies"
          items={topCompanyItems}
          isLoading={
            !authReady || (queriesEnabled && topCompaniesQuery.isLoading)
          }
          isRefreshing={queriesEnabled && topCompaniesQuery.isFetching}
          isAccessDenied={topCompaniesAccessDenied}
          errorMessage={
            topCompaniesQuery.isError && !topCompaniesAccessDenied
              ? getAnalyticsErrorMessage(
                  topCompaniesQuery.error,
                  "Unable to load top companies. Please try again.",
                )
              : null
          }
          requestId={getAnalyticsRequestId(topCompaniesQuery.error)}
          onRetry={() => {
            void topCompaniesQuery.refetch();
          }}
        />
      </div>
    </section>
  );
}
