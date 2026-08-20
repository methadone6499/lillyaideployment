import { z } from "zod";

export const companyRoleSchema = z.enum([
  "company_admin",
  "company_seat_user",
]);

export const membershipStatusSchema = z.enum([
  "active",
  "disabled",
  "removed",
]);

export const seatStatusSchema = z.enum(["active", "disabled"]);

export const subscriptionStatusSchema = z.enum([
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "expired",
  "suspended",
  "inactive",
]);

export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const seatSummarySchema = z.object({
  total_seats: z.number().int().min(1),
  occupied_membership_seats: z.number().int().nonnegative(),
  pending_invitation_seats: z.number().int().nonnegative(),
  occupied_seats: z.number().int().nonnegative(),
  available_seats: z.number().int().nonnegative(),
  active_seats: z.number().int().nonnegative(),
  disabled_seats: z.number().int().nonnegative(),
  subscription_status: subscriptionStatusSchema,
});

export const seatSchema = z.object({
  membership_id: z.string(),
  user_id: z.string(),
  full_name: z.string(),
  email: z.string().email(),
  role: companyRoleSchema,
  status: membershipStatusSchema,
  occupies_seat: z.boolean(),
  invited_by_user_id: z.string().nullish(),
  activated_at: isoDateTimeSchema,
  disabled_at: isoDateTimeSchema.nullish(),
  disabled_by_user_id: z.string().nullish(),
  removed_at: isoDateTimeSchema.nullish(),
  removed_by_user_id: z.string().nullish(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
  can_manage: z.boolean(),
  report_quota_total: z.number().int().nonnegative(),
  report_quota_used: z.number().int().nonnegative(),
  report_quota_remaining: z.number().int().nonnegative(),
  can_manage_status: z.boolean(),
  can_manage_quota: z.boolean(),
});

export const seatListResponseSchema = z.object({
  summary: seatSummarySchema,
  items: z.array(seatSchema),
  next_cursor: z.string().nullish(),
});

const seatEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.");

export const addSeatFormSchema = z
  .object({
    userEmail: seatEmailSchema,
  })
  .strict();

export const editSeatFormSchema = z
  .object({
    status: seatStatusSchema,
    quota_total: z.number().int().nonnegative(),
  })
  .strict();

export type CompanyRole = z.infer<typeof companyRoleSchema>;
export type MembershipStatus = z.infer<typeof membershipStatusSchema>;
export type SeatStatus = z.infer<typeof seatStatusSchema>;
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
export type SeatSummary = z.infer<typeof seatSummarySchema>;
export type Seat = z.infer<typeof seatSchema>;
export type SeatListResponse = z.infer<typeof seatListResponseSchema>;
export type AddSeatFormValues = z.infer<typeof addSeatFormSchema>;
export type EditSeatFormValues = z.infer<typeof editSeatFormSchema>;

export type ListCompanySeatsParams = {
  status?: MembershipStatus;
  role?: CompanyRole;
  search?: string;
  limit?: number;
  cursor?: string | null;
};
