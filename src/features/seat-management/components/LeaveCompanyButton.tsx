"use client";
import { useState } from "react";
import { Button } from "@/components/ui";
import { useAuthUser } from "@/features/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useLeaveCompany } from "../hooks/useLeaveCompany";
import { LeaveCompanyDialog } from "./LeaveCompanyDialog";
export function LeaveCompanyButton({ blocked = false, companyName }: {
  blocked?: boolean;
  companyName?: string;
}) {
  const { authMe } = useAuthUser();
  const access = useAuthStore((state) => state.companyAccess);
  const [open, setOpen] = useState(false);
  const [cannotLeave, setCannotLeave] = useState(false);
  const mutation = useLeaveCompany();
  const seat = authMe?.active_context.type === "company" && authMe.active_context.role === "company_seat_user";
  if (cannotLeave || (!seat && !(blocked && access === "disabled")))
    return cannotLeave ? <p role="alert" className="mt-4 text-label text-status-running">Company administrators must transfer ownership before leaving.</p> : null;
  return <>
    <Button variant="destructive" size="table" disabled={mutation.isLeaving} onClick={() => setOpen(true)}>Leave company</Button>
    {open ? <LeaveCompanyDialog
      companyName={companyName}
      onClose={() => setOpen(false)}
      onCannotLeave={() => setCannotLeave(true)}
    /> : null}
  </>;
}
