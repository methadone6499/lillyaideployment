"use client";
import { useState } from "react";
import { Button, Select } from "@/components/ui";
import { hasPermission, useAuthUser } from "@/features/auth";
import { formatAmountMinor } from "@/features/billing";
import { DashboardPagination } from "@/features/dashboard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/cn";
import { ApiRequestError } from "@/services/ApiRequestError";
import { useAdminSubscriptions } from "../hooks/useAdminSubscriptions";
import { adminSubscriptionFiltersSchema, type AdminSubscriptionFilters } from "../schemas/adminSubscriptionSchemas";
import { PLAN_TYPE_LABELS, SUBSCRIPTION_STATUS_LABELS, statusPillClass } from "../utils/adminManagementDisplay";
import { AdminSubscriptionDetailDialog } from "./AdminSubscriptionDetailDialog";
import { AdminRequestId } from "./AdminRequestId";
const rowClass = "grid min-w-[1280px] grid-cols-[minmax(220px,1.5fr)_minmax(160px,1fr)_110px_100px_80px_160px_130px_100px] items-center gap-x-6 px-6";
const all = { value: "", label: "All" };
export function AdminSubscriptionsTable() {
  const { authMe } = useAuthUser();
  const canRead = hasPermission(authMe, "admin:subscriptions_read");
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search, 300);
  const [filters, setFilters] = useState<AdminSubscriptionFilters>({ limit: 20 });
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<string | null>(null);
  const queryFilters = { ...filters, search: debounced.trim() || undefined };
  const query = useAdminSubscriptions(queryFilters);
  const loaded = query.data?.pages.length ?? 0;
  const safePage = Math.min(page, Math.max(loaded, 1));
  const items = query.data?.pages[safePage - 1]?.items ?? [];
  const apiError = query.error instanceof ApiRequestError ? query.error : null;
  const changeFilter = (key: "plan_type" | "status" | "scope_type" | "limit", value: string) => {
    setFilters(adminSubscriptionFiltersSchema.parse({ ...filters, [key]: key === "limit" ? Number(value) : value || undefined }));
    setPage(1);
  };
  const changePage = async (next: number) => {
    if (next <= loaded) {
      setPage(next);
      return;
    }
    if (!query.hasNextPage || query.isFetchingNextPage)
      return;
    const result = await query.fetchNextPage();
    if (!result.isError)
      setPage(next);
    else if (result.error instanceof ApiRequestError && result.error.code === "invalid_cursor")
      setPage(1);
  };
  const hasFilters = Boolean(queryFilters.search || filters.plan_type || filters.status || filters.scope_type);
  return <section aria-label="Subscriptions" aria-busy={query.isFetching} className="mt-9 lg:mt-14">
    <div className="overflow-hidden rounded-surface border border-border-default bg-surface-default">
      <div className="flex flex-col gap-4 px-6 py-4">
        <h2 className="text-card-title font-medium text-white">Subscriptions</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,2fr)_repeat(4,minmax(130px,1fr))]">
          <label className="flex flex-col gap-2 text-helper text-text-muted">Search subscriptions<input type="search" maxLength={100} value={search} placeholder="Customer, email, or subscription ID" onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="h-14 w-full rounded-surface bg-surface-subtle px-4 text-label text-white outline-none placeholder:text-text-placeholder focus-visible:ring-2 focus-visible:ring-brand/35" /></label>
          <Select label="Plan" value={filters.plan_type ?? ""} options={[all, ...Object.entries(PLAN_TYPE_LABELS).map(([value, label]) => ({ value, label }))]} onChange={(event) => changeFilter("plan_type", event.target.value)} />
          <Select label="Status" value={filters.status ?? ""} options={[all, ...Object.entries(SUBSCRIPTION_STATUS_LABELS).map(([value, label]) => ({ value, label }))]} onChange={(event) => changeFilter("status", event.target.value)} />
          <Select label="Scope" value={filters.scope_type ?? ""} options={[all, { value: "user", label: "Personal" }, { value: "company", label: "Company" }]} onChange={(event) => changeFilter("scope_type", event.target.value)} />
          <Select label="Rows per page" value={String(filters.limit)} options={[10, 20, 50].map((value) => ({ value: String(value), label: String(value) }))} onChange={(event) => changeFilter("limit", event.target.value)} />
        </div>
      </div>
      {!authMe || (query.isPending && canRead) ? <p role="status" className="px-6 py-10 text-label text-text-muted">Loading subscriptions…</p> : !canRead ? <p role="alert" className="px-6 py-10 text-label text-text-muted">You do not have permission to view subscriptions.</p> : <>
        <div className="overflow-x-auto"><div role="table" aria-label="Subscriptions">
          <div role="row" className={cn(rowClass, "h-14 bg-surface-subtle text-label font-medium text-text-step")}>{["Customer", "Billing owner", "Plan", "Reports/month", "Seats", "Payment/month", "Status", "Action"].map((label) => <span role="columnheader" key={label}>{label}</span>)}</div>
          {items.map((s) => <div role="row" key={s.id} className={cn(rowClass, "min-h-[86px] border-b border-border-subtle py-3 text-label text-white last:border-b-0 hover:bg-brand-bg")}>
            <span role="cell" className="min-w-0"><span className="block truncate">{s.scope_type === "company" ? s.company?.name || "Unavailable company" : s.subscriber.full_name || s.subscriber.email || "Unavailable customer"}</span><span className="text-helper text-text-muted">{s.scope_type === "company" ? "Company" : "Personal"}{s.cancel_at_period_end ? " · Cancellation scheduled" : ""}</span></span>
            <span role="cell" className="min-w-0"><span className="block truncate">{s.subscriber.full_name || "Name unavailable"}</span><span className="block truncate text-helper text-text-muted">{s.subscriber.email || "Email unavailable"}</span></span>
            <span role="cell">{PLAN_TYPE_LABELS[s.plan_type]}</span><span role="cell" className="tabular-nums">{s.limits.reports.toLocaleString()}</span><span role="cell" className="tabular-nums">{s.limits.seats.toLocaleString()}</span>
            <span role="cell" className="tabular-nums">{formatAmountMinor(s.amount_minor, s.currency)}</span>
            <span role="cell"><span className={cn("inline-flex rounded-card p-2.5 text-input font-medium", statusPillClass(s.status))}>{SUBSCRIPTION_STATUS_LABELS[s.status]}</span></span>
            <span role="cell"><Button variant="table" size="compact" aria-label={`View subscription ${s.id}`} onClick={() => setDetail(s.id)}>View</Button></span>
          </div>)}
        </div></div>
        {!items.length && !query.isError ? <p className="px-6 py-10 text-center text-label text-text-muted">{hasFilters ? "No subscriptions match these filters." : "No subscriptions yet."}</p> : null}
        {query.isError ? <div role="alert" className="flex flex-wrap items-center gap-3 px-6 py-6 text-label text-text-muted"><p>{apiError?.message ?? "Unable to load subscriptions."}</p><AdminRequestId requestId={apiError?.requestId} /><Button variant="table" size="compact" disabled={query.isFetching} onClick={() => {
          if (query.isFetchNextPageError)
            void query.fetchNextPage();
          else
            void query.refetch();
        }}>Retry</Button></div> : null}
      </>}
    </div>
    <p className="sr-only" aria-live="polite">{query.isFetching && items.length ? "Updating subscriptions." : ""}</p>
    {loaded > 1 || query.hasNextPage ? <div className="mt-4 px-2"><DashboardPagination currentPage={safePage} totalPages={Math.max(1, loaded + (query.hasNextPage ? 1 : 0))} isPageChangePending={query.isFetchingNextPage} ariaLabel="Subscriptions pagination" onPageChange={changePage} /></div> : null}
    {detail ? <AdminSubscriptionDetailDialog id={detail} onClose={() => setDetail(null)} /> : null}
  </section>;
}
