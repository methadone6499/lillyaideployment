import {
  contextTypeSchema,
  effectiveRoleSchema,
  globalRoleSchema,
  userStatusSchema,
  type UserStatus,
} from "@/features/auth";
import { z } from "zod";

export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const membershipStatusSchema = z.enum([
  "active",
  "disabled",
  "removed",
]);

export const adminUserAccessSchema = z.object({
  context_type: contextTypeSchema,
  effective_role: effectiveRoleSchema,
  company_id: z.string().nullish(),
  company_name: z.string().nullish(),
  membership_id: z.string().nullish(),
  membership_status: membershipStatusSchema.nullish(),
});

export const adminUserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string(),
  institution_name: z.string().nullish(),
  status: userStatusSchema,
  email_verified: z.boolean(),
  global_role: globalRoleSchema.nullish(),
  last_login_at: isoDateTimeSchema.nullish(),
  created_at: isoDateTimeSchema,
  access: adminUserAccessSchema,
});

export const adminUserListResponseSchema = z.object({
  items: z.array(adminUserResponseSchema),
  next_cursor: z.string().nullish(),
});

export type MembershipStatus = z.infer<typeof membershipStatusSchema>;
export type AdminUserAccess = z.infer<typeof adminUserAccessSchema>;
export type AdminUserResponse = z.infer<typeof adminUserResponseSchema>;
export type AdminUserListResponse = z.infer<
  typeof adminUserListResponseSchema
>;

export type ListAdminUsersParams = {
  limit?: number;
  cursor?: string | null;
  search?: string;
  status?: UserStatus;
};
