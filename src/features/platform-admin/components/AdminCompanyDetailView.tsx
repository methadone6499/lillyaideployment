"use client";

import { hasPermission, useAuthUser } from "@/features/auth";
import { formatAmountMinor } from "@/features/billing";
import { cn } from "@/lib/cn";

import { useAdminCompany } from "../hooks/useAdminCompany";
import { classifyAdminManagementError } from "../utils/adminManagement";
import {
  COMPANY_STATUS_LABELS,
  PLAN_TYPE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  formatAdminDateTime,
  statusPillClass,
} from "../utils/adminManagementDisplay";
import { AdminCompanyMembersTable } from "./AdminCompanyMembersTable";
import { AdminRequestId } from "./AdminRequestId";

type AdminCompanyDetailViewProps = {
  companyId: string;
};

type DetailItemProps = {
  label: string;
  value: string | number;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="rounded-card bg-surface-subtle p-4">
      <dt className="text-helper text-text-muted">{label}</dt>
      <dd className="mt-1 break-words text-label font-medium text-white">{value}</dd>
    </div>
  );
}

export function AdminCompanyDetailView({ companyId }: AdminCompanyDetailViewProps) {
  const { authMe } = useAuthUser();
  const canRead = hasPermission(authMe, "admin:companies_read");
  const query = useAdminCompany(companyId, canRead);
  const classifiedError = query.error
    ? classifyAdminManagementError(query.error)
    : null;

  if (!authMe || (canRead && query.isLoading)) {
    return <p className="mt-10 text-label text-text-muted">Loading company…</p>;
  }

  if (!canRead) {
    return (
      <p role="alert" className="mt-10 text-label text-text-muted">
        You do not have permission to view companies.
      </p>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div role="alert" className="mt-10 rounded-button border border-border-default bg-surface-default p-8 text-label text-text-muted">
        <p>{classifiedError?.message ?? "Unable to load this company."}</p>
        <AdminRequestId requestId={classifiedError?.requestId} />
        {classifiedError?.kind !== "not_found" ? (
          <button type="button" onClick={() => void query.refetch()} className="mt-4 rounded-button border border-border-default px-4 py-2 text-white">Try again</button>
        ) : null}
      </div>
    );
  }

  const company = query.data;
  const subscription = company.subscription;

  return (
    <>
      <section className="mt-10 overflow-hidden rounded-button border border-border-default bg-surface-default">
        <div className="flex flex-col gap-4 border-b border-border-default px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-card-title font-medium text-white">{company.name}</h2>
            <p className="mt-1 text-label text-text-muted">{company.billing_email}</p>
          </div>
          <span className={cn("w-fit rounded-card px-3 py-2 text-label font-medium", statusPillClass(company.status))}>
            {COMPANY_STATUS_LABELS[company.status]}
          </span>
        </div>

        <dl className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
          <DetailItem label="Created" value={formatAdminDateTime(company.created_at)} />
          <DetailItem label="Primary administrator" value={company.primary_admin?.full_name ?? "Unassigned"} />
          <DetailItem label="Administrator email" value={company.primary_admin?.email ?? "—"} />
        </dl>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-button border border-border-default bg-surface-default p-6">
          <h2 className="text-card-title font-medium text-white">Subscription</h2>
          <dl className="mt-4 grid gap-3">
            <DetailItem label="Plan" value={subscription ? PLAN_TYPE_LABELS[subscription.plan_type] : "No subscription"} />
            <DetailItem label="Status" value={subscription ? SUBSCRIPTION_STATUS_LABELS[subscription.status] : "—"} />
            <DetailItem label="Amount" value={subscription ? `${formatAmountMinor(subscription.amount_minor, subscription.currency)} / month` : "—"} />
            <DetailItem label="Current period" value={subscription ? `${formatAdminDateTime(subscription.current_period_start)} – ${formatAdminDateTime(subscription.current_period_end)}` : "—"} />
          </dl>
        </section>

        <section className="rounded-button border border-border-default bg-surface-default p-6">
          <h2 className="text-card-title font-medium text-white">Seats</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <DetailItem label="Limit" value={company.seats.limit} />
            <DetailItem label="Available" value={company.seats.available} />
            <DetailItem label="Occupied" value={company.seats.occupied} />
            <DetailItem label="Active" value={company.seats.active} />
            <DetailItem label="Disabled" value={company.seats.disabled} />
            <DetailItem label="Pending invites" value={company.seats.pending_invitations} />
          </dl>
        </section>

        <section className="rounded-button border border-border-default bg-surface-default p-6">
          <h2 className="text-card-title font-medium text-white">Report quota</h2>
          {company.quota ? (
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <DetailItem label="Total" value={company.quota.total} />
              <DetailItem label="Remaining" value={company.quota.remaining} />
              <DetailItem label="Allocated" value={company.quota.allocated} />
              <DetailItem label="Unallocated" value={company.quota.unallocated} />
              <DetailItem label="Used" value={company.quota.used} />
            </dl>
          ) : (
            <p className="mt-4 text-label text-text-muted">No quota is assigned.</p>
          )}
        </section>
      </div>

      <AdminCompanyMembersTable companyId={companyId} enabled={canRead} />
    </>
  );
}
