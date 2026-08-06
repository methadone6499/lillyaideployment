"use client";

import { useQuery } from "@tanstack/react-query";
import { discoverComparators } from "../api/reportApi";
import { reportQueryKeys } from "../api/reportQueryKeys";
import { useReportQueriesEnabled } from "./useReportQueriesEnabled";

export function useComparatorDiscovery(reportId: string | null) {
  const queriesEnabled = useReportQueriesEnabled(Boolean(reportId));

  return useQuery({
    queryKey: reportQueryKeys.comparators(reportId ?? ""),
    queryFn: ({ signal }) => discoverComparators(reportId!, signal),
    enabled: queriesEnabled,
    staleTime: 60_000,
    select: (data) => data.suggestions,
  });
}
