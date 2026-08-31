"use client";

import { SearchIcon } from "@/components/ui/icons";
import {
  hasPermission,
  useAuthUser,
  userStatusSchema,
  type EffectiveRole,
  type UserStatus,
} from "@/features/auth";
import {
  DashboardPagination,
  DashboardStatusFilter,
  type DashboardStatusFilterOption,
} from "@/features/dashboard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/cn";
import { ApiRequestError } from "@/services/ApiRequestError";
import { useMemo, useState } from "react";
import { useAdminUsers } from "../hooks/useAdminUsers";
import type { AdminUserResponse } from "../schemas/adminUserSchemas";

const ROWS_PER_PAGE = 6;
const SEARCH_DEBOUNCE_MS = 300;
const MAX_SEARCH_LENGTH = 100;

type AdminUserStatusFilterValue = UserStatus | "all";

const ADMIN_USER_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending_verification", label: "Pending Verification" },
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
] as const satisfies readonly DashboardStatusFilterOption<AdminUserStatusFilterValue>[];

const EFFECTIVE_ROLE_LABELS: Record<EffectiveRole, string> = {
  standard_user: "Standard User",
  company_admin: "Company Admin",
  company_seat_user: "Seat User",
  super_admin: "Super Admin",
};

const USER_STATUS_PILL_CONFIG: Record<
  UserStatus,
  { label: string; className: string }
> = {
  pending_verification: {
    label: "Pending Verification",
    className: "bg-[rgba(0,101,248,0.12)] text-[#0065f8]",
  },
  active: {
    label: "Active",
    className: "bg-[rgba(16,185,129,0.12)] text-status-success",
  },
  disabled: {
    label: "Disabled",
    className: "bg-[rgba(217,34,68,0.12)] text-[#d92244]",
  },
};

const adminUserRowClass =
  "grid min-w-[960px] grid-cols-[minmax(200px,1.4fr)_minmax(220px,1.2fr)_minmax(140px,1fr)_minmax(160px,1.2fr)_minmax(148px,180px)] items-center gap-x-6 px-6";

function getListErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 403) {
      return "You do not have permission to view users.";
    }

    return error.message || "Unable to load users. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load users. Please try again.";
}

function isInvalidCursorError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 400 &&
    error.code === "invalid_cursor"
  );
}

function getOrganizationLabel(user: AdminUserResponse): string {
  return user.access.company_name || user.institution_name || "Personal";
}

