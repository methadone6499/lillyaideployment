"use client";

import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { useConfirmedUserId } from "@/features/auth";

import { adminCompanyQueryKeys } from "../api/adminCompanyQueryKeys";
import { disableAdminUser, enableAdminUser } from "../api/adminUserApi";
import { adminUserQueryKeys } from "../api/adminUserQueryKeys";
import type { AdminUserResponse } from "../schemas/adminUserSchemas";

async function refreshAffectedAdminQueries(
  queryClient: QueryClient,
  actingUserId: string | null,
  targetUserId: string,
  updatedUser?: AdminUserResponse,
) {
  if (!actingUserId) {
    return;
  }

  if (updatedUser) {
    queryClient.setQueryData(
      adminUserQueryKeys.detail(actingUserId, targetUserId),
      updatedUser,
    );
  } else {
    await queryClient.invalidateQueries({
      queryKey: adminUserQueryKeys.detail(actingUserId, targetUserId),
    });
  }

  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: adminUserQueryKeys.lists(actingUserId),
    }),
    queryClient.invalidateQueries({
      queryKey: adminCompanyQueryKeys.memberLists(actingUserId),
    }),
  ]);
}

export function useDisableAdminUserMutation() {
  const queryClient = useQueryClient();
  const actingUserId = useConfirmedUserId();

  return useMutation({
    mutationKey: adminUserQueryKeys.disable(),
    mutationFn: (targetUserId: string) => disableAdminUser(targetUserId),
    retry: false,
    onSuccess: (updatedUser, targetUserId) =>
      refreshAffectedAdminQueries(
        queryClient,
        actingUserId,
        targetUserId,
        updatedUser,
      ),
    onError: (_error, targetUserId) =>
      refreshAffectedAdminQueries(
        queryClient,
        actingUserId,
        targetUserId,
      ),
  });
}

export function useEnableAdminUserMutation() {
  const queryClient = useQueryClient();
  const actingUserId = useConfirmedUserId();

  return useMutation({
    mutationKey: adminUserQueryKeys.enable(),
    mutationFn: (targetUserId: string) => enableAdminUser(targetUserId),
    retry: false,
    onSuccess: (updatedUser, targetUserId) =>
      refreshAffectedAdminQueries(
        queryClient,
        actingUserId,
        targetUserId,
        updatedUser,
      ),
    onError: (_error, targetUserId) =>
      refreshAffectedAdminQueries(
        queryClient,
        actingUserId,
        targetUserId,
      ),
  });
}
