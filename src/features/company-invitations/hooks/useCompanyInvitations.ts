"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { useConfirmedUserId, useIsAuthenticated } from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

import { listCompanyInvitations } from "../api/companyInvitationApi";
import { companyInvitationQueryKeys } from "../api/companyInvitationQueryKeys";
import type { InvitationStatus } from "../schemas/companyInvitationSchemas";
import { shouldRetryCompanyInvitationQuery } from "../utils/shouldRetryCompanyInvitationQuery";

const DEFAULT_LIST_LIMIT = 20;

export type UseCompanyInvitationsParams = {
  limit?: number;
  status?: InvitationStatus;
  enabled?: boolean;
};

function isInvalidCursorError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 400 &&
    error.code === "invalid_cursor"
  );
}

export function useCompanyInvitations(
  params: UseCompanyInvitationsParams = {},
) {
  const queryClient = useQueryClient();
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const listParams = {
    limit,
    status: params.status,
  };
  const listQueryKey = companyInvitationQueryKeys.list(userId ?? "", listParams);
  const enabled =
    isAuthenticated && Boolean(userId) && (params.enabled ?? true);

  const query = useInfiniteQuery({
    queryKey: listQueryKey,
    queryFn: ({ pageParam, signal }) =>
      listCompanyInvitations(
        {
          ...listParams,
          cursor: pageParam,
        },
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryCompanyInvitationQuery,
  });

  const fetchNextPage = async () => {
    const result = await query.fetchNextPage();

    if (result.isError && isInvalidCursorError(result.error)) {
      await queryClient.resetQueries({ queryKey: listQueryKey });
    }

    return result;
  };

  return {
    ...query,
    fetchNextPage,
  };
}
