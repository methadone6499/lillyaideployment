"use client";

import { useMutation } from "@tanstack/react-query";

import {
  acceptInvitation,
  registerInvitation,
} from "../api/companyInvitationApi";
import { companyInvitationQueryKeys } from "../api/companyInvitationQueryKeys";
import { getInvitationToken } from "../utils/invitationToken";

export function useAcceptInvitationMutation() {
  return useMutation({
    mutationKey: companyInvitationQueryKeys.accept(),
    mutationFn: () => acceptInvitation(getInvitationToken() ?? ""),
    retry: false,
  });
}

export function useRegisterInvitationMutation() {
  return useMutation({
    mutationKey: companyInvitationQueryKeys.register(),
    mutationFn: (input: { full_name: string; password: string }) =>
      registerInvitation({
        token: getInvitationToken() ?? "",
        full_name: input.full_name,
        password: input.password,
      }),
    retry: false,
  });
}
