import { authenticatedAuthRequest } from "@/features/auth";
import { apiRequest } from "@/services/apiRequest";

import {
  enterpriseActivationRequestSchema,
  enterpriseActivationResponseSchema,
  type EnterpriseActivationRequest,
  type EnterpriseActivationResponse,
} from "../schemas/enterpriseActivationSchemas";

const ENTERPRISE_ACTIVATE_URL =
  "/api/v1/subscriptions/enterprise/activate";

function bearerHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export function activateEnterprise(
  input: EnterpriseActivationRequest,
  signal?: AbortSignal,
): Promise<EnterpriseActivationResponse> {
  const body = enterpriseActivationRequestSchema.parse(input);

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(ENTERPRISE_ACTIVATE_URL, {
        method: "POST",
        headers: bearerHeaders(accessToken),
        body,
        schema: enterpriseActivationResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}
