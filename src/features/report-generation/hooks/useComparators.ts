"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchComparators } from "../api/reportApi";

export function useComparators(drugName: string, indications: string) {
  return useQuery({
    queryKey: ["comparators", drugName, indications],
    queryFn: () => fetchComparators(drugName, indications),
    enabled: Boolean(drugName && indications),
    staleTime: 60_000,
  });
}
