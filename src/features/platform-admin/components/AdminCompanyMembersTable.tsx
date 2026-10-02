"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Select } from "@/components/ui";
import { SearchIcon } from "@/components/ui/icons";
import {
  userStatusSchema,
  type UserStatus,
} from "@/features/auth";
import { DashboardPagination } from "@/features/dashboard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/cn";

import { useAdminCompanyMembers } from "../hooks/useAdminCompanyMembers";
import { adminCompanyMemberRoleSchema } from "../schemas/adminCompanyMemberSchemas";
import {
  membershipStatusSchema,
  type MembershipStatus,
} from "../schemas/adminUserSchemas";
import { classifyAdminManagementError } from "../utils/adminManagement";
import {
  MEMBER_ROLE_LABELS,
  MEMBERSHIP_STATUS_LABELS,
  USER_STATUS_LABELS,
  statusPillClass,
} from "../utils/adminManagementDisplay";
import { AdminRequestId } from "./AdminRequestId";

const ROWS_PER_PAGE = 10;
const MAX_SEARCH_LENGTH = 100;
const SEARCH_DEBOUNCE_MS = 300;
const memberRowClass =
  "grid min-w-[1050px] grid-cols-[minmax(220px,1.4fr)_minmax(230px,1.35fr)_150px_160px_160px_90px] items-center gap-x-5 px-6";

const MEMBERSHIP_OPTIONS = [
  { value: "active", label: "Active membership" },
  { value: "disabled", label: "Disabled membership" },
  { value: "removed", label: "Removed members" },
] as const;
const ROLE_OPTIONS = [
  { value: "company_admin", label: "Company Admin" },
  { value: "company_seat_user", label: "Seat User" },
] as const;
const USER_STATUS_OPTIONS = [
  { value: "pending_verification", label: "Pending Verification" },
  { value: "active", label: "Active account" },
  { value: "disabled", label: "Disabled account" },
] as const;

type AdminCompanyMembersTableProps = {
  companyId: string;
  enabled: boolean;
};

