"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { SuccessToast } from "@/components/ui/SuccessToast";
import { refetchAuthMe, useLogoutMutation } from "@/features/auth";
import { clearBillingSession } from "@/features/billing";
import { clearCompanyBrandingSession } from "@/features/company-branding";
import { clearCompanyInvitationSession } from "@/features/company-invitations";
import { clearCompanyQuotaSession } from "@/features/company-quota";
import { clearCustomSubscriptionSession } from "@/features/custom-subscriptions";
import { clearCompanyGenerationQueries } from "@/features/report-generation";
import { clearCompanyReportContext } from "@/features/reports";
import { clearCompanySeatSession, LeaveCompanyButton } from "@/features/seat-management";
import { useAuthStore } from "@/store/useAuthStore";
export function CompanyMembershipBoundary({ children }: {
  children: ReactNode;
}) {
  const client = useQueryClient();
  const router = useRouter();
  const access = useAuthStore((state) => state.companyAccess);
  const generation = useAuthStore((state) => state.sessionGeneration);
  const contextVersion = useAuthStore((state) => state.companyContextVersion);
  const logout = useLogoutMutation();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const transitionKey = `${generation}:${contextVersion}`;
  const recovery = useQuery({
    queryKey: ["auth", "company-departure", generation, contextVersion],
    enabled: access === "transitioning", retry: false, staleTime: Infinity,
    refetchOnWindowFocus: false, refetchOnReconnect: false,
    queryFn: async ({ signal }) => {
      await Promise.all([
        clearBillingSession(client), clearCompanyBrandingSession(client), clearCompanyInvitationSession(client),
        clearCompanyQuotaSession(client), clearCustomSubscriptionSession(client), clearCompanySeatSession(client),
        clearCompanyReportContext(client), clearCompanyGenerationQueries(client),
      ]);
      if (!useAuthStore.getState().isGenerationCurrent(generation))
        throw new Error("Your session changed. Please sign in again.");
      await refetchAuthMe(signal, true);
      if (!useAuthStore.getState().isGenerationCurrent(generation))
        throw new Error("Your session changed. Please sign in again.");
      return { generation, contextVersion };
    },
  });
  useEffect(() => {
    if (!recovery.data || recovery.data.generation !== generation || recovery.data.contextVersion !== contextVersion || access !== "transitioning")
      return;
    router.replace("/dashboard");
    useAuthStore.getState().setCompanyAccess(generation, "available");
  }, [access, recovery.data, generation, contextVersion, router]);
  const notice = recovery.data?.generation === generation && recovery.data.contextVersion === contextVersion && dismissed !== transitionKey
    ? "You left the company. Your personal account is still active." : null;
  if (access === "disabled" || access === "transitioning")
    return <main className="flex min-h-screen items-center justify-center bg-base-black px-4 py-12 font-[family-name:var(--font-inter)] text-text-body">
      <section className="w-full max-w-xl rounded-surface border border-border-default bg-surface-default p-6 sm:p-8">
        <h1 className="text-card-title font-medium text-white">{access === "disabled" ? "Company access disabled" : "Opening your personal workspace"}</h1>
        {access === "disabled" ? <>
          <p className="mt-4 text-label leading-relaxed text-text-muted">Your company access has been disabled. Your personal account remains active. You can contact your company administrator or leave the company to return to your personal workspace.</p>
          <div className="mt-6 flex flex-wrap gap-3"><LeaveCompanyButton blocked /><Button variant="secondary" size="table" disabled={logout.isPending} onClick={() => logout.mutate()}>Sign out</Button></div>
        </> : recovery.isError ? <div role="alert" className="mt-4 text-label text-text-muted"><p>{recovery.error instanceof Error ? recovery.error.message : "Your company departure succeeded. We could not load your personal account yet."}</p><Button className="mt-5" disabled={recovery.isFetching} onClick={() => void recovery.refetch()}>Retry personal account</Button></div> : <p role="status" className="mt-4 text-label text-text-muted">You left the company. Loading your personal account…</p>}
      </section>
    </main>;
  return <>{children}<SuccessToast message={notice} onDismiss={() => setDismissed(transitionKey)} /></>;
}
