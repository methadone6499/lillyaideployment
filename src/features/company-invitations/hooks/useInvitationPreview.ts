"use client";

import { useQuery } from "@tanstack/react-query";

import { previewInvitation } from "../api/companyInvitationApi";
import { companyInvitationQueryKeys } from "../api/companyInvitationQueryKeys";
import { getInvitationToken } from "../utils/invitationToken";
import { shouldRetryCompanyInvitationQuery } from "../utils/shouldRetryCompanyInvitationQuery";

export function useInvitationPreview(enabled: boolean) {
  return useQuery({
    queryKey: companyInvitationQueryKeys.preview(),
    queryFn: ({ signal }) =>
      previewInvitation(getInvitationToken() ?? "", signal),
    enabled,
    retry: shouldRetryCompanyInvitationQuery,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
