import { authenticatedAuthRequest } from "@/features/auth";
import { apiRequest } from "@/services/apiRequest";

import {
  checkoutRequestSchema,
  checkoutResponseSchema,
  downgradeResponseSchema,
  portalResponseSchema,
  subscriptionOverviewSchema,
  upgradeRequestSchema,
  upgradeResponseSchema,
  type CheckoutRequest,
  type CheckoutResponse,
  type DowngradeResponse,
  type PortalResponse,
  type SubscriptionOverview,
  type UpgradeRequest,
  type UpgradeResponse,
} from "../schemas/billingSchemas";

const SUBSCRIPTION_ME_URL = "/api/v1/subscriptions/me";
const SUBSCRIPTION_CHECKOUT_URL = "/api/v1/subscriptions/checkout";
const SUBSCRIPTION_PORTAL_URL = "/api/v1/subscriptions/portal";
const SUBSCRIPTION_UPGRADE_URL = "/api/v1/subscriptions/upgrade";
const SUBSCRIPTION_DOWNGRADE_URL = "/api/v1/subscriptions/downgrade";
const SUBSCRIPTION_DOWNGRADE_CANCEL_URL =
  "/api/v1/subscriptions/downgrade/cancel";

function bearerHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export function getSubscriptionOverview(
  signal?: AbortSignal,
): Promise<SubscriptionOverview> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(SUBSCRIPTION_ME_URL, {
        headers: bearerHeaders(accessToken),
        schema: subscriptionOverviewSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function createSubscriptionCheckout(
  input: CheckoutRequest,
  signal?: AbortSignal,
): Promise<CheckoutResponse> {
  const body = checkoutRequestSchema.parse(input);

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(SUBSCRIPTION_CHECKOUT_URL, {
        method: "POST",
        headers: bearerHeaders(accessToken),
        body,
        schema: checkoutResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function createBillingPortalSession(
  signal?: AbortSignal,
): Promise<PortalResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(SUBSCRIPTION_PORTAL_URL, {
        method: "POST",
        headers: bearerHeaders(accessToken),
        schema: portalResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function upgradeSubscription(
  input: UpgradeRequest,
  signal?: AbortSignal,
): Promise<UpgradeResponse> {
  const body = upgradeRequestSchema.parse(input);

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(SUBSCRIPTION_UPGRADE_URL, {
        method: "POST",
        headers: bearerHeaders(accessToken),
        body,
        schema: upgradeResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function scheduleEnterpriseDowngrade(
  signal?: AbortSignal,
): Promise<DowngradeResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(SUBSCRIPTION_DOWNGRADE_URL, {
        method: "POST",
        headers: bearerHeaders(accessToken),
        schema: downgradeResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function cancelEnterpriseDowngrade(
  signal?: AbortSignal,
): Promise<DowngradeResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(SUBSCRIPTION_DOWNGRADE_CANCEL_URL, {
        method: "POST",
        headers: bearerHeaders(accessToken),
        schema: downgradeResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}
