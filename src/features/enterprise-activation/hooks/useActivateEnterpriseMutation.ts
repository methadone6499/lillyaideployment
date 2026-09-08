"use client";

import { useMutation } from "@tanstack/react-query";

import { activateEnterprise } from "../api/enterpriseActivationApi";
import { enterpriseActivationQueryKeys } from "../api/enterpriseActivationQueryKeys";
import type { EnterpriseActivationRequest } from "../schemas/enterpriseActivationSchemas";

export function useActivateEnterpriseMutation() {
  return useMutation({
    mutationKey: enterpriseActivationQueryKeys.activate(),
    mutationFn: (input: EnterpriseActivationRequest) =>
      activateEnterprise(input),
    retry: false,
  });
}
