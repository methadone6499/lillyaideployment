"use client";

import { SearchIcon } from "@/components/ui/icons";
import { hasPermission, useAuthUser } from "@/features/auth";
import {
  DashboardPagination,
  DashboardStatusFilter,
  type DashboardStatusFilterOption,
} from "@/features/dashboard";
import {
  subscriptionStatusSchema,
  type BillingInterval,
  type PlanType,
  type SubscriptionStatus,
} from "@/features/enterprise-activation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/cn";
import { ApiRequestError } from "@/services/ApiRequestError";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useAdminCompanies } from "../hooks/useAdminCompanies";
import type { AdminCompanyResponse } from "../schemas/adminCompanySchemas";

const ROWS_PER_PAGE = 6;
const SEARCH_DEBOUNCE_MS = 300;
const MAX_SEARCH_LENGTH = 100;
const MISSING_VALUE = "—";
const UNAVAILABLE_EDIT_LABEL = "Editing subscriptions is not available yet.";

type SubscriptionStatusFilterValue = SubscriptionStatus | "all";

const SUBSCRIPTION_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "trialing", label: "Trialing" },
  { value: "active", label: "Active" },
  { value: "past_due", label: "Past Due" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
  { value: "suspended", label: "Suspended" },
  { value: "inactive", label: "Inactive" },
] as const satisfies readonly DashboardStatusFilterOption<SubscriptionStatusFilterValue>[];

const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  standard: "Standard Plan",
  enterprise: "Enterprise Plan",
  custom: "Custom Plan",
};

const BILLING_INTERVAL_LABELS: Record<BillingInterval, string> = {
  month: "Monthly",
};

const SUBSCRIPTION_STATUS_PILL_CONFIG: Record<
  SubscriptionStatus,
  { label: string; className: string }
> = {
  trialing: {
    label: "Trialing",
    className: "bg-[rgba(0,101,248,0.12)] text-[#0065f8]",
  },
  active: {
    label: "Active",
    className: "bg-[rgba(16,185,129,0.12)] text-status-success",
  },
  past_due: {
    label: "Past Due",
    className: "bg-[rgba(255,200,92,0.12)] text-status-running",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-white/10 text-text-muted",
  },
  expired: {
    label: "Expired",
    className: "bg-white/10 text-text-muted",
  },
  suspended: {
    label: "Suspended",
    className: "bg-[rgba(217,34,68,0.12)] text-[#d92244]",
  },
  inactive: {
    label: "Inactive",
    className: "bg-[rgba(217,34,68,0.12)] text-[#d92244]",
  },
};

const NONE_STATUS_PILL = {
  label: "None",
  className: "bg-white/10 text-text-muted",
};

const subscriptionRowClass =
  "grid min-w-[1280px] grid-cols-[minmax(200px,1.5fr)_minmax(140px,1fr)_minmax(110px,0.7fr)_minmax(72px,0.5fr)_minmax(130px,0.9fr)_minmax(110px,0.7fr)_minmax(148px,180px)_80px] items-center gap-x-6 px-6";

function getListErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 403) {
      return "You do not have permission to view subscriptions.";
    }

    return error.message || "Unable to load subscriptions. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load subscriptions. Please try again.";
}

function isInvalidCursorError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 400 &&
    error.code === "invalid_cursor"
  );
}

function formatSubscriptionAmount(
  amountMinor: number,
  currency: string,
): string {
  try {
    const normalizedCurrency = currency.toUpperCase();
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizedCurrency,
    });
    const fractionDigits =
      formatter.resolvedOptions().maximumFractionDigits ?? 2;

    return formatter.format(amountMinor / 10 ** fractionDigits);
  } catch {
    return `${amountMinor} ${currency}`;
  }
}

function getSubscriptionName(company: AdminCompanyResponse): string {
  if (!company.subscription) {
    return "No subscription";
  }

  return PLAN_TYPE_LABELS[company.subscription.plan_type];
}

function getAdminName(company: AdminCompanyResponse): string {
  return company.primary_admin?.full_name || "Unassigned";
}

