"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { hasPermission, useAuthUser } from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

import {
  deleteCompanyLogo,
  getCompanyLogo,
  getCompanyLogoBlob,
  putCompanyLogo,
} from "../api/companyBrandingApi";
import { companyBrandingQueryKeys } from "../api/companyBrandingQueryKeys";

function shouldRetryCompanyBrandingQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (failureCount >= 2) {
    return false;
  }

  return !(error instanceof ApiRequestError) || error.status >= 500;
}

function useCompanyBrandingContext() {
  const { authMe, userId, isAuthenticated } = useAuthUser();
  const activeContext = authMe?.active_context;
  const companyId =
    activeContext?.type === "company" ? activeContext.company_id ?? null : null;
  const canRead = hasPermission(authMe, "company:branding_read");
  const canManage = hasPermission(authMe, "company:branding_manage");

  return {
    userId: userId ?? "",
    companyId: companyId ?? "",
    canRead,
    canManage,
    hasCompanyContext:
      isAuthenticated && Boolean(userId) && Boolean(companyId),
  };
}

export function useCompanyLogoMetadata() {
  const context = useCompanyBrandingContext();
  const enabled = context.hasCompanyContext && context.canRead;
  const query = useQuery({
    queryKey: companyBrandingQueryKeys.metadata(
      context.userId,
      context.companyId,
    ),
    queryFn: ({ signal }) => getCompanyLogo(signal),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryCompanyBrandingQuery,
  });

  return { ...query, ...context, enabled };
}

export function useCompanyLogoContent(
  version: number | undefined,
  options: { enabled?: boolean } = {},
) {
  const queryClient = useQueryClient();
  const context = useCompanyBrandingContext();
  const enabled =
    context.hasCompanyContext &&
    context.canRead &&
    version !== undefined &&
    (options.enabled ?? true);

  return useQuery({
    queryKey: companyBrandingQueryKeys.content(
      context.userId,
      context.companyId,
      version ?? 0,
    ),
    queryFn: async ({ signal }) => {
      try {
        return await getCompanyLogoBlob(signal);
      } catch (error) {
        if (
          error instanceof ApiRequestError &&
          error.code === "company_logo_not_found"
        ) {
          queryClient.setQueryData(
            companyBrandingQueryKeys.metadata(
              context.userId,
              context.companyId,
            ),
            { logo: null },
          );
        }

        throw error;
      }
    },
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryCompanyBrandingQuery,
  });
}

export function usePutCompanyLogoMutation() {
  const queryClient = useQueryClient();
  const context = useCompanyBrandingContext();

  return useMutation({
    mutationFn: (file: File) => putCompanyLogo(file),
    onSuccess: (response) => {
      queryClient.setQueryData(
        companyBrandingQueryKeys.metadata(context.userId, context.companyId),
        response,
      );
      queryClient.removeQueries({
        queryKey: companyBrandingQueryKeys.contentRoot(
          context.userId,
          context.companyId,
        ),
      });
    },
  });
}

export function useDeleteCompanyLogoMutation() {
  const queryClient = useQueryClient();
  const context = useCompanyBrandingContext();

  return useMutation({
    mutationFn: () => deleteCompanyLogo(),
    onSuccess: () => {
      queryClient.setQueryData(
        companyBrandingQueryKeys.metadata(context.userId, context.companyId),
        { logo: null },
      );
      queryClient.removeQueries({
        queryKey: companyBrandingQueryKeys.contentRoot(
          context.userId,
          context.companyId,
        ),
      });
    },
  });
}
