"use client";
import { CompanyTopUpAllocator } from "./CompanyTopUpAllocator";

import { Button } from "@/components/ui";
import { PlusIcon } from "@/components/ui/icons";
import {
  hasPermission,
  useAuthUser,
} from "@/features/auth";
import {
  canAllocateTopUps,
  emitTopUpEvent,
  formatLocalDate,
  getMaximumTopUpTarget,
  getTopUpError,
  hasScheduledEnterpriseDowngrade,
  isOperationLockError,
  OperationLockBanner,
  useOperationLock,
  useSetMemberTopUpMutation,
  useSubscriptionOverview,
  useTopUpOverview,
} from "@/features/billing";
import {
  classifyInvitationError,
  useCompanyInvitations,
  useCreateInvitationMutation,
  useResendInvitationMutation,
  useRevokeInvitationMutation,
  type Invitation,
} from "@/features/company-invitations";
import { CompanyBrandingCard } from "@/features/company-branding";
import {
  classifyQuotaMutationError,
  classifyQuotaQueryError,
  QuotaRedistributionPrompt,
  useCompanyQuota,
  useSetMemberQuotaMutation,
} from "@/features/company-quota";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ApiRequestError } from "@/services/ApiRequestError";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCompanySeats } from "../hooks/useCompanySeats";
import {
  useDisableSeatMutation,
  useEnableSeatMutation,
  useRemoveSeatMutation,
} from "../hooks/useSeatLifecycleMutations";
import type {
  AddSeatFormValues,
  EditSeatFormValues,
  Seat,
  SeatStatus,
} from "../schemas/seatManagementSchemas";
import { classifySeatMutationError } from "../utils/classifySeatMutationError";
import { AddSeatDialog } from "./AddSeatDialog";
import { CompanyQuotaPoolCards } from "./CompanyQuotaPoolCards";
import { EditSeatDialog, type SeatEditFailure } from "./EditSeatDialog";
import { PendingInvitationsTable } from "./PendingInvitationsTable";
import { RemoveSeatDialog } from "./RemoveSeatDialog";
import { RevokeInvitationDialog } from "./RevokeInvitationDialog";
import { SeatListTable } from "./SeatListTable";
import { SeatSummaryCards } from "./SeatSummaryCards";

const ROWS_PER_PAGE = 6;
const SEARCH_DEBOUNCE_MS = 300;

type SeatStatusFilterValue = SeatStatus | "all";

function getListErrorMessage(
  error: unknown,
  resource: "seats" | "invitations",
): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 403) {
      return resource === "seats"
        ? "You do not have permission to view seats."
        : "You do not have permission to view invitations.";
    }

    return (
      error.message ||
      (resource === "seats"
        ? "Unable to load seats. Please try again."
        : "Unable to load invitations. Please try again.")
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return resource === "seats"
    ? "Unable to load seats. Please try again."
    : "Unable to load invitations. Please try again.";
}

function isInvalidCursorError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 400 &&
    error.code === "invalid_cursor"
  );
}

