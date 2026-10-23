"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, ModalDialog, TextField } from "@/components/ui";
import { useAuthUser } from "@/features/auth";
import { canAllocateTopUps, emitTopUpEvent, getMaximumTopUpTarget, parseTopUpInput, TopUpErrorNotice, useSetMemberTopUpMutation, useSubscriptionOverview, useTopUpContext, useTopUpOverview } from "@/features/billing";
import { formatDisplayCount } from "@/lib/formatDisplay";
import { listCompanySeats } from "../api/companySeatApi";
import type { Seat } from "../schemas/seatManagementSchemas";

function AllocationDialog({ seat, currentBalance, pool, enabled, onClose }: {
  seat: Seat; currentBalance: number; pool: number; enabled: boolean; onClose: () => void;
}) {
  const [value, setValue] = useState(String(currentBalance));
  const mutation = useSetMemberTopUpMutation();
  const maximum = getMaximumTopUpTarget(currentBalance, pool, seat.status === "active");
  const target = parseTopUpInput(value, 0, maximum);
  const change = target === null ? null : target - currentBalance;
  return <ModalDialog title={`Additional reports for ${seat.full_name}`} busy={mutation.isPending} onClose={onClose}>
    <form className="flex flex-col gap-5" onSubmit={async (event) => {
      event.preventDefault();
      if (target === null || !enabled || mutation.isPending || change === 0) return;
      try {
        await mutation.mutateAsync({ membershipId: seat.membership_id, balance: target });
        emitTopUpEvent({ name: "top_up_allocation_updated", membershipId: seat.membership_id, direction: change! > 0 ? "assign" : "reclaim" });
        onClose();
      } catch { /* Feedback remains in the dialog after the mandatory refetch. */ }
    }}>
      <p className="text-helper text-text-muted">Current remaining: {formatDisplayCount(currentBalance)} · Company pool: {formatDisplayCount(pool)}</p>
      <TextField label="Target remaining additional reports" type="number" data-autofocus min={0} max={maximum} step={1} value={value}
        disabled={mutation.isPending || !enabled} onChange={(event) => setValue(event.target.value)}
        helper={seat.status === "disabled" ? "This member is disabled. You may reclaim unused reports, but cannot assign more." : `Set the final balance from 0 to ${formatDisplayCount(maximum)}.`}
        error={target === null ? `Enter a whole number from 0 to ${formatDisplayCount(maximum)}.` : undefined} />
      {change !== null ? <p role="status" className="text-label text-text-body">{change > 0 ? `Assign ${formatDisplayCount(change)} reports from the company pool.` : change < 0 ? `Return ${formatDisplayCount(-change)} unused reports to the company pool.` : "No allocation change."}</p> : null}
      {!enabled ? <p className="text-helper text-status-running">Allocation changes are currently unavailable. Review paid access and any Custom payment in progress.</p> : null}
      <TopUpErrorNotice error={mutation.error} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!enabled || target === null || change === 0 || mutation.isPending}>{mutation.isPending ? "Saving…" : "Save target balance"}</Button>
        <Button variant="secondary" disabled={mutation.isPending} onClick={onClose}>Cancel</Button>
      </div>
    </form>
  </ModalDialog>;
}
export function CompanyTopUpAllocator() {
  const overview = useTopUpOverview();
  const subscription = useSubscriptionOverview();
  const { userId } = useAuthUser();
  const context = useTopUpContext();
  const [editingMembershipId, setEditingMembershipId] = useState<string | null>(null);
  const seats = useQuery({
    queryKey: ["top-ups", userId, "allocation-seats", context.contextKey],
    enabled: context.supported && context.context?.role === "company_admin" && overview.data?.can_manage_allocations === true,
    queryFn: async ({ signal }) => {
      const members: Seat[] = [];
      const seen = new Set<string>();
      let cursor: string | undefined;
      do {
        const page = await listCompanySeats({ limit: 50, cursor }, signal);
        members.push(...page.items);
        cursor = page.next_cursor ?? undefined;
        if (cursor && seen.has(cursor)) throw new Error("The member list changed while loading. Refresh to try again.");
        if (cursor) seen.add(cursor);
      } while (cursor);
      return members.filter((seat) => seat.status !== "removed");
    }, staleTime: 15_000, retry: false,
  });
  const data = overview.data;
  if (!data?.can_manage_allocations || context.context?.role !== "company_admin") return null;
  const canEdit = !overview.isError && !subscription.isError && canAllocateTopUps(data, subscription.data);
  const currentSeat = seats.data?.find((seat) => seat.membership_id === editingMembershipId);
  const balanceFor = (id: string) => data.allocations.find((allocation) => allocation.membership_id === id)?.remaining_balance ?? 0;
  return <Card id="purchased-report-allocations" className="mt-8 scroll-mt-8 p-6">
    <div className="mb-6 flex flex-col gap-3">
      <h2 className="text-card-title font-medium text-white">Additional report allocations</h2>
      <p className="text-label text-text-body">Unallocated company pool: <span className="font-medium tabular-nums text-brand">{formatDisplayCount(data.pool_balance)}</span> · Assigned and remaining: {formatDisplayCount(data.assigned_balance)}</p>
      <p className="text-helper text-text-muted">Additional reports are separate from monthly quota. Assign them to members, including yourself, before use. Removing a member returns only their unused additional reports.</p>
      {!canEdit ? <p role="status" className="text-helper text-status-running">Balances remain visible. Allocation changes require current paid access, report generation, and no quota operation lock.</p> : null}
    </div>
    <TopUpErrorNotice error={seats.error ?? overview.error ?? subscription.error} />
    {seats.isPending ? <p role="status" className="text-helper text-text-muted">Loading company members…</p> : seats.isError ? <Button variant="secondary" size="compact" onClick={() => void seats.refetch()}>Reload members</Button> : <div className="overflow-x-auto rounded-surface border border-border-default">
      <table className="w-full text-left text-label">
        <caption className="sr-only">Additional report allocations by company membership</caption>
        <thead className="bg-surface-subtle text-text-muted"><tr>{["Member", "Status", "Remaining", "Consumed", "Allocation"].map((heading) => <th key={heading} scope="col" className="px-5 py-4 font-medium">{heading}</th>)}</tr></thead>
        <tbody>{seats.data?.map((seat) => <tr key={seat.membership_id} className="border-t border-border-subtle text-white hover:bg-brand-bg">
          <th scope="row" className="px-5 py-4 font-medium"><span className="block">{seat.full_name}{seat.user_id === userId ? " (you)" : ""}</span><span className="text-helper font-normal text-text-muted">{seat.email}</span></th>
          <td className="px-5 py-4 capitalize">{seat.status}</td>
          <td className="px-5 py-4 tabular-nums">{formatDisplayCount(balanceFor(seat.membership_id))}</td>
          <td className="px-5 py-4 tabular-nums">{formatDisplayCount(data.allocations.find((item) => item.membership_id === seat.membership_id)?.lifetime_consumed ?? 0)}</td>
          <td className="px-5 py-4"><Button variant="table" size="compact" disabled={!canEdit || (seat.status === "disabled" && balanceFor(seat.membership_id) === 0)} onClick={() => setEditingMembershipId(seat.membership_id)}>Set balance<span className="sr-only"> for {seat.full_name}</span></Button></td>
        </tr>)}</tbody>
      </table>
      {!seats.data?.length ? <p className="p-5 text-helper text-text-muted">No active or disabled memberships are available.</p> : null}
    </div>}
    {currentSeat ? <AllocationDialog key={currentSeat.membership_id} seat={currentSeat} currentBalance={balanceFor(currentSeat.membership_id)} pool={data.pool_balance} enabled={canEdit} onClose={() => setEditingMembershipId(null)} /> : null}
  </Card>;
}
