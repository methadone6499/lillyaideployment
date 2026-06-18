"use client";

import { useQuery } from "@tanstack/react-query";
import { discoverComparators } from "../api/reportApi";
import { reportQueryKeys } from "../api/reportQueryKeys";

export function useComparatorDiscovery(reportId: string | null) {
  return useQuery({
    queryKey: reportQueryKeys.comparators(reportId ?? ""),
    queryFn: () => discoverComparators(reportId!),
    enabled: Boolean(reportId),
    staleTime: 60_000,
    select: (data) => data.suggestions,
  });
}
