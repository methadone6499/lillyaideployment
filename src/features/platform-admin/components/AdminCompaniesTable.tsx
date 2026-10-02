"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Select } from "@/components/ui";
import { SearchIcon } from "@/components/ui/icons";
import { hasPermission, useAuthUser } from "@/features/auth";
import {
  planTypeSchema,
  subscriptionStatusSchema,
  type PlanType,
  type SubscriptionStatus,
} from "@/features/billing";
import { DashboardPagination } from "@/features/dashboard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/cn";

import { useAdminCompanies } from "../hooks/useAdminCompanies";
import {
  companyStatusSchema,
  companyTypeSchema,
  type CompanyStatus,
  type CompanyType,
} from "../schemas/adminCompanySchemas";
import { classifyAdminManagementError } from "../utils/adminManagement";
import {
  COMPANY_STATUS_LABELS,
  COMPANY_TYPE_LABELS,
  PLAN_TYPE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  statusPillClass,
} from "../utils/adminManagementDisplay";
import { AdminRequestId } from "./AdminRequestId";

const ROWS_PER_PAGE = 10;
const MAX_SEARCH_LENGTH = 100;
const SEARCH_DEBOUNCE_MS = 300;

const companyRowClass =
  "grid min-w-[1180px] grid-cols-[minmax(220px,1.4fr)_minmax(210px,1.25fr)_120px_130px_150px_150px_100px] items-center gap-x-5 px-6";

