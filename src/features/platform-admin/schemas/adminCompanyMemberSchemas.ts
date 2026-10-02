import { userStatusSchema, type UserStatus } from "@/features/auth";
import { z } from "zod";

import {
  isoDateTimeSchema,
  membershipStatusSchema,
  type MembershipStatus,
} from "./adminUserSchemas";

export const adminCompanyMemberRoleSchema = z.enum([
  "company_admin",
  "company_seat_user",
]);

export const adminCompanyMemberSchema = z.object({
  membership_id: z.string(),
  user_id: z.string(),
  full_name: z.string(),
  email: z.string(),
  user_status: userStatusSchema,
  email_verified: z.boolean(),
  role: adminCompanyMemberRoleSchema,
  membership_status: membershipStatusSchema,
  occupies_seat: z.boolean(),
  activated_at: isoDateTimeSchema,
  disabled_at: isoDateTimeSchema.nullable(),
  disabled_by_user_id: z.string().nullable(),
  removed_at: isoDateTimeSchema.nullable(),
  removed_by_user_id: z.string().nullable(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const adminCompanyMemberListResponseSchema = z.object({
  company_id: z.string(),
  items: z.array(adminCompanyMemberSchema),
  next_cursor: z.string().nullable(),
});

export type AdminCompanyMemberRole = z.infer<
  typeof adminCompanyMemberRoleSchema
>;
export type AdminCompanyMember = z.infer<typeof adminCompanyMemberSchema>;
export type AdminCompanyMemberListResponse = z.infer<
  typeof adminCompanyMemberListResponseSchema
>;

export type ListAdminCompanyMembersParams = {
  limit?: number;
  cursor?: string | null;
  search?: string;
  status?: MembershipStatus;
  role?: AdminCompanyMemberRole;
  userStatus?: UserStatus;
};
