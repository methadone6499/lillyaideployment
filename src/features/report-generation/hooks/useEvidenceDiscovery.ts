"use client";

import { useQuery } from "@tanstack/react-query";
import {
  discoverClinicalArticles,
  discoverEconomicArticles,
} from "../api/reportApi";
import { reportQueryKeys } from "../api/reportQueryKeys";
import type { EvidenceType } from "../types";

export function useEvidenceDiscovery(
  reportId: string | null,
  type: EvidenceType,
) {
  const isClinical = type === "clinical";

  return useQuery({
    queryKey: isClinical
      ? reportQueryKeys.clinicalArticles(reportId ?? "")
      : reportQueryKeys.economicArticles(reportId ?? ""),
    queryFn: () =>
      isClinical
        ? discoverClinicalArticles(reportId!)
        : discoverEconomicArticles(reportId!),
    enabled: Boolean(reportId),
    staleTime: 60_000,
    select: (data) => data.candidates,
  });
}