const STATUS_OPTIONS = Object.entries(COMPANY_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);
const TYPE_OPTIONS = Object.entries(COMPANY_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);
const PLAN_OPTIONS = Object.entries(PLAN_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);
const SUBSCRIPTION_OPTIONS = Object.entries(SUBSCRIPTION_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export function AdminCompaniesTable() {
  const { authMe } = useAuthUser();
  const canRead = hasPermission(authMe, "admin:companies_read");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  const status = companyStatusSchema.safeParse(statusFilter);
  const companyType = companyTypeSchema.safeParse(typeFilter);
  const planType = planTypeSchema.safeParse(planFilter);
  const subscriptionStatus = subscriptionStatusSchema.safeParse(
    subscriptionFilter,
  );
  const search = debouncedSearch.trim().slice(0, MAX_SEARCH_LENGTH) || undefined;

  const query = useAdminCompanies({
    limit: ROWS_PER_PAGE,
    search,
    status: status.success ? (status.data as CompanyStatus) : undefined,
    type: companyType.success ? (companyType.data as CompanyType) : undefined,
    planType: planType.success ? (planType.data as PlanType) : undefined,
    subscriptionStatus: subscriptionStatus.success
      ? (subscriptionStatus.data as SubscriptionStatus)
      : undefined,
    enabled: canRead,
  });

  const loadedPageCount = query.data?.pages.length ?? 0;
  const safeCurrentPage = Math.min(currentPage, Math.max(loadedPageCount, 1));
  const companies = useMemo(
    () => query.data?.pages[safeCurrentPage - 1]?.items ?? [],
    [query.data, safeCurrentPage],
  );
  const totalPages = Math.max(1, loadedPageCount + (query.hasNextPage ? 1 : 0));
  const classifiedError = query.error
    ? classifyAdminManagementError(query.error)
    : null;
  const hasFilters = Boolean(
    search || status.success || companyType.success || planType.success || subscriptionStatus.success,
  );

  const resetPage = () => setCurrentPage(1);
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setTypeFilter("");
    setPlanFilter("");
    setSubscriptionFilter("");
    resetPage();
  };

  const handlePageChange = async (page: number) => {
    if (page < 1 || page === safeCurrentPage) return;
    if (page <= loadedPageCount) {
      setCurrentPage(page);
      return;
    }

    if (page === loadedPageCount + 1 && query.hasNextPage) {
      const result = await query.fetchNextPage();
      if (result.isError) {
        if (classifyAdminManagementError(result.error).kind === "invalid_cursor") {
          setCurrentPage(1);
        }
        return;
      }
      setCurrentPage(page);
    }
  };

  const showLoading = !authMe || (canRead && query.isLoading && companies.length === 0);
  const showDenied = Boolean(authMe) && !canRead;
  const showError = canRead && query.isError && companies.length === 0;
  const showEmpty =
    canRead && !showLoading && !showError && companies.length === 0 && !query.isFetching;

  return (
    <section aria-label="Companies" aria-busy={query.isFetching} className="mt-10">
      <div className="overflow-hidden rounded-button border border-border-default bg-surface-default">
        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-card-title font-medium text-white">Companies</h2>
            <label className="relative block w-full lg:max-w-[440px]">
              <span className="sr-only">Search companies</span>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-white/30" />
              <input
                type="search"
                value={searchQuery}
                maxLength={MAX_SEARCH_LENGTH}
                placeholder="Search company, billing email or administrator"
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  resetPage();
                }}
                className="h-12 w-full rounded-card bg-surface-subtle pr-5 pl-14 text-label text-white outline-none placeholder:text-white/30 focus:ring-1 focus:ring-border-default"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Select
              value={statusFilter}
              options={STATUS_OPTIONS}
              placeholder="Company status"
              clearable
              clearLabel="All statuses"
              onChange={(event) => {
                setStatusFilter(event.target.value);
                resetPage();
              }}
            />
            <Select
              value={typeFilter}
              options={TYPE_OPTIONS}
              placeholder="Company type"
              clearable
              clearLabel="All types"
              onChange={(event) => {
                setTypeFilter(event.target.value);
                resetPage();
              }}
            />
            <Select
              value={planFilter}
              options={PLAN_OPTIONS}
              placeholder="Plan"
              clearable
              clearLabel="All plans"
              onChange={(event) => {
                setPlanFilter(event.target.value);
                resetPage();
              }}
            />
            <Select
              value={subscriptionFilter}
              options={SUBSCRIPTION_OPTIONS}
              placeholder="Subscription status"
              clearable
              clearLabel="All subscription statuses"
              onChange={(event) => {
                setSubscriptionFilter(event.target.value);
                resetPage();
              }}
            />
            <button
              type="button"
              disabled={!hasFilters}
              onClick={clearFilters}
              className="h-12 rounded-card border border-border-default px-4 text-label font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className={cn(companyRowClass, "h-14 bg-surface-subtle text-label font-medium text-text-step")}>
            <span>Company</span><span>Primary Admin</span><span>Type</span><span>Plan</span><span>Seats</span><span>Quota</span><span>Status</span>
          </div>
          <div className="flex flex-col">
            {showLoading ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">Loading companies…</p>
            ) : showDenied ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">You do not have permission to view companies.</p>
            ) : showError ? (
              <div role="alert" className="flex flex-col items-center gap-3 px-6 py-10 text-center text-label text-text-muted">
                <p>{classifiedError?.message}</p>
                <AdminRequestId requestId={classifiedError?.requestId} />
                {classifiedError?.kind === "validation_error" ? (
                  <button type="button" onClick={clearFilters} className="rounded-button border border-border-default px-4 py-2 text-white">Clear filters</button>
                ) : (
                  <button type="button" onClick={() => void query.refetch()} className="rounded-button border border-border-default px-4 py-2 text-white">Try again</button>
                )}
              </div>
            ) : showEmpty ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">{hasFilters ? "No companies match these filters." : "No companies found."}</p>
            ) : (
              companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/admin/companies/${encodeURIComponent(company.id)}`}
                  className={cn(companyRowClass, "min-h-[88px] border-b border-border-subtle py-3 text-label text-white last:border-b-0 hover:bg-brand-bg focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-brand")}
                >
                  <span className="min-w-0"><span className="block truncate font-medium">{company.name}</span><span className="block truncate text-helper text-text-muted">{company.billing_email}</span></span>
                  <span className="min-w-0"><span className="block truncate">{company.primary_admin?.full_name ?? "Unassigned"}</span><span className="block truncate text-helper text-text-muted">{company.primary_admin?.email ?? "—"}</span></span>
                  <span>{COMPANY_TYPE_LABELS[company.type]}</span>
                  <span>{company.subscription ? PLAN_TYPE_LABELS[company.subscription.plan_type] : "None"}</span>
                  <span>{company.seats.occupied} / {company.seats.limit} occupied</span>
                  <span>{company.quota ? `${company.quota.remaining} / ${company.quota.total} remaining` : "—"}</span>
                  <span className={cn("w-fit rounded-card px-2.5 py-2 text-input font-medium", statusPillClass(company.status))}>{COMPANY_STATUS_LABELS[company.status]}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {query.isFetchNextPageError && companies.length > 0 ? (
        <div role="alert" className="mt-4 flex justify-end gap-3 text-label text-text-muted">
          <span>{classifiedError?.message}</span>
          <AdminRequestId requestId={classifiedError?.requestId} />
          <button type="button" onClick={() => void query.fetchNextPage()} className="text-white underline">Retry</button>
        </div>
      ) : null}

      <div className="mt-4">
        <DashboardPagination currentPage={safeCurrentPage} totalPages={totalPages} isPageChangePending={query.isFetchingNextPage} ariaLabel="Companies pagination" onPageChange={handlePageChange} />
      </div>
    </section>
  );
}
