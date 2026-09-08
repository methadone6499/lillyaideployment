"use client";

import { skipToken, useQuery } from "@tanstack/react-query";

import { getActiveContext, useAuthUser } from "@/features/auth";

import { enterpriseActivationQueryKeys } from "../api/enterpriseActivationQueryKeys";
import type { EnterpriseActivationResponse } from "../schemas/enterpriseActivationSchemas";

function formatPlanLabel(planType: string): string {
  return planType.charAt(0).toUpperCase() + planType.slice(1);
}

export function EnterpriseActivationBanner() {
  const { authMe, userId } = useAuthUser();
  const isCompanyContext = getActiveContext(authMe)?.type === "company";

  const { data: snapshot } = useQuery<EnterpriseActivationResponse>({
    queryKey: enterpriseActivationQueryKeys.snapshot(userId ?? ""),
    queryFn: skipToken,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  if (!isCompanyContext || !snapshot) {
    return null;
  }

  return (
    <div
      role="status"
      className="mt-6 rounded-card border border-brand/20 bg-brand/12 px-4 py-3 text-input text-white"
    >
      {formatPlanLabel(snapshot.plan_type)} plan · {snapshot.limits.seats}{" "}
      seats · {snapshot.limits.reports} reports / month
    </div>
  );
}
