"use client";
import { Button } from "@/components/ui";
import { useReportQuotaAccess } from "../hooks/useReportQuotaAccess";
import { TopUpBalanceDetails } from "./TopUpOverviewCard";

export function ReportQuotaNotice() {
  const quota = useReportQuotaAccess();
  if (quota.canGenerate) return null;
  return <div className="flex flex-col gap-3 rounded-surface border border-border-default bg-surface-subtle p-5 text-helper text-text-muted">
    <p role="status">{quota.reason}</p>
    {!quota.checking ? <><TopUpBalanceDetails compact /><Button variant="secondary" size="compact" className="w-fit" onClick={() => void quota.refetch()}>Refresh report availability</Button></> : null}
  </div>;
}
