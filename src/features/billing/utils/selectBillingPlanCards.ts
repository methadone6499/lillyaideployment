import type { PlanType, SubscriptionOverview } from "../schemas/billingSchemas";
import {
  formatAmountMinor,
  formatBillingIntervalSuffix,
  formatLocalDate,
} from "./formatBilling";
import {
  hasScheduledEnterpriseDowngrade,
  type BillingOwnerCapabilities,
} from "./selectBillingCapabilities";

export type BillingPlanCardAction =
  | "none"
  | "subscribe"
  | "upgrade"
  | "portal"
  | "custom"
  | "downgrade";

export type BillingPlanCardModel = {
  id: PlanType;
  name: string;
  audience: string;
  allowance: string;
  priceLabel: string;
  priceSuffix: string | null;
  features: readonly string[];
  current: boolean;
  action: BillingPlanCardAction;
  ctaLabel: string;
  disabled: boolean;
  helper: string | null;
};

const PLAN_OPTIONS = [
  {
    id: "standard",
    name: "Standard",
    audience: "Small teams getting started",
    allowance: "30 reports / month · 1 seat",
    priceLabel: "£480",
    priceSuffix: "/mo",
    features: [
      "Free data sources (PubMed, Cochrane, FDA, EMA)",
      "AI summarization",
      "PDF & DOCX export",
      "Email support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    audience: "Most popular for HTA consultancies",
    allowance: "100 company reports / month · 10 seats",
    priceLabel: "£2,400",
    priceSuffix: "/mo",
    features: [
      "All free + paid sources (Scopus, Embase, Clarivate)",
      "AI Clinical Intelligence Engine",
      "PDF, DOCX, PowerPoint + AI presenter",
      "Dosage calculator",
      "Multi-HTA compliance",
      "Priority support",
    ],
  },
  {
    id: "custom",
    name: "Custom",
    audience: "Large pharma & enterprise",
    allowance: "Custom quota",
    priceLabel: "Custom",
    priceSuffix: null,
    features: [
      "Everything in Enterprise",
      "Human-in-the-loop verification",
      "Dedicated reviewer pool",
      "Custom integrations & SSO",
      "On-prem deployment option",
      "Account manager + SLA",
    ],
  },
] as const;

type PlanActionState = Pick<BillingPlanCardModel, "action" | "ctaLabel" | "helper">;

function selectPlanAction(
  plan: PlanType,
  overview: SubscriptionOverview,
  capabilities: BillingOwnerCapabilities,
): PlanActionState {
  const subscription = overview.subscription;

  if (subscription?.plan_type === plan) {
    return { action: "none", ctaLabel: "Current Plan", helper: null };
  }

  if (plan === "custom") {
    if (!capabilities.canRequestCustom) {
      return {
        action: "none",
        ctaLabel: "Request Custom plan",
        helper: "Only the billing owner can request a Custom plan.",
      };
    }

    return {
      action: "custom",
      ctaLabel: overview.operation_lock
        ? "Manage Custom payment"
        : "Request Custom plan",
      helper: null,
    };
  }

  if (overview.operation_lock) {
    return {
      action: "none",
      ctaLabel: "Payment in progress",
      helper:
        "Finish or cancel your Custom plan payment before choosing another plan.",
    };
  }

  if (plan === "enterprise" && subscription?.plan_type === "custom") {
    if (hasScheduledEnterpriseDowngrade(overview)) {
      const effectiveAt = overview.plan_change?.effective_at;

      return {
        action: "none",
        ctaLabel: "Downgrade scheduled",
        helper: effectiveAt
          ? `Enterprise starts on ${formatLocalDate(effectiveAt)}.`
          : "Enterprise starts at your next renewal.",
      };
    }

    if (capabilities.canScheduleEnterpriseDowngrade) {
      return {
        action: "downgrade",
        ctaLabel: "Switch at renewal",
        helper: "Your Custom plan stays active until the current period ends.",
      };
    }
  }

  if (!subscription) {
    if (overview.checkout || overview.plan_change) {
      return {
        action: "none",
        ctaLabel: "Checkout in progress",
        helper:
          "Complete or resume your existing payment before choosing another plan.",
      };
    }

    return {
      action: "subscribe",
      ctaLabel: `Choose ${plan === "standard" ? "Standard" : "Enterprise"}`,
      helper: null,
    };
  }

  if (plan === "enterprise" && subscription.plan_type === "standard") {
    if (overview.plan_change) {
      return {
        action: "none",
        ctaLabel: "Upgrade pending",
        helper: "Your Enterprise upgrade is being confirmed.",
      };
    }

    if (capabilities.canUpgradeToEnterprise) {
      return {
        action: "upgrade",
        ctaLabel: "Upgrade to Enterprise",
        helper: null,
      };
    }

    if (capabilities.canOpenPortal) {
      return {
        action: "portal",
        ctaLabel: capabilities.requiresPortalBeforeUpgrade
          ? "Resume plan to upgrade"
          : "Manage billing",
        helper: capabilities.requiresPortalBeforeUpgrade
          ? "Resume your Standard subscription in the billing portal before upgrading."
          : "Review your Standard subscription in the billing portal before upgrading.",
      };
    }
  }

  return {
    action: "none",
    ctaLabel: plan === "standard" ? "Downgrade unavailable" : "Plan change unavailable",
    helper: "This plan change is not currently supported.",
  };
}

export function selectBillingPlanCards(
  overview: SubscriptionOverview,
  capabilities: BillingOwnerCapabilities,
  isBusy = false,
): BillingPlanCardModel[] {
  return PLAN_OPTIONS.map((plan) => {
    const current = overview.subscription?.plan_type === plan.id;
    const subscription = current ? overview.subscription : null;
    const action = selectPlanAction(plan.id, overview, capabilities);

    return {
      ...plan,
      priceLabel: subscription
        ? formatAmountMinor(subscription.amount_minor, subscription.currency)
        : plan.priceLabel,
      priceSuffix: subscription
        ? formatBillingIntervalSuffix(subscription.billing_interval)
        : plan.priceSuffix,
      allowance: subscription
        ? `${subscription.limits.reports} reports / period · ${subscription.limits.seats} ${subscription.limits.seats === 1 ? "seat" : "seats"}`
        : plan.allowance,
      ...action,
      current,
      disabled: isBusy || action.action === "none",
    };
  });
}
