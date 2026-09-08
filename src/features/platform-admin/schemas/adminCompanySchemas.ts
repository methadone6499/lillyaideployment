import {
  billingIntervalSchema,
  planTypeSchema,
  subscriptionLimitsSnapshotSchema,
  subscriptionStatusSchema,
  type SubscriptionStatus,
} from "@/features/enterprise-activation";
import { z } from "zod";

const isoDateTimeSchema = z.string().datetime({ offset: true });

export const companyTypeSchema = z.enum(["enterprise", "custom"]);

export const companyStatusSchema = z.enum([
  "active",
  "suspended",
  "disabled",
]);

export const adminCompanyPrimaryAdminSchema = z.object({
  user_id: z.string(),
  full_name: z.string(),
  email: z.string(),
});

export const adminCompanySubscriptionSchema = z.object({
  id: z.string(),
  plan_type: planTypeSchema,
  status: subscriptionStatusSchema,
  amount_minor: z.number().int().nonnegative(),
  currency: z.string().length(3),
  billing_interval: billingIntervalSchema,
  current_period_start: isoDateTimeSchema,
  current_period_end: isoDateTimeSchema,
  limits: subscriptionLimitsSnapshotSchema,
});

export const adminCompanySeatSummarySchema = z.object({
  limit: z.number().int().nonnegative(),
  occupied: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  disabled: z.number().int().nonnegative(),
  pending_invitations: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
});

export const adminCompanyQuotaSchema = z.object({
  total: z.number().int().nonnegative(),
  allocated: z.number().int().nonnegative(),
  unallocated: z.number().int().nonnegative(),
  used: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
});

export const adminCompanyResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: companyTypeSchema,
  status: companyStatusSchema,
  billing_email: z.string(),
  primary_admin: adminCompanyPrimaryAdminSchema.nullish(),
  subscription: adminCompanySubscriptionSchema.nullish(),
  seats: adminCompanySeatSummarySchema,
  quota: adminCompanyQuotaSchema.nullish(),
  created_at: isoDateTimeSchema,
});

export const adminCompanyListResponseSchema = z.object({
  items: z.array(adminCompanyResponseSchema),
  next_cursor: z.string().nullish(),
});

export type CompanyType = z.infer<typeof companyTypeSchema>;
export type CompanyStatus = z.infer<typeof companyStatusSchema>;
export type AdminCompanyPrimaryAdmin = z.infer<
  typeof adminCompanyPrimaryAdminSchema
>;
export type AdminCompanySubscription = z.infer<
  typeof adminCompanySubscriptionSchema
>;
export type AdminCompanySeatSummary = z.infer<
  typeof adminCompanySeatSummarySchema
>;
export type AdminCompanyQuota = z.infer<typeof adminCompanyQuotaSchema>;
export type AdminCompanyResponse = z.infer<typeof adminCompanyResponseSchema>;
export type AdminCompanyListResponse = z.infer<
  typeof adminCompanyListResponseSchema
>;

export type ListAdminCompaniesParams = {
  limit?: number;
  cursor?: string | null;
  search?: string;
  subscriptionStatus?: SubscriptionStatus;
};
