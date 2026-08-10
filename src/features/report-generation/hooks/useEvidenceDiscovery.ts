"use client";

import { useQuery } from "@tanstack/react-query";
import {
  discoverClinicalArticles,
  discoverEconomicArticles,
} from "../api/reportApi";
import { reportQueryKeys } from "../api/reportQueryKeys";
import type { EvidenceType } from "../types";
import { useReportQueriesEnabled } from "./useReportQueriesEnabled";

export function useEvidenceDiscovery(
  reportServiceId: string | null,
  type: EvidenceType,
) {
  const isClinical = type === "clinical";
  const queriesEnabled = useReportQueriesEnabled(Boolean(reportServiceId));

  return useQuery({
    queryKey: isClinical
      ? reportQueryKeys.clinicalArticles(reportServiceId ?? "")
      : reportQueryKeys.economicArticles(reportServiceId ?? ""),
    queryFn: ({ signal }) =>
      isClinical
        ? discoverClinicalArticles(reportServiceId!, signal)
        : discoverEconomicArticles(reportServiceId!, signal),
    enabled: queriesEnabled,
    staleTime: 60_000,
    select: (data) => data.candidates,
  });
}
