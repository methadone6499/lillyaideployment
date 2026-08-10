"use client";

import { useQuery } from "@tanstack/react-query";
import { discoverComparators } from "../api/reportApi";
import { reportQueryKeys } from "../api/reportQueryKeys";
import { useReportQueriesEnabled } from "./useReportQueriesEnabled";

export function useComparatorDiscovery(reportServiceId: string | null) {
  const queriesEnabled = useReportQueriesEnabled(Boolean(reportServiceId));

  return useQuery({
    queryKey: reportQueryKeys.comparators(reportServiceId ?? ""),
    queryFn: ({ signal }) => discoverComparators(reportServiceId!, signal),
    enabled: queriesEnabled,
    staleTime: 60_000,
    select: (data) => data.suggestions,
  });
}
