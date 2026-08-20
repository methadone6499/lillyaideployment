import { authenticatedAuthRequest } from "@/features/auth";
import { apiRequest } from "@/services/apiRequest";

import {
  companyQuotaSummarySchema,
  ownQuotaSchema,
  quotaAllocationSchema,
  setMemberQuotaRequestSchema,
  type CompanyQuotaSummary,
  type OwnQuota,
  type QuotaAllocation,
} from "../schemas/companyQuotaSchemas";

const COMPANY_QUOTA_URL = "/api/v1/companies/me/quota";
const OWN_COMPANY_QUOTA_URL = "/api/v1/companies/me/quota/me";
const COMPANY_SEATS_API_PREFIX = "/api/v1/companies/me/seats";

function bearerHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

function memberQuotaPath(membershipId: string): string {
  return `${COMPANY_SEATS_API_PREFIX}/${encodeURIComponent(membershipId)}/quota`;
}

export function getCompanyQuota(
  signal?: AbortSignal,
): Promise<CompanyQuotaSummary> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(COMPANY_QUOTA_URL, {
        headers: bearerHeaders(accessToken),
        schema: companyQuotaSummarySchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function getOwnCompanyQuota(signal?: AbortSignal): Promise<OwnQuota> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(OWN_COMPANY_QUOTA_URL, {
        headers: bearerHeaders(accessToken),
        schema: ownQuotaSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function setMemberQuota(
  membershipId: string,
  quotaTotal: number,
  signal?: AbortSignal,
): Promise<QuotaAllocation> {
  const body = setMemberQuotaRequestSchema.parse({ quota_total: quotaTotal });

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(memberQuotaPath(membershipId), {
        method: "PUT",
        headers: bearerHeaders(accessToken),
        body,
        schema: quotaAllocationSchema,
        signal: requestSignal,
      }),
    signal,
  );
}
