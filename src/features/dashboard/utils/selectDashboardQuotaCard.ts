import type { BillingQuotaView, ReportQuotaSource } from "@/features/billing";
import type { OwnQuota } from "@/features/company-quota";
import type { DashboardQuotaView } from "../types";

export function selectDashboardQuotaCard(input: {
  source: ReportQuotaSource;
  billingQuotaView: BillingQuotaView | null;
  overviewPending: boolean;
  overviewErrorMessage: string | null;
  ownQuota: OwnQuota | undefined;
  ownQuotaPending: boolean;
  ownQuotaErrorMessage: string | null;
}): {
  view: DashboardQuotaView;
  errorMessage: string | null;
} {
  if (input.source === "unlimited") {
    return { view: { kind: "unlimited" }, errorMessage: null };
  }

  if (input.source === "company_allocation") {
    if (input.ownQuotaPending && !input.ownQuota) {
      return { view: { kind: "loading" }, errorMessage: null };
    }

    if (input.ownQuotaErrorMessage) {
      return {
        view: { kind: "unavailable" },
        errorMessage: input.ownQuotaErrorMessage,
      };
    }

    if (!input.ownQuota) {
      return { view: { kind: "unavailable" }, errorMessage: null };
    }

    return {
      view: {
        kind: "known",
        used: input.ownQuota.quota_used,
        total: input.ownQuota.quota_total,
        remaining: input.ownQuota.quota_remaining,
      },
      errorMessage: null,
    };
  }

  if (input.overviewPending && !input.billingQuotaView) {
    return { view: { kind: "loading" }, errorMessage: null };
  }

  if (input.overviewErrorMessage && !input.billingQuotaView) {
    return {
      view: { kind: "unavailable" },
      errorMessage: input.overviewErrorMessage,
    };
  }

  if (!input.billingQuotaView || input.billingQuotaView.kind === "unavailable") {
    return { view: { kind: "unavailable" }, errorMessage: null };
  }

  if (input.billingQuotaView.kind === "unlimited") {
    return { view: { kind: "unlimited" }, errorMessage: null };
  }

  return {
    view: {
      kind: "known",
      used: input.billingQuotaView.quota.quota_used,
      total: input.billingQuotaView.quota.quota_total,
      remaining: input.billingQuotaView.quota.quota_remaining,
    },
    errorMessage: null,
  };
}
