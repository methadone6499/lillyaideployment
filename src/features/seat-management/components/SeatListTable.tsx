"use client";

import { SearchIcon } from "@/components/ui/icons";
import {
  DashboardPagination,
  DashboardStatusFilter,
  type DashboardStatusFilterOption,
} from "@/features/dashboard";
import { cn } from "@/lib/cn";
import Image from "next/image";
import type {
  MembershipStatus,
  Seat,
  SeatStatus,
} from "../schemas/seatManagementSchemas";
import { SeatStatusToggle } from "./SeatStatusToggle";

type SeatStatusFilterValue = SeatStatus | "all";

type SeatListTableProps = {
  seats: Seat[];
  searchQuery: string;
  statusFilter: SeatStatusFilterValue;
  currentPage: number;
  totalPages: number;
  rowOffset: number;
  isPageChangePending?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  isUpdatingResults?: boolean;
  errorMessage?: string | null;
  nextPageErrorMessage?: string | null;
  pendingMembershipId?: string | null;
  emptyMessage: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: SeatStatusFilterValue) => void;
  onPageChange: (page: number) => void | Promise<void>;
  onRetry?: () => void;
  onRetryNextPage?: () => void;
  onEditSeat: (seat: Seat) => void;
  onStatusChange: (seat: Seat, status: SeatStatus) => void;
  onRemoveSeat: (seat: Seat) => void;
};

const SEAT_STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
] as const satisfies readonly DashboardStatusFilterOption<SeatStatusFilterValue>[];

function getSeatStatusLabel(status: MembershipStatus): string {
  if (status === "active") {
    return "Active";
  }

  if (status === "disabled") {
    return "Disabled";
  }

  return "Removed";
}

