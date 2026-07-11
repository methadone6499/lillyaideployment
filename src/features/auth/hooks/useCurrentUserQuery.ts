"use client";

import { getAuthToken } from "@/lib/authToken";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/authApi";
import { authQueryKeys } from "../api/authQueryKeys";

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: authQueryKeys.me,
    queryFn: getMe,
    enabled: Boolean(getAuthToken()),
  });
}
