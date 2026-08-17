"use client";

import { SearchIcon } from "@/components/ui/icons";
import {
  DashboardPagination,
  DashboardStatusFilter,
  type DashboardStatusFilterOption,
} from "@/features/dashboard";
import { cn } from "@/lib/cn";
import Image from "next/image";
import { useMemo, useState } from "react";
import type {
  CompanySeat,
  SeatStatus,
} from "../schemas/seatManagementSchemas";
import { SeatStatusToggle } from "./SeatStatusToggle";

const ROWS_PER_PAGE = 6;

type SeatStatusFilterValue = SeatStatus | "all";

type SeatListTableProps = {
  seats: CompanySeat[];
  onEditSeat: (seat: CompanySeat) => void;
  onStatusChange: (seatId: string, status: SeatStatus) => void;
};

const SEAT_STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
] as const satisfies readonly DashboardStatusFilterOption<SeatStatusFilterValue>[];

export function SeatListTable({
  seats,
  onEditSeat,
  onStatusChange,
}: SeatListTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<SeatStatusFilterValue>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredSeats = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase();

    return seats.filter((seat) => {
      const matchesStatus =
        statusFilter === "all" || seat.status === statusFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        seat.userName.toLocaleLowerCase().includes(normalizedSearch) ||
        seat.userEmail.toLocaleLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [searchQuery, seats, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSeats.length / ROWS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleSeats = filteredSeats.slice(
    (safeCurrentPage - 1) * ROWS_PER_PAGE,
    safeCurrentPage * ROWS_PER_PAGE,
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: SeatStatusFilterValue) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return (
    <section aria-labelledby="seats-list-heading" className="mt-12 lg:mt-14">
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
                placeholder="Search subscriptions"
                onChange={(event) => handleSearchChange(event.target.value)}
                className="h-14 w-full rounded-button bg-surface-subtle py-4 pr-5 pl-14 text-body-lg text-white outline-none placeholder:text-white/28 focus:ring-1 focus:ring-border-default"
              />
            </label>

            <DashboardStatusFilter
              value={statusFilter}
              options={SEAT_STATUS_OPTIONS}
              showSelectedLabel
              onChange={handleStatusFilterChange}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] table-fixed">
            <caption className="sr-only">
              Company seats, report quotas, usage, and account status
            </caption>
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[19%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[13%]" />
              <col className="w-[9%]" />
              <col className="w-[13%]" />
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
              {visibleSeats.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="h-[172px] px-6 text-center text-label text-text-muted"
                  >
                    No seats match your search or status filter.
                  </td>
                </tr>
              ) : (
                visibleSeats.map((seat, index) => {
                  const rowNumber =
                    (safeCurrentPage - 1) * ROWS_PER_PAGE + index + 1;
                  const remainingReports =
                    seat.reportQuota - seat.usedReports;

                  return (
                    <tr
                      key={seat.id}
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
                          <span className="truncate">{seat.userName}</span>
                        </span>
                      </td>
                      <td className="truncate px-3 py-4">
                        {seat.userEmail}
                      </td>
                      <td className="px-3 py-4">{seat.reportQuota}</td>
                      <td className="px-3 py-4">{seat.usedReports}</td>
                      <td className="px-3 py-4">{remainingReports}</td>
                      <td className="px-3 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-card px-2 py-2 text-input",
                            seat.status === "active"
                              ? "bg-brand-border text-status-success"
                              : "bg-[rgba(217,34,68,0.12)] text-[#d92244]",
                          )}
                        >
                          {seat.status === "active" ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-4 pr-6 pl-3">
                        <span className="flex items-center gap-4">
                          <button
                            type="button"
                            aria-label={`Edit seat for ${seat.userName}`}
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

                          <SeatStatusToggle
                            userName={seat.userName}
                            status={seat.status}
                            onChange={(status) => {
                              onStatusChange(seat.id, status);
                            }}
                          />
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

      <DashboardPagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        ariaLabel="Seat list pagination"
        className="mt-4 px-2"
      />
    </section>
  );
}