export function SeatManagementContent() {
  const { authMe } = useAuthUser();
  const isCompanyAdmin = authMe?.active_context.type === "company" &&
    authMe.active_context.role === "company_admin";
  const canManageMembers = hasPermission(authMe, "company:members_manage");
  const canReadCompanyQuota = hasPermission(authMe, "company:quota_read");
  const operationLock = useOperationLock();
  const seatChangesLocked = operationLock.isBlocked("seat_changes");
  const quotaChangesLocked = operationLock.isBlocked("quota_changes");
  const invitationCreateLocked = operationLock.isBlocked("invitation_create");
  const invitationResendLocked = operationLock.isBlocked("invitation_resend");
  const scheduledDowngrade =
    operationLock.overview &&
    hasScheduledEnterpriseDowngrade(operationLock.overview)
      ? operationLock.overview.plan_change
      : null;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<SeatStatusFilterValue>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [invitationPage, setInvitationPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [isSavingSeat, setIsSavingSeat] = useState(false);
  const editSaveInFlight = useRef(false);
  const [removingSeat, setRemovingSeat] = useState<Seat | null>(null);
  const [revokingInvitation, setRevokingInvitation] =
    useState<Invitation | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [resendCooldownUntilMs, setResendCooldownUntilMs] = useState<
    Record<string, number>
  >({});
  const [nowMs, setNowMs] = useState(() => Date.now());
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  const search =
    debouncedSearch.trim().length > 0 ? debouncedSearch.trim() : undefined;
  const status = statusFilter === "all" ? undefined : statusFilter;

  const seatsQuery = useCompanySeats({
    limit: ROWS_PER_PAGE,
    search,
    status,
  });
  const invitationsQuery = useCompanyInvitations({
    limit: ROWS_PER_PAGE,
    status: "pending",
  });
  const companyQuotaQuery = useCompanyQuota({
    enabled: canReadCompanyQuota,
  });
  const disableMutation = useDisableSeatMutation();
  const enableMutation = useEnableSeatMutation();
  const removeMutation = useRemoveSeatMutation();
  const setMemberQuotaMutation = useSetMemberQuotaMutation();
  const topUpOverview = useTopUpOverview(isCompanyAdmin);
  const subscriptionQuery = useSubscriptionOverview({ enabled: isCompanyAdmin });
  const setMemberTopUpMutation = useSetMemberTopUpMutation();
  const canEditAdditionalReports = isCompanyAdmin && !topUpOverview.isError &&
    !subscriptionQuery.isError && topUpOverview.data !== undefined &&
    canAllocateTopUps(topUpOverview.data, subscriptionQuery.data);
  const createInvitationMutation = useCreateInvitationMutation();
  const resendInvitationMutation = useResendInvitationMutation();
  const revokeInvitationMutation = useRevokeInvitationMutation();
  const resendCooldownSecondsById = useMemo(() => {
    const remaining: Record<string, number> = {};

    for (const [invitationId, untilMs] of Object.entries(
      resendCooldownUntilMs,
    )) {
      const seconds = Math.max(0, Math.ceil((untilMs - nowMs) / 1000));

      if (seconds > 0) {
        remaining[invitationId] = seconds;
      }
    }

    return remaining;
  }, [nowMs, resendCooldownUntilMs]);
  const hasActiveResendCooldown =
    Object.keys(resendCooldownSecondsById).length > 0;

  useEffect(() => {
    if (!hasActiveResendCooldown) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasActiveResendCooldown]);

  const loadedPageCount = seatsQuery.data?.pages.length ?? 0;
  const safeCurrentPage = Math.min(currentPage, Math.max(loadedPageCount, 1));
  const seats = seatsQuery.data?.pages[safeCurrentPage - 1]?.items ?? [];
  const summary =
    seatsQuery.data?.pages[seatsQuery.data.pages.length - 1]?.summary ??
    seatsQuery.data?.pages[0]?.summary;
  const totalPages = Math.max(
    1,
    loadedPageCount + (seatsQuery.hasNextPage ? 1 : 0),
  );
  const hasActiveFilters = Boolean(search || status);

  const loadedInvitationPageCount = invitationsQuery.data?.pages.length ?? 0;
  const safeInvitationPage = Math.min(
    invitationPage,
    Math.max(loadedInvitationPageCount, 1),
  );
  const invitations =
    invitationsQuery.data?.pages[safeInvitationPage - 1]?.items ?? [];
  const invitationTotalPages = Math.max(
    1,
    loadedInvitationPageCount + (invitationsQuery.hasNextPage ? 1 : 0),
  );

  const pendingMembershipId =
    (disableMutation.isPending
      ? disableMutation.variables?.membershipId
      : undefined) ??
    (enableMutation.isPending
      ? enableMutation.variables?.membershipId
      : undefined) ??
    (removeMutation.isPending
      ? removeMutation.variables?.membershipId
      : undefined) ??
    (setMemberQuotaMutation.isPending
      ? setMemberQuotaMutation.variables?.membershipId
      : undefined) ??
    (setMemberTopUpMutation.isPending
      ? setMemberTopUpMutation.variables?.membershipId
      : undefined) ??
    null;
  const pendingInvitationId =
    (resendInvitationMutation.isPending
      ? resendInvitationMutation.variables?.invitationId
      : undefined) ??
    (revokeInvitationMutation.isPending
      ? revokeInvitationMutation.variables?.invitationId
      : undefined) ??
    null;
  const showInitialLoading =
    seatsQuery.isLoading && seats.length === 0 && !seatsQuery.isError;
  const showError =
    seatsQuery.isError &&
    seats.length === 0 &&
    !isInvalidCursorError(seatsQuery.error);
  const showEmpty =
    !showInitialLoading &&
    !showError &&
    seats.length === 0 &&
    !seatsQuery.isFetching;
  const showNextPageError =
    seats.length > 0 &&
    seatsQuery.isFetchNextPageError &&
    !isInvalidCursorError(seatsQuery.error);
  const isUpdatingResults =
    seats.length > 0 &&
    seatsQuery.isFetching &&
    !seatsQuery.isFetchingNextPage;
  const showInvitationInitialLoading =
    invitationsQuery.isLoading &&
    invitations.length === 0 &&
    !invitationsQuery.isError;
  const showInvitationError =
    invitationsQuery.isError &&
    invitations.length === 0 &&
    !isInvalidCursorError(invitationsQuery.error);
  const showInvitationEmpty =
    !showInvitationInitialLoading &&
    !showInvitationError &&
    invitations.length === 0 &&
    !invitationsQuery.isFetching;
  const showInvitationNextPageError =
    invitations.length > 0 &&
    invitationsQuery.isFetchNextPageError &&
    !isInvalidCursorError(invitationsQuery.error);
  const isUpdatingInvitations =
    invitations.length > 0 &&
    invitationsQuery.isFetching &&
    !invitationsQuery.isFetchingNextPage;
  const isEditPending =
    Boolean(editingSeat) && (isSavingSeat || pendingMembershipId === editingSeat?.membership_id);
  const isRemovePending =
    Boolean(removingSeat) &&
    pendingMembershipId === removingSeat?.membership_id;
  const isRevokePending =
    Boolean(revokingInvitation) &&
    pendingInvitationId === revokingInvitation?.id;
  const hasAvailableSeats =
    summary == null || summary.available_seats > 0;
  const createSeatDisabled =
    !canManageMembers || !hasAvailableSeats || invitationCreateLocked;
  const createSeatTitle = !canManageMembers
    ? "You do not have permission to invite users."
    : invitationCreateLocked
      ? "Invitations are paused while a Custom plan payment is in progress."
      : summary != null && summary.available_seats <= 0
        ? "No available seats. Revoke a pending invitation or remove a seat."
        : "Invite a user by email";

  const refreshLockAfterError = (error: unknown) => {
    if (isOperationLockError(error)) {
      void operationLock.refetch();
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: SeatStatusFilterValue) => {
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

    if (page === loadedPageCount + 1 && seatsQuery.hasNextPage) {
      const result = await seatsQuery.fetchNextPage();

      if (result.isError) {
        if (isInvalidCursorError(result.error)) {
          setCurrentPage(1);
        }
        return;
      }

      setCurrentPage(page);
    }
  };

  const handleInvitationPageChange = async (page: number) => {
    if (page < 1 || page === safeInvitationPage) {
      return;
    }

    if (page <= loadedInvitationPageCount) {
      setInvitationPage(page);
      return;
    }

    if (page === loadedInvitationPageCount + 1 && invitationsQuery.hasNextPage) {
      const result = await invitationsQuery.fetchNextPage();

      if (result.isError) {
        if (isInvalidCursorError(result.error)) {
          setInvitationPage(1);
        }
        return;
      }

      setInvitationPage(page);
    }
  };

  const handleStatusChange = async (
    seat: Seat,
    nextStatus: SeatStatus,
  ): Promise<string | null> => {
    if (nextStatus === seat.status || seat.status === "removed") {
      return null;
    }

    setActionError(null);

    try {
      const updatedSeat = nextStatus === "disabled"
        ? await disableMutation.mutateAsync({
          membershipId: seat.membership_id,
          targetUserId: seat.user_id,
        })
        : await enableMutation.mutateAsync({
          membershipId: seat.membership_id,
          targetUserId: seat.user_id,
        });
      setEditingSeat((current) => current?.membership_id === seat.membership_id
        ? { ...current, ...updatedSeat } : current);

      return null;
    } catch (error) {
      refreshLockAfterError(error);
      const message = classifySeatMutationError(error);
      setActionError(message);
      return message;
    }
  };

  const handleEditConfirm = async (
    seat: Seat,
    values: EditSeatFormValues,
  ): Promise<SeatEditFailure | null> => {
    const savedChanges: string[] = [];
    const fail = (field: SeatEditFailure["field"], reason: string): SeatEditFailure => {
      const message = savedChanges.length ? `Saved ${savedChanges.join(" and ")}. ${reason}` : reason;
      setActionError(message);
      return { field, message };
    };
    if (editSaveInFlight.current) return { field: "status", message: "Seat changes are still being saved." };
    const quotaChanged = values.quota_total !== seat.report_quota_total;
    const statusChanged = values.status !== seat.status;
    const currentAdditional = topUpOverview.data?.allocations.find(
      (allocation) => allocation.membership_id === seat.membership_id,
    )?.remaining_balance ?? 0;
    const additionalTarget = values.additional_report_balance;
    const additionalChanged = additionalTarget !== undefined && additionalTarget !== currentAdditional;

    if (quotaChanged && (!seat.can_manage_quota || quotaChangesLocked || seat.status === "removed")) {
      return fail("quota_total", "Monthly quota changes are currently unavailable for this seat.");
    }
    if (statusChanged && (!seat.can_manage_status || seatChangesLocked || seat.status === "removed")) {
      return fail("status", "Status changes are currently unavailable for this seat.");
    }
    if (additionalChanged) {
      if (!canEditAdditionalReports || !topUpOverview.data || seat.status === "removed") {
        return fail("additional_report_balance", "Additional report changes are currently unavailable. Reload balances before trying again.");
      }
      const maximum = getMaximumTopUpTarget(currentAdditional, topUpOverview.data.pool_balance, values.status === "active");
      if (!Number.isSafeInteger(additionalTarget) || additionalTarget < 0 || additionalTarget > maximum) {
        return fail("additional_report_balance", `Enter a remaining balance from 0 to ${maximum}.`);
      }
    }

    if (!quotaChanged && !statusChanged && !additionalChanged) {
      setEditingSeat(null);
      return null;
    }

    editSaveInFlight.current = true;
    setIsSavingSeat(true);
    setActionError(null);
    try {
      // Re-enable before assigning more reports. Additional balances are saved
      // last, so a later status failure cannot repeat a successful allocation.
      if (statusChanged && values.status === "active") {
        const message = await handleStatusChange(seat, values.status);
        if (message) return fail("status", message);
        savedChanges.push("seat status");
      }

      if (quotaChanged) {
        try {
          const allocation = await setMemberQuotaMutation.mutateAsync({
            membershipId: seat.membership_id,
            quotaTotal: values.quota_total,
          });

          setEditingSeat((current) =>
            current?.membership_id === seat.membership_id
              ? {
                  ...current,
                  report_quota_total: allocation.quota_total,
                  report_quota_used: allocation.quota_used,
                  report_quota_remaining: allocation.quota_remaining,
                }
              : current,
          );
          savedChanges.push("monthly quota");
        } catch (error) {
          refreshLockAfterError(error);
          return fail("quota_total", classifyQuotaMutationError(error));
        }
      }

      if (statusChanged && values.status === "disabled") {
        const message = await handleStatusChange(seat, values.status);
        if (message) return fail("status", message);
        savedChanges.push("seat status");
      }

      if (additionalChanged && additionalTarget !== undefined) {
        try {
          await setMemberTopUpMutation.mutateAsync({
            membershipId: seat.membership_id,
            balance: additionalTarget,
          });
          emitTopUpEvent({ name: "top_up_allocation_updated", membershipId: seat.membership_id,
            direction: additionalTarget > currentAdditional ? "assign" : "reclaim" });
        } catch (error) {
          refreshLockAfterError(error);
          const info = getTopUpError(error);
          return fail("additional_report_balance", info.requestId
            ? `${info.message} Reference: ${info.requestId}.` : info.message);
        }
      }

      setEditingSeat(null);
      return null;
    } finally {
      editSaveInFlight.current = false;
      setIsSavingSeat(false);
    }
  };

  const handleRemoveConfirm = async (seat: Seat) => {
    setActionError(null);

    try {
      await removeMutation.mutateAsync({
        membershipId: seat.membership_id,
        targetUserId: seat.user_id,
      });
      setRemovingSeat(null);
      setEditingSeat((current) =>
        current?.membership_id === seat.membership_id ? null : current,
      );
    } catch (error) {
      refreshLockAfterError(error);
      setActionError(classifySeatMutationError(error));
    }
  };

  const handleCreateInvitation = async (values: AddSeatFormValues) => {
    setActionError(null);

    try {
      await createInvitationMutation.mutateAsync({
        email: values.userEmail,
      });
      setInvitationPage(1);
      return null;
    } catch (error) {
      refreshLockAfterError(error);
      return classifyInvitationError(error);
    }
  };

  const handleResendInvitation = async (invitation: Invitation) => {
    setActionError(null);

    try {
      await resendInvitationMutation.mutateAsync({
        invitationId: invitation.id,
      });
      setResendCooldownUntilMs((current) => {
        if (!(invitation.id in current)) {
          return current;
        }

        const next = { ...current };
        delete next[invitation.id];
        return next;
      });
    } catch (error) {
      refreshLockAfterError(error);
      const classified = classifyInvitationError(error);
      setActionError(classified.message);
      const retryAfterSeconds = classified.retryAfterSeconds;

      if (retryAfterSeconds != null) {
        setResendCooldownUntilMs((current) => ({
          ...current,
          [invitation.id]: Date.now() + retryAfterSeconds * 1000,
        }));
        setNowMs(Date.now());
      }
    }
  };

  const handleRevokeConfirm = async (invitation: Invitation) => {
    setActionError(null);

    try {
      await revokeInvitationMutation.mutateAsync({
        invitationId: invitation.id,
      });
      setRevokingInvitation(null);
    } catch (error) {
      setActionError(classifyInvitationError(error).message);
    }
  };

  const showTopActionError =
    Boolean(actionError) &&
    !editingSeat &&
    !removingSeat &&
    !revokingInvitation &&
    !isAddOpen;

  return (
    <>
      <div className="mt-11 flex flex-col gap-6 lg:mt-12 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-page-title leading-tight font-medium text-white">
            Seat Management
          </h1>
          <p className="mt-4 max-w-[760px] text-label leading-relaxed text-text-body sm:mt-6 sm:text-body-lg">
            Manage company members, seat capacity, and report allocation.
          </p>
        </div>

        {canManageMembers ? (
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
            <Button
              leadingIcon={<PlusIcon />}
              disabled={createSeatDisabled || createInvitationMutation.isPending}
              title={createSeatTitle}
              className="w-full sm:w-auto"
              onClick={() => {
                setActionError(null);
                setIsAddOpen(true);
              }}
            >
              Invite User
            </Button>
          </div>
        ) : null}
      </div>

      <OperationLockBanner className="mt-6" />
      <QuotaRedistributionPrompt className="mt-6" />

      {scheduledDowngrade ? (
        <p className="mt-6 text-label text-text-body" role="status">
          Your company switches to Enterprise
          {scheduledDowngrade.effective_at
            ? ` on ${formatLocalDate(scheduledDowngrade.effective_at)}`
            : " at the next renewal"}
          . Until then, new invitations cannot take occupied and pending seats
          above 10, and quota allocations cannot exceed 100 reports.
        </p>
      ) : null}

      {showTopActionError ? (
        <p role="alert" className="mt-6 text-label text-status-running">
          {actionError}
        </p>
      ) : null}

      <SeatSummaryCards
        occupiedSeats={summary?.occupied_seats ?? null}
        totalSeats={summary?.total_seats ?? null}
        availableSeats={summary?.available_seats ?? null}
        activeSeats={summary?.active_seats ?? null}
        disabledSeats={summary?.disabled_seats ?? null}
        pendingInvitationSeats={summary?.pending_invitation_seats ?? null}
      />

      {canReadCompanyQuota ? (
        <CompanyQuotaPoolCards
          allocated={companyQuotaQuery.data?.quota_allocated ?? null}
          unallocated={companyQuotaQuery.data?.quota_unallocated ?? null}
          remaining={companyQuotaQuery.data?.quota_remaining ?? null}
          used={companyQuotaQuery.data?.quota_used ?? null}
          total={companyQuotaQuery.data?.quota_total ?? null}
          isLoading={companyQuotaQuery.isLoading}
          isError={companyQuotaQuery.isError}
          errorMessage={
            companyQuotaQuery.isError
              ? classifyQuotaQueryError(companyQuotaQuery.error, "company")
              : null
          }
          onRetry={() => {
            void companyQuotaQuery.refetch();
          }}
        />
      ) : null}

      <CompanyBrandingCard />

      <SeatListTable
        seats={seats}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        rowOffset={(safeCurrentPage - 1) * ROWS_PER_PAGE}
        isPageChangePending={seatsQuery.isFetchingNextPage}
        isLoading={showInitialLoading}
        isError={showError}
        isEmpty={showEmpty}
        isUpdatingResults={isUpdatingResults}
        errorMessage={
          showError ? getListErrorMessage(seatsQuery.error, "seats") : null
        }
        nextPageErrorMessage={
          showNextPageError
            ? getListErrorMessage(seatsQuery.error, "seats")
            : null
        }
        pendingMembershipId={pendingMembershipId}
        seatChangesLocked={seatChangesLocked}
        emptyMessage={
          hasActiveFilters
            ? "No seats match your search or status filter."
            : "No seats have been assigned yet."
        }
        onSearchChange={handleSearchChange}
        onStatusFilterChange={handleStatusFilterChange}
        onPageChange={handlePageChange}
        onRetry={() => {
          void seatsQuery.refetch();
        }}
        onRetryNextPage={() => {
          void seatsQuery.fetchNextPage();
        }}
        onEditSeat={(seat) => {
          setActionError(null);
          setEditingSeat(seat);
        }}
        onStatusChange={(seat, nextStatus) => {
          void handleStatusChange(seat, nextStatus);
        }}
        onRemoveSeat={(seat) => {
          setActionError(null);
          setRemovingSeat(seat);
        }}
      />

      <CompanyTopUpAllocator />

      <PendingInvitationsTable
        invitations={invitations}
        currentPage={safeInvitationPage}
        totalPages={invitationTotalPages}
        canManage={canManageMembers}
        isPageChangePending={invitationsQuery.isFetchingNextPage}
        isLoading={showInvitationInitialLoading}
        isError={showInvitationError}
        isEmpty={showInvitationEmpty}
        isUpdatingResults={isUpdatingInvitations}
        errorMessage={
          showInvitationError
            ? getListErrorMessage(invitationsQuery.error, "invitations")
            : null
        }
        nextPageErrorMessage={
          showInvitationNextPageError
            ? getListErrorMessage(invitationsQuery.error, "invitations")
            : null
        }
        pendingInvitationId={pendingInvitationId}
        resendCooldownSecondsById={resendCooldownSecondsById}
        resendLocked={invitationResendLocked}
        onPageChange={handleInvitationPageChange}
        onRetry={() => {
          void invitationsQuery.refetch();
        }}
        onRetryNextPage={() => {
          void invitationsQuery.fetchNextPage();
        }}
        onResend={(invitation) => {
          void handleResendInvitation(invitation);
        }}
        onRevoke={(invitation) => {
          setActionError(null);
          setRevokingInvitation(invitation);
        }}
      />

      {isAddOpen ? (
        <AddSeatDialog
          open
          isPending={createInvitationMutation.isPending}
          onClose={() => setIsAddOpen(false)}
          onConfirm={handleCreateInvitation}
        />
      ) : null}

      {editingSeat ? (
        <EditSeatDialog
          key={editingSeat.membership_id}
          open={!removingSeat}
          seat={editingSeat}
          isPending={isEditPending}
          quotaUnallocated={
            companyQuotaQuery.data?.quota_unallocated ?? null
          }
          seatChangesLocked={seatChangesLocked}
          quotaChangesLocked={quotaChangesLocked}
          additionalReports={isCompanyAdmin && topUpOverview.data?.can_manage_allocations !== false ? {
            balance: topUpOverview.data ? topUpOverview.data.allocations.find(
              (allocation) => allocation.membership_id === editingSeat.membership_id,
            )?.remaining_balance ?? 0 : null,
            pool: topUpOverview.data?.pool_balance ?? null,
            canEdit: canEditAdditionalReports,
            loading: topUpOverview.isPending || subscriptionQuery.isPending,
            error: topUpOverview.error ?? subscriptionQuery.error,
            onRetry: () => { void topUpOverview.refetch(); void subscriptionQuery.refetch(); },
          } : undefined}
          onClose={() => setEditingSeat(null)}
          onConfirm={handleEditConfirm}
          onRequestRemove={(seat) => {
            setActionError(null);
            setRemovingSeat(seat);
          }}
        />
      ) : null}

      {removingSeat ? (
        <RemoveSeatDialog
          key={removingSeat.membership_id}
          open
          seat={removingSeat}
          isPending={isRemovePending}
          errorMessage={actionError}
          onClose={() => {
            setRemovingSeat(null);
            setActionError(null);
          }}
          onConfirm={handleRemoveConfirm}
        />
      ) : null}

      {revokingInvitation ? (
        <RevokeInvitationDialog
          key={revokingInvitation.id}
          open
          invitation={revokingInvitation}
          isPending={isRevokePending}
          errorMessage={actionError}
          onClose={() => {
            setRevokingInvitation(null);
            setActionError(null);
          }}
          onConfirm={handleRevokeConfirm}
        />
      ) : null}
    </>
  );
}