export function AdminCompanyMembersTable({
  companyId,
  enabled,
}: AdminCompanyMembersTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [membershipFilter, setMembershipFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const search = debouncedSearch.trim().slice(0, MAX_SEARCH_LENGTH) || undefined;
  const membershipStatus = membershipStatusSchema.safeParse(membershipFilter);
  const role = adminCompanyMemberRoleSchema.safeParse(roleFilter);
  const userStatus = userStatusSchema.safeParse(userStatusFilter);

  const query = useAdminCompanyMembers(companyId, {
    limit: ROWS_PER_PAGE,
    search,
    status: membershipStatus.success
      ? (membershipStatus.data as MembershipStatus)
      : undefined,
    role: role.success ? role.data : undefined,
    userStatus: userStatus.success ? (userStatus.data as UserStatus) : undefined,
    enabled,
  });
  const loadedPageCount = query.data?.pages.length ?? 0;
  const safeCurrentPage = Math.min(currentPage, Math.max(loadedPageCount, 1));
  const members = useMemo(
    () => query.data?.pages[safeCurrentPage - 1]?.items ?? [],
    [query.data, safeCurrentPage],
  );
  const totalPages = Math.max(1, loadedPageCount + (query.hasNextPage ? 1 : 0));
  const classifiedError = query.error
    ? classifyAdminManagementError(query.error)
    : null;
  const hasFilters = Boolean(
    search || membershipStatus.success || role.success || userStatus.success,
  );

  const resetPage = () => setCurrentPage(1);
  const clearFilters = () => {
    setSearchQuery("");
    setMembershipFilter("");
    setRoleFilter("");
    setUserStatusFilter("");
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

  return (
    <section aria-label="Company members" aria-busy={query.isFetching} className="mt-8">
      <div className="overflow-hidden rounded-button border border-border-default bg-surface-default">
        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-card-title font-medium text-white">Company members</h2>
              <p className="mt-1 text-helper text-text-muted">
                The default view includes active and disabled memberships. Select Removed members to view former members.
              </p>
            </div>
            <label className="relative block w-full lg:max-w-[380px]">
              <span className="sr-only">Search company members</span>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-white/30" />
              <input
                type="search"
                value={searchQuery}
                maxLength={MAX_SEARCH_LENGTH}
                placeholder="Search member name or email"
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  resetPage();
                }}
                className="h-12 w-full rounded-card bg-surface-subtle pr-5 pl-14 text-label text-white outline-none placeholder:text-white/30 focus:ring-1 focus:ring-border-default"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Select
              value={membershipFilter}
              options={MEMBERSHIP_OPTIONS}
              placeholder="Membership status"
              clearable
              clearLabel="Current memberships"
              onChange={(event) => {
                setMembershipFilter(event.target.value);
                resetPage();
              }}
            />
            <Select
              value={roleFilter}
              options={ROLE_OPTIONS}
              placeholder="Member role"
              clearable
              clearLabel="All roles"
              onChange={(event) => {
                setRoleFilter(event.target.value);
                resetPage();
              }}
            />
            <Select
              value={userStatusFilter}
              options={USER_STATUS_OPTIONS}
              placeholder="Account status"
              clearable
              clearLabel="All account statuses"
              onChange={(event) => {
                setUserStatusFilter(event.target.value);
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
          <div className={cn(memberRowClass, "h-14 bg-surface-subtle text-label font-medium text-text-step")}>
            <span>Member</span><span>Email</span><span>Role</span><span>Membership</span><span>Account</span><span>Seat</span>
          </div>
          <div className="flex flex-col">
            {query.isLoading && members.length === 0 ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">Loading members…</p>
            ) : query.isError && members.length === 0 ? (
              <div role="alert" className="flex flex-col items-center gap-3 px-6 py-10 text-center text-label text-text-muted">
                <p>{classifiedError?.message}</p>
                <AdminRequestId requestId={classifiedError?.requestId} />
                {classifiedError?.kind === "validation_error" ? (
                  <button type="button" onClick={clearFilters} className="rounded-button border border-border-default px-4 py-2 text-white">Clear filters</button>
                ) : classifiedError?.kind !== "not_found" ? (
                  <button type="button" onClick={() => void query.refetch()} className="rounded-button border border-border-default px-4 py-2 text-white">Try again</button>
                ) : null}
              </div>
            ) : members.length === 0 && !query.isFetching ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">{hasFilters ? "No members match these filters." : "This company has no current members."}</p>
            ) : (
              members.map((member) => (
                <Link
                  key={member.membership_id}
                  href={`/admin/users/${encodeURIComponent(member.user_id)}`}
                  className={cn(memberRowClass, "min-h-[82px] border-b border-border-subtle py-3 text-label text-white last:border-b-0 hover:bg-brand-bg focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-brand")}
                >
                  <span className="truncate font-medium">{member.full_name}</span>
                  <span className="truncate">{member.email}</span>
                  <span>{MEMBER_ROLE_LABELS[member.role]}</span>
                  <span className={cn("w-fit rounded-card px-2.5 py-2 text-input font-medium", statusPillClass(member.membership_status))}>{MEMBERSHIP_STATUS_LABELS[member.membership_status]}</span>
                  <span className={cn("w-fit rounded-card px-2.5 py-2 text-input font-medium", statusPillClass(member.user_status))}>{USER_STATUS_LABELS[member.user_status]}</span>
                  <span>{member.occupies_seat ? "Yes" : "No"}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {query.isFetchNextPageError && members.length > 0 ? (
        <div role="alert" className="mt-4 flex justify-end gap-3 text-label text-text-muted">
          <span>{classifiedError?.message}</span>
          <AdminRequestId requestId={classifiedError?.requestId} />
          <button type="button" onClick={() => void query.fetchNextPage()} className="text-white underline">Retry</button>
        </div>
      ) : null}

      <div className="mt-4">
        <DashboardPagination currentPage={safeCurrentPage} totalPages={totalPages} isPageChangePending={query.isFetchingNextPage} ariaLabel="Company members pagination" onPageChange={handlePageChange} />
      </div>
    </section>
  );
}
