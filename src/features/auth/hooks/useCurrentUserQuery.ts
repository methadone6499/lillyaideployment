"use client";

import { skipToken, useQuery } from "@tanstack/react-query";

import { authQueryKeys } from "../api/authQueryKeys";
import type { AuthMeResponse } from "../schemas/authSchemas";

export function useCurrentUserQuery() {
  return useQuery<AuthMeResponse>({
    queryKey: authQueryKeys.me,
    queryFn: skipToken,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}
