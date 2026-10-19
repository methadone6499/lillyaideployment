"use client";

import { formatDisplayDate as formatInvitationDate } from "@/lib/formatDisplay";

import type { Invitation } from "@/features/company-invitations";
import { Button } from "@/components/ui";
import { DashboardPagination } from "@/features/dashboard";

type PendingInvitationsTableProps = {
  invitations: Invitation[];
  currentPage: number;
  totalPages: number;
  canManage: boolean;
  isPageChangePending?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  isUpdatingResults?: boolean;
  errorMessage?: string | null;
  nextPageErrorMessage?: string | null;
  pendingInvitationId?: string | null;
  resendCooldownSecondsById?: Record<string, number>;
  resendLocked?: boolean;
  onPageChange: (page: number) => void | Promise<void>;
  onRetry?: () => void;
  onRetryNextPage?: () => void;
  onResend: (invitation: Invitation) => void;
  onRevoke: (invitation: Invitation) => void;
};

export function PendingInvitationsTable({
  invitations,
  currentPage,
  totalPages,
  canManage,
  isPageChangePending = false,
  isLoading = false,
  isError = false,
  isEmpty = false,
  isUpdatingResults = false,
  errorMessage = null,
  nextPageErrorMessage = null,
  pendingInvitationId = null,
  resendCooldownSecondsById = {},
  resendLocked = false,
  onPageChange,
  onRetry,
  onRetryNextPage,
  onResend,
  onRevoke,
}: PendingInvitationsTableProps) {
  return (
    <section
      aria-labelledby="pending-invitations-heading"
      aria-busy={isLoading || isUpdatingResults || isPageChangePending}
      className="mt-12 lg:mt-14"
    >
      <div className="overflow-hidden rounded-surface border border-border-default bg-surface-default">
        <header className="flex min-h-14 items-center border-b border-border-default px-6 py-4">
          <h2
            id="pending-invitations-heading"
            className="text-card-title font-medium text-white"
          >
            Pending Invitations
          </h2>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] table-fixed">
            <caption className="sr-only">
              Pending company seat invitations
            </caption>
            <colgroup>
              <col className="w-[34%]" />
              <col className="w-[18%]" />
              <col className="w-[22%]" />
              <col className="w-[26%]" />
            </colgroup>
            <thead className="h-14 bg-surface-subtle text-left text-label font-medium text-text-step">
              <tr>
                <th scope="col" className="py-4 pr-3 pl-6">
                  Email
                </th>
                <th scope="col" className="px-3 py-4">
                  Reports
                </th>
                <th scope="col" className="px-3 py-4">
                  Invited
                </th>
                <th scope="col" className="py-4 pr-6 pl-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="h-[172px] px-6 text-center text-label text-text-muted"
                  >
                    Loading invitations…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="h-[172px] px-6">
                    <div
                      className="flex flex-col items-center gap-4 text-center text-label text-text-muted"
                      role="alert"
                    >
                      <p>{errorMessage ?? "Unable to load invitations."}</p>
                      {onRetry ? (
                        <Button
                          variant="table"
                          size="table"
                          onClick={onRetry}
                        >
                          Try again
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : isEmpty ? (
                <tr>
                  <td
                    colSpan={4}
                    className="h-[172px] px-6 text-center text-label text-text-muted"
                  >
                    No pending invitations.
                  </td>
                </tr>
              ) : (
                invitations.map((invitation) => {
                  const isRowPending = pendingInvitationId === invitation.id;
                  const cooldownSeconds =
                    resendCooldownSecondsById[invitation.id] ?? 0;
                  const isCoolingDown = cooldownSeconds > 0;

                  return (
                    <tr
                      key={invitation.id}
                      className="h-[72px] border-b border-border-subtle text-label font-medium text-white transition-colors last:border-b-0 hover:bg-brand-bg focus-within:bg-brand-bg"
                    >
                      <td className="truncate py-4 pr-3 pl-6">
                        {invitation.email}
                      </td>
                      <td className="px-3 py-4 font-normal text-text-body">
                        —
                      </td>
                      <td className="px-3 py-4 font-normal text-text-body">
                        {formatInvitationDate(invitation.created_at)}
                      </td>
                      <td className="py-4 pr-6 pl-3">
                        {canManage ? (
                          <span className="flex items-center justify-end gap-2">
                            <Button
                              variant="table"
                              size="table"
                              disabled={
                                isRowPending || isCoolingDown || resendLocked
                              }
                              title={
                                resendLocked
                                  ? "Paused while a Custom plan payment is in progress"
                                  : isCoolingDown
                                    ? `Wait ${cooldownSeconds}s before resending`
                                    : "Resend invitation"
                              }
                              onClick={() => onResend(invitation)}
                            >
                              {isCoolingDown
                                ? `Resend in ${cooldownSeconds}s`
                                : "Resend"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="table"
                              disabled={isRowPending}
                              onClick={() => onRevoke(invitation)}
                            >
                              Revoke
                            </Button>
                          </span>
                        ) : (
                          <span className="flex justify-end text-helper font-normal text-text-muted">
                            View only
                          </span>
                        )}
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
        {isUpdatingResults ? "Updating invitation results." : ""}
      </p>

      {nextPageErrorMessage ? (
        <div
          className="mt-4 flex items-center justify-end gap-3 px-2 text-label text-text-muted"
          role="alert"
        >
          <span>{nextPageErrorMessage}</span>
          {onRetryNextPage ? (
            <Button
              variant="table"
              size="compact"
              disabled={isPageChangePending}
              onClick={onRetryNextPage}
            >
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      <DashboardPagination
        currentPage={currentPage}
        totalPages={totalPages}
        isPageChangePending={isPageChangePending}
        onPageChange={onPageChange}
        ariaLabel="Pending invitation pagination"
        className="mt-4 px-2"
      />
    </section>
  );
}
