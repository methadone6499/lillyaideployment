"use client";

import { useState } from "react";

import { hasPermission, useAuthUser } from "@/features/auth";
import { cn } from "@/lib/cn";

import { useAdminUser } from "../hooks/useAdminUser";
import {
  useDisableAdminUserMutation,
  useEnableAdminUserMutation,
} from "../hooks/useAdminUserStatusMutations";
import {
  canDisableAdminUser,
  canEnableAdminUser,
  classifyAdminManagementError,
} from "../utils/adminManagement";
import {
  EFFECTIVE_ROLE_LABELS,
  MEMBERSHIP_STATUS_LABELS,
  PLAN_TYPE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  USER_STATUS_LABELS,
  formatAdminDateTime,
  statusPillClass,
} from "../utils/adminManagementDisplay";
import { AdminRequestId } from "./AdminRequestId";
import { AdminUserStatusDialog } from "./AdminUserStatusDialog";

type AdminUserDetailViewProps = {
  userId: string;
};

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="rounded-card bg-surface-subtle p-4">
      <dt className="text-helper text-text-muted">{label}</dt>
      <dd className="mt-1 break-words text-label font-medium text-white">{value}</dd>
    </div>
  );
}

export function AdminUserDetailView({ userId }: AdminUserDetailViewProps) {
  const { authMe } = useAuthUser();
  const canRead = hasPermission(authMe, "admin:users_read");
  const canManage = hasPermission(authMe, "admin:users_manage");
  const query = useAdminUser(userId, canRead);
  const disableMutation = useDisableAdminUserMutation();
  const enableMutation = useEnableAdminUserMutation();
  const [dialogAction, setDialogAction] = useState<"disable" | "enable" | null>(null);
  const queryError = query.error
    ? classifyAdminManagementError(query.error)
    : null;
  const activeMutation =
    dialogAction === "disable" ? disableMutation : enableMutation;
  const mutationError = activeMutation.error
    ? classifyAdminManagementError(activeMutation.error)
    : null;

  if (!authMe || (canRead && query.isLoading)) {
    return <p className="mt-10 text-label text-text-muted">Loading user…</p>;
  }

  if (!canRead) {
    return (
      <p role="alert" className="mt-10 text-label text-text-muted">
        You do not have permission to view users.
      </p>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div role="alert" className="mt-10 rounded-button border border-border-default bg-surface-default p-8 text-label text-text-muted">
        <p>{queryError?.message ?? "Unable to load this user."}</p>
        <AdminRequestId requestId={queryError?.requestId} />
        {queryError?.kind !== "not_found" ? (
          <button type="button" onClick={() => void query.refetch()} className="mt-4 rounded-button border border-border-default px-4 py-2 text-white">Try again</button>
        ) : null}
      </div>
    );
  }

  const user = query.data;
  const showDisable = canManage && canDisableAdminUser(user);
  const showEnable = canManage && canEnableAdminUser(user);
  const isProtectedSuperAdmin =
    user.global_role === "super_admin" ||
    user.access.effective_role === "super_admin";
  const organization = user.access.company_name || user.institution_name || "Personal";

  const handleConfirm = async () => {
    if (!dialogAction) return;

    try {
      if (dialogAction === "disable") {
        await disableMutation.mutateAsync(user.id);
      } else {
        await enableMutation.mutateAsync(user.id);
      }
      setDialogAction(null);
    } catch {
      // The dialog renders the classified mutation error.
    }
  };

  const closeDialog = () => {
    if (activeMutation.isPending) return;
    disableMutation.reset();
    enableMutation.reset();
    setDialogAction(null);
  };

  return (
    <>
      <section className="mt-10 overflow-hidden rounded-button border border-border-default bg-surface-default">
        <div className="flex flex-col gap-5 border-b border-border-default px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-card-title font-medium text-white">{user.full_name}</h2>
            <p className="mt-1 text-label text-text-muted">{user.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn("rounded-card px-3 py-2 text-label font-medium", statusPillClass(user.status))}>
              {USER_STATUS_LABELS[user.status]}
            </span>
            {showDisable ? (
              <button type="button" onClick={() => setDialogAction("disable")} className="h-10 rounded-button bg-[#d92244] px-4 text-label font-medium text-white">
                Disable account
              </button>
            ) : null}
            {showEnable ? (
              <button type="button" onClick={() => setDialogAction("enable")} className="h-10 rounded-button bg-brand px-4 text-label font-medium text-white">
                Enable account
              </button>
            ) : null}
          </div>
        </div>

        <dl className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
          <DetailItem label="Effective access" value={EFFECTIVE_ROLE_LABELS[user.access.effective_role]} />
          <DetailItem label="Organization" value={organization} />
          <DetailItem label="Email verified" value={user.email_verified ? "Yes" : "No"} />
          <DetailItem label="Last sign-in" value={formatAdminDateTime(user.last_login_at)} />
          <DetailItem label="Created" value={formatAdminDateTime(user.created_at)} />
          <DetailItem
            label="Membership status"
            value={
              user.access.membership_status
                ? MEMBERSHIP_STATUS_LABELS[user.access.membership_status]
                : "—"
            }
          />
          <DetailItem label="Disabled at" value={formatAdminDateTime(user.disabled_at)} />
          <DetailItem label="Disabled by user" value={user.disabled_by_user_id ?? "—"} />
        </dl>
      </section>

      <section className="mt-6 rounded-button border border-border-default bg-surface-default p-6">
        <h2 className="text-card-title font-medium text-white">Access subscription</h2>
        {user.access_subscription ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <DetailItem label="Subscription ID" value={user.access_subscription.id} />
            <DetailItem label="Plan" value={PLAN_TYPE_LABELS[user.access_subscription.plan_type]} />
            <DetailItem label="Status" value={SUBSCRIPTION_STATUS_LABELS[user.access_subscription.status]} />
          </dl>
        ) : (
          <p className="mt-4 text-label text-text-muted">No access subscription is attached to this account.</p>
        )}

        <p className="mt-5 rounded-card border border-border-default bg-surface-subtle p-4 text-label text-text-muted">
          Account status and company membership are separate. Enabling or disabling this account does not change membership, seats, quota, reports, company status, or billing.
        </p>

        {!canManage ? (
          <p className="mt-4 text-helper text-text-muted">You can view this user, but you do not have permission to manage account status.</p>
        ) : isProtectedSuperAdmin ? (
          <p className="mt-4 text-helper text-text-muted">Super Admin accounts are protected and cannot be disabled.</p>
        ) : user.status === "disabled" && !user.email_verified ? (
          <p className="mt-4 text-helper text-status-running">This account must verify its email address before it can be enabled.</p>
        ) : user.status === "pending_verification" ? (
          <p className="mt-4 text-helper text-text-muted">Pending-verification accounts cannot be enabled or disabled from this screen.</p>
        ) : null}
      </section>

      {dialogAction ? (
        <AdminUserStatusDialog
          open
          action={dialogAction}
          user={user}
          isPending={activeMutation.isPending}
          errorMessage={mutationError?.message}
          requestId={mutationError?.requestId}
          onClose={closeDialog}
          onConfirm={handleConfirm}
        />
      ) : null}
    </>
  );
}
