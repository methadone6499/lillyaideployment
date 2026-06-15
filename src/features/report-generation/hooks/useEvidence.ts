"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchEvidence } from "../api/reportApi";
import type { EvidenceType, FilterState } from "../types";

export function useEvidence(type: EvidenceType, filters: FilterState) {
  return useQuery({
    queryKey: ["evidence", type, filters],
    queryFn: () => fetchEvidence(type, filters),
    staleTime: 60_000,
  });
}