export function AdminSubscriptionsTable() {
  const { authMe } = useAuthUser();
  const canReadAdminCompanies = hasPermission(authMe, "admin:companies_read");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<SubscriptionStatusFilterValue>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  const search =
    debouncedSearch.trim().length > 0
      ? debouncedSearch.trim().slice(0, MAX_SEARCH_LENGTH)
      : undefined;
  const subscriptionStatus = subscriptionStatusSchema.safeParse(statusFilter);

  const companiesQuery = useAdminCompanies({
    limit: ROWS_PER_PAGE,
    search,
    subscriptionStatus: subscriptionStatus.success
      ? subscriptionStatus.data
      : undefined,
    enabled: canReadAdminCompanies,
  });
  const hasActiveFilters = Boolean(search || subscriptionStatus.success);

  const loadedPageCount = companiesQuery.data?.pages.length ?? 0;
  const safeCurrentPage = Math.min(currentPage, Math.max(loadedPageCount, 1));
  const companies = useMemo(
    () => companiesQuery.data?.pages[safeCurrentPage - 1]?.items ?? [],
    [companiesQuery.data, safeCurrentPage],
  );
  const totalPages = Math.max(
    1,
    loadedPageCount + (companiesQuery.hasNextPage ? 1 : 0),
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value.slice(0, MAX_SEARCH_LENGTH));
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: SubscriptionStatusFilterValue) => {
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

    if (page === loadedPageCount + 1 && companiesQuery.hasNextPage) {
      const result = await companiesQuery.fetchNextPage();

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
    (canReadAdminCompanies &&
      companiesQuery.isLoading &&
      companies.length === 0 &&
      !companiesQuery.isError);
  const showPermissionDenied = Boolean(authMe) && !canReadAdminCompanies;
  const showError =
    canReadAdminCompanies &&
    companiesQuery.isError &&
    companies.length === 0 &&
    !isInvalidCursorError(companiesQuery.error);
  const showEmpty =
    canReadAdminCompanies &&
    !showInitialLoading &&
    !showError &&
    companies.length === 0 &&
    !companiesQuery.isFetching;
  const showNextPageError =
    companies.length > 0 &&
    companiesQuery.isFetchNextPageError &&
    !isInvalidCursorError(companiesQuery.error);
  const isUpdatingResults =
    companies.length > 0 &&
    companiesQuery.isFetching &&
    !companiesQuery.isFetchingNextPage;

  return (
    <section
      aria-label="Subscriptions"
      aria-busy={companiesQuery.isFetching}
      className="mt-9 lg:mt-14"
    >
      <div className="overflow-hidden rounded-button border border-border-default bg-surface-default">
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-card-title font-medium text-white">
            Custom Subscriptions
          </h2>

          <div className="flex w-full flex-col gap-3 sm:max-w-[664px] sm:flex-1 sm:flex-row sm:items-center sm:gap-4">
            <label className="relative block w-full sm:flex-1">
              <span className="sr-only">Search subscriptions</span>
              <span className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-white/28">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={searchQuery}
                maxLength={MAX_SEARCH_LENGTH}
                placeholder="Search subscriptions"
                onChange={(event) => handleSearchChange(event.target.value)}
                className="h-14 w-full rounded-button bg-surface-subtle py-4 pr-5 pl-14 text-body-lg text-white outline-none placeholder:text-white/28 focus:ring-1 focus:ring-border-default"
              />
            </label>

            <DashboardStatusFilter
              value={statusFilter}
              options={SUBSCRIPTION_STATUS_FILTER_OPTIONS}
              showSelectedLabel
              onChange={handleStatusFilterChange}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <div
            className={cn(
              subscriptionRowClass,
              "h-14 bg-surface-subtle text-label font-medium text-text-step",
            )}
          >
            <span>Subscription Name</span>
            <span>User Name</span>
            <span>Reports/month</span>
            <span>Seats</span>
            <span>Payment Amount</span>
            <span>Billing Cycle</span>
            <span>Status</span>
            <span className="justify-self-end">Action</span>
          </div>

          <div className="flex flex-col">
            {showInitialLoading ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">
                Loading subscriptions…
              </p>
            ) : showPermissionDenied ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">
                You do not have permission to view subscriptions.
              </p>
            ) : showError ? (
              <div
                className="flex flex-col items-center gap-4 px-6 py-10 text-center text-label text-text-muted"
                role="alert"
              >
                <p>{getListErrorMessage(companiesQuery.error)}</p>
                <button
                  type="button"
                  className="rounded-button border border-border-default px-4 py-2 font-medium text-white transition-colors hover:bg-surface-elevated"
                  onClick={() => {
                    void companiesQuery.refetch();
                  }}
                >
                  Try again
                </button>
              </div>
            ) : showEmpty ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">
                {hasActiveFilters
                  ? "No subscriptions match your search or status filter."
                  : "No company subscriptions yet."}
              </p>
            ) : (
              companies.map((company, index) => {
                const subscription = company.subscription;
                const statusPill = subscription
                  ? SUBSCRIPTION_STATUS_PILL_CONFIG[subscription.status]
                  : NONE_STATUS_PILL;

                return (
                  <div
                    key={company.id}
                    className={cn(
                      subscriptionRowClass,
                      "min-h-[86px] border-b border-border-subtle py-3 text-left last:border-b-0 hover:bg-brand-bg",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-toggle-knob bg-surface-elevated text-input font-medium text-white">
                        {(safeCurrentPage - 1) * ROWS_PER_PAGE + index + 1}
                      </span>
                      <span className="truncate text-label font-medium text-white">
                        {getSubscriptionName(company)}
                      </span>
                    </span>

                    <span className="min-w-0 truncate text-label font-medium text-white">
                      {getAdminName(company)}
                    </span>

                    <span className="min-w-0 truncate text-label font-medium text-white">
                      {subscription
                        ? subscription.limits.reports
                        : MISSING_VALUE}
                    </span>

                    <span className="min-w-0 truncate text-label font-medium text-white">
                      {subscription
                        ? subscription.limits.seats
                        : MISSING_VALUE}
                    </span>

                    <span className="min-w-0 truncate text-label font-medium text-white">
                      {subscription
                        ? formatSubscriptionAmount(
                            subscription.amount_minor,
                            subscription.currency,
                          )
                        : MISSING_VALUE}
                    </span>

                    <span className="min-w-0 truncate text-label font-medium text-white">
                      {subscription
                        ? BILLING_INTERVAL_LABELS[
                            subscription.billing_interval
                          ]
                        : MISSING_VALUE}
                    </span>

                    <span className="justify-self-start">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center rounded-card p-2.5 text-input font-medium whitespace-nowrap",
                          statusPill.className,
                        )}
                      >
                        {statusPill.label}
                      </span>
                    </span>

                    <span className="justify-self-end">
                      <button
                        type="button"
                        disabled
                        title={UNAVAILABLE_EDIT_LABEL}
                        aria-label={`Edit ${getSubscriptionName(company)} (unavailable)`}
                        className="inline-flex size-[52px] shrink-0 items-center justify-center rounded-button bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Image
                          src="/super-admin/subscriptions/edit.svg"
                          alt=""
                          width={24}
                          height={24}
                          aria-hidden
                        />
                      </button>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {isUpdatingResults ? "Updating subscription results." : ""}
      </p>

      {showNextPageError ? (
        <div
          className="mt-4 flex items-center justify-end gap-3 px-2 text-label text-text-muted"
          role="alert"
        >
          <span>{getListErrorMessage(companiesQuery.error)}</span>
          <button
            type="button"
            className="rounded-button border border-border-default px-3 py-1.5 font-medium text-white transition-colors hover:bg-surface-elevated"
            disabled={companiesQuery.isFetchingNextPage}
            onClick={() => {
              void companiesQuery.fetchNextPage();
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
            isPageChangePending={companiesQuery.isFetchingNextPage}
            ariaLabel="Subscriptions pagination"
            onPageChange={handlePageChange}
          />
        </div>
      ) : null}
    </section>
  );
}