export function AdminUsersTable() {
  const { authMe } = useAuthUser();
  const canReadAdminUsers = hasPermission(authMe, "admin:users_read");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<AdminUserStatusFilterValue>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  const search =
    debouncedSearch.trim().length > 0
      ? debouncedSearch.trim().slice(0, MAX_SEARCH_LENGTH)
      : undefined;
  const status = userStatusSchema.safeParse(statusFilter);

  const usersQuery = useAdminUsers({
    limit: ROWS_PER_PAGE,
    search,
    status: status.success ? status.data : undefined,
    enabled: canReadAdminUsers,
  });
  const hasActiveFilters = Boolean(search || status.success);

  const loadedPageCount = usersQuery.data?.pages.length ?? 0;
  const safeCurrentPage = Math.min(currentPage, Math.max(loadedPageCount, 1));
  const users = useMemo(
    () => usersQuery.data?.pages[safeCurrentPage - 1]?.items ?? [],
    [usersQuery.data, safeCurrentPage],
  );
  const totalPages = Math.max(
    1,
    loadedPageCount + (usersQuery.hasNextPage ? 1 : 0),
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value.slice(0, MAX_SEARCH_LENGTH));
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: AdminUserStatusFilterValue) => {
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

    if (page === loadedPageCount + 1 && usersQuery.hasNextPage) {
      const result = await usersQuery.fetchNextPage();

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
    (canReadAdminUsers &&
      usersQuery.isLoading &&
      users.length === 0 &&
      !usersQuery.isError);
  const showPermissionDenied = Boolean(authMe) && !canReadAdminUsers;
  const showError =
    canReadAdminUsers &&
    usersQuery.isError &&
    users.length === 0 &&
    !isInvalidCursorError(usersQuery.error);
  const showEmpty =
    canReadAdminUsers &&
    !showInitialLoading &&
    !showError &&
    users.length === 0 &&
    !usersQuery.isFetching;
  const showNextPageError =
    users.length > 0 &&
    usersQuery.isFetchNextPageError &&
    !isInvalidCursorError(usersQuery.error);
  const isUpdatingResults =
    users.length > 0 &&
    usersQuery.isFetching &&
    !usersQuery.isFetchingNextPage;

  return (
    <section
      aria-label="Users"
      aria-busy={usersQuery.isFetching}
      className="mt-12 lg:mt-14"
    >
      <div className="overflow-hidden rounded-button border border-border-default bg-surface-default">
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-card-title font-medium text-white">Users</h2>

          <div className="flex w-full flex-col gap-3 sm:max-w-[664px] sm:flex-1 sm:flex-row sm:items-center sm:gap-4">
            <label className="relative block w-full sm:flex-1">
              <span className="sr-only">Search name or email</span>
              <span className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-white/28">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={searchQuery}
                maxLength={MAX_SEARCH_LENGTH}
                placeholder="Search name or email"
                onChange={(event) => handleSearchChange(event.target.value)}
                className="h-14 w-full rounded-button bg-surface-subtle py-4 pr-5 pl-14 text-body-lg text-white outline-none placeholder:text-white/28 focus:ring-1 focus:ring-border-default"
              />
            </label>

            <DashboardStatusFilter
              value={statusFilter}
              options={ADMIN_USER_STATUS_FILTER_OPTIONS}
              showSelectedLabel
              onChange={handleStatusFilterChange}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <div
            className={cn(
              adminUserRowClass,
              "h-14 bg-surface-subtle text-label font-medium text-text-step",
            )}
          >
            <span>Name</span>
            <span>Email</span>
            <span>Access</span>
            <span>Company</span>
            <span>Status</span>
          </div>

          <div className="flex flex-col">
            {showInitialLoading ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">
                Loading users…
              </p>
            ) : showPermissionDenied ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">
                You do not have permission to view users.
              </p>
            ) : showError ? (
              <div
                className="flex flex-col items-center gap-4 px-6 py-10 text-center text-label text-text-muted"
                role="alert"
              >
                <p>{getListErrorMessage(usersQuery.error)}</p>
                <button
                  type="button"
                  className="rounded-button border border-border-default px-4 py-2 font-medium text-white transition-colors hover:bg-surface-elevated"
                  onClick={() => {
                    void usersQuery.refetch();
                  }}
                >
                  Try again
                </button>
              </div>
            ) : showEmpty ? (
              <p className="px-6 py-10 text-center text-label text-text-muted">
                {hasActiveFilters
                  ? "No users match your search or status filter."
                  : "No registered users yet."}
              </p>
            ) : (
              users.map((user, index) => {
                const statusPill = USER_STATUS_PILL_CONFIG[user.status];

                return (
                  <div
                    key={user.id}
                    className={cn(
                      adminUserRowClass,
                      "min-h-[86px] border-b border-border-subtle py-3 text-left last:border-b-0 hover:bg-brand-bg",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-toggle-knob bg-surface-elevated text-input font-medium text-white">
                        {(safeCurrentPage - 1) * ROWS_PER_PAGE + index + 1}
                      </span>
                      <span className="truncate text-label font-medium text-white">
                        {user.full_name}
                      </span>
                    </span>

                    <span className="min-w-0 truncate text-label font-medium text-white">
                      {user.email}
                    </span>

                    <span className="min-w-0 truncate text-label font-medium text-white">
                      {EFFECTIVE_ROLE_LABELS[user.access.effective_role]}
                    </span>

                    <span className="min-w-0 truncate text-label font-medium text-white">
                      {getOrganizationLabel(user)}
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
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {isUpdatingResults ? "Updating user results." : ""}
      </p>

      {showNextPageError ? (
        <div
          className="mt-4 flex items-center justify-end gap-3 px-2 text-label text-text-muted"
          role="alert"
        >
          <span>{getListErrorMessage(usersQuery.error)}</span>
          <button
            type="button"
            className="rounded-button border border-border-default px-3 py-1.5 font-medium text-white transition-colors hover:bg-surface-elevated"
            disabled={usersQuery.isFetchingNextPage}
            onClick={() => {
              void usersQuery.fetchNextPage();
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
            isPageChangePending={usersQuery.isFetchingNextPage}
            ariaLabel="Users pagination"
            onPageChange={handlePageChange}
          />
        </div>
      ) : null}
    </section>
  );
}
