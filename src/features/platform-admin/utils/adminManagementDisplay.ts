import type { EffectiveRole, UserStatus } from "@/features/auth";
import type { PlanType, SubscriptionStatus } from "@/features/billing";

import type {
  AdminCompanyMemberRole,
} from "../schemas/adminCompanyMemberSchemas";
import type {
  CompanyStatus,
  CompanyType,
} from "../schemas/adminCompanySchemas";
import type { MembershipStatus } from "../schemas/adminUserSchemas";

export const EFFECTIVE_ROLE_LABELS: Record<EffectiveRole, string> = {
  standard_user: "Standard User",
  company_admin: "Company Admin",
  company_seat_user: "Seat User",
  reviewer: "Reviewer",
  super_admin: "Super Admin",
};

export const MEMBER_ROLE_LABELS: Record<AdminCompanyMemberRole, string> = {
  company_admin: "Company Admin",
  company_seat_user: "Seat User",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  pending_verification: "Pending Verification",
  active: "Active",
  disabled: "Disabled",
};

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "Active",
  disabled: "Disabled",
  removed: "Removed",
};

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  disabled: "Disabled",
};

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  enterprise: "Enterprise",
  custom: "Custom",
};

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  standard: "Standard",
  enterprise: "Enterprise",
  custom: "Custom",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: "Trialing",
  active: "Active",
  past_due: "Past Due",
  cancelled: "Cancelled",
  expired: "Expired",
  suspended: "Suspended",
  inactive: "Inactive",
};

export function statusPillClass(status: string): string {
  if (status === "active") {
    return "bg-[rgba(16,185,129,0.12)] text-status-success";
  }

  if (status === "trialing" || status === "pending_verification") {
    return "bg-[rgba(0,101,248,0.12)] text-[#62a0ff]";
  }

  if (status === "past_due" || status === "suspended") {
    return "bg-[rgba(255,200,92,0.12)] text-status-running";
  }

  if (status === "disabled") {
    return "bg-[rgba(217,34,68,0.12)] text-[#f0627d]";
  }

  return "bg-white/10 text-text-muted";
}

export function formatAdminDateTime(value: string | null | undefined): string {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}