function TrashIcon() {
  return (
    <svg
      className="size-[18px]"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
    >
      <path
        d="M3.75 5.25h10.5M7.5 8.25v4.5M10.5 8.25v4.5M4.5 5.25l.75 9a1.5 1.5 0 0 0 1.5 1.5h4.5a1.5 1.5 0 0 0 1.5-1.5l.75-9M6.75 5.25V3.75A1.5 1.5 0 0 1 8.25 2.25h1.5a1.5 1.5 0 0 1 1.5 1.5v1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SeatListTable({
  seats,
  searchQuery,
  statusFilter,
  currentPage,
  totalPages,
  rowOffset,
  isPageChangePending = false,
  isLoading = false,
  isError = false,
  isEmpty = false,
  isUpdatingResults = false,
  errorMessage = null,
  nextPageErrorMessage = null,
  pendingMembershipId = null,
  emptyMessage,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onRetry,
  onRetryNextPage,
  onEditSeat,
  onStatusChange,
  onRemoveSeat,
}: SeatListTableProps) {
  return (
    <section
      aria-labelledby="seats-list-heading"
      aria-busy={isLoading || isUpdatingResults || isPageChangePending}
      className="mt-12 lg:mt-14"
    >
      <div className="overflow-hidden rounded-button border border-border-default bg-surface-default">
        <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <h2
            id="seats-list-heading"
            className="text-card-title font-medium text-white"
          >
            Seats List
          </h2>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:max-w-[720px] lg:justify-end lg:gap-4">
            <label className="relative block min-w-0 flex-1">
              <span className="sr-only">Search seats by user or email</span>
              <span className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-white/72">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={searchQuery}
                maxLength={100}
                placeholder="Search seats"
                onChange={(event) => onSearchChange(event.target.value)}
                className="h-14 w-full rounded-button bg-surface-subtle py-4 pr-5 pl-14 text-body-lg text-white outline-none placeholder:text-white/28 focus:ring-1 focus:ring-border-default"
              />
            </label>

            <DashboardStatusFilter
              value={statusFilter}
              options={SEAT_STATUS_OPTIONS}
              showSelectedLabel
              onChange={onStatusFilterChange}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] table-fixed">
            <caption className="sr-only">
              Company seats, report quotas, usage, and account status
            </caption>
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[18%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead className="h-14 bg-surface-subtle text-left text-label font-medium text-text-step">
              <tr>
                <th scope="col" className="py-4 pr-3 pl-6">
                  User Name
                </th>
                <th scope="col" className="px-3 py-4">
                  User Email
                </th>
                <th scope="col" className="px-3 py-4">
                  Report Quota
                </th>
                <th scope="col" className="px-3 py-4">
                  Used Reports
                </th>
                <th scope="col" className="px-3 py-4">
                  Remaining Reports
                </th>
                <th scope="col" className="px-3 py-4">
                  Status
                </th>
                <th scope="col" className="py-4 pr-6 pl-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="h-[172px] px-6 text-center text-label text-text-muted"
                  >
                    Loading seats…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="h-[172px] px-6">
                    <div
                      className="flex flex-col items-center gap-4 text-center text-label text-text-muted"
                      role="alert"
                    >
                      <p>{errorMessage ?? "Unable to load seats."}</p>
                      {onRetry ? (
                        <button
                          type="button"
                          className="rounded-button border border-border-default px-4 py-2 font-medium text-white transition-colors hover:bg-surface-elevated"
                          onClick={onRetry}
                        >
                          Try again
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : isEmpty ? (
                <tr>
                  <td
                    colSpan={7}
                    className="h-[172px] px-6 text-center text-label text-text-muted"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                seats.map((seat, index) => {
                  const rowNumber = rowOffset + index + 1;
                  const isRowPending =
                    pendingMembershipId === seat.membership_id;
                  const canToggleStatus =
                    seat.can_manage_status && seat.status !== "removed";
                  const canRemove =
                    seat.can_manage && seat.status !== "removed";

                  return (
                    <tr
                      key={seat.membership_id}
                      className={cn(
                        "h-[86px] border-b border-border-subtle text-label font-medium text-white transition-colors last:border-b-0 hover:bg-brand-bg focus-within:bg-brand-bg",
                        rowNumber === 1 && "bg-brand-bg",
                      )}
                    >
                      <td className="py-4 pr-3 pl-6">
                        <span className="flex min-w-0 items-center gap-4">
                          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-toggle-knob bg-surface-elevated text-input text-white">
                            {rowNumber}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate">{seat.full_name}</span>
                            {seat.role === "company_admin" ? (
                              <span className="text-helper font-normal text-text-muted">
                                Admin
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </td>
                      <td className="truncate px-3 py-4">{seat.email}</td>
                      <td className="px-3 py-4">{seat.report_quota_total}</td>
                      <td className="px-3 py-4">{seat.report_quota_used}</td>
                      <td className="px-3 py-4">
                        {seat.report_quota_remaining}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-card px-2 py-2 text-input",
                            seat.status === "active"
                              ? "bg-brand-border text-status-success"
                              : seat.status === "disabled"
                                ? "bg-[rgba(217,34,68,0.12)] text-[#d92244]"
                                : "bg-white/10 text-text-muted",
                          )}
                        >
                          {getSeatStatusLabel(seat.status)}
                        </span>
                      </td>
                      <td className="py-4 pr-6 pl-3">
                        <span className="flex items-center gap-3">
                          <button
                            type="button"
                            aria-label={`View seat for ${seat.full_name}`}
                            onClick={() => onEditSeat(seat)}
                            className="inline-flex size-10 shrink-0 items-center justify-center rounded-card bg-surface-elevated transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                          >
                            <Image
                              src="/company-admin/seats/edit.svg"
                              alt=""
                              width={18}
                              height={18}
                              aria-hidden
                            />
                          </button>

                          {canRemove ? (
                            <button
                              type="button"
                              aria-label={`Remove seat for ${seat.full_name}`}
                              disabled={isRowPending}
                              onClick={() => onRemoveSeat(seat)}
                              className="inline-flex size-10 shrink-0 items-center justify-center rounded-card bg-surface-elevated text-[#d92244] transition-colors hover:bg-[rgba(217,34,68,0.16)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d92244] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <TrashIcon />
                            </button>
                          ) : null}

                          {canToggleStatus ? (
                            <SeatStatusToggle
                              userName={seat.full_name}
                              status={
                                seat.status === "disabled"
                                  ? "disabled"
                                  : "active"
                              }
                              disabled={isRowPending}
                              onChange={(nextStatus) => {
                                onStatusChange(seat, nextStatus);
                              }}
                            />
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {isUpdatingResults ? "Updating seat results." : ""}
      </p>

      {nextPageErrorMessage ? (
        <div
          className="mt-4 flex items-center justify-end gap-3 px-2 text-label text-text-muted"
          role="alert"
        >
          <span>{nextPageErrorMessage}</span>
          {onRetryNextPage ? (
            <button
              type="button"
              className="rounded-button border border-border-default px-3 py-1.5 font-medium text-white transition-colors hover:bg-surface-elevated"
              disabled={isPageChangePending}
              onClick={onRetryNextPage}
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      <DashboardPagination
        currentPage={currentPage}
        totalPages={totalPages}
        isPageChangePending={isPageChangePending}
        onPageChange={onPageChange}
        ariaLabel="Seat list pagination"
        className="mt-4 px-2"
      />
    </section>
  );
}
