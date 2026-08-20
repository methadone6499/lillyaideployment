import { z } from "zod";

export const userStatusSchema = z.enum([
  "pending_verification",
  "active",
  "disabled",
]);

export const globalRoleSchema = z.enum(["super_admin"]);

export const contextTypeSchema = z.enum(["personal", "company", "global"]);

export const effectiveRoleSchema = z.enum([
  "standard_user",
  "company_admin",
  "company_seat_user",
  "super_admin",
]);

export const permissionSchema = z.enum([
  "account:read",
  "account:update",
  "admin:companies_read",
  "admin:reports_read",
  "admin:users_read",
  "company:read",
  "company:billing_read",
  "company:members_read",
  "company:members_manage",
  "company:quota_read",
  "company:quota_read_own",
  "company:quota_manage",
  "report:create",
  "report:read_company",
  "report:read_own",
  "settings:read",
  "settings:update",
  "notification:read",
]);

export const signupRequestSchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  institution_name: z.string().trim().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(12).max(128),
});

export const signupResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string(),
  institution_name: z.string(),
  status: userStatusSchema,
  email_verified: z.boolean(),
  created_at: z.string(),
});

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string().default("bearer"),
  expires_in: z.number().int().min(1),
});

export const verifyEmailRequestSchema = z.object({
  token: z.string().min(1),
});

export const resendVerificationRequestSchema = z.object({
  email: z.string().email(),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(12).max(128),
});

export const messageResponseSchema = z.object({
  message: z.string(),
});

export const publicUserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string(),
  institution_name: z.string().nullable().optional(),
  status: userStatusSchema,
  email_verified: z.boolean().default(false),
  email_verified_at: z.string().nullable().optional(),
  global_role: globalRoleSchema.nullable().optional(),
  last_login_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const contextResponseSchema = z.object({
  type: contextTypeSchema,
  role: effectiveRoleSchema,
  company_id: z.string().nullish(),
  membership_id: z.string().nullish(),
});

export const authMeResponseSchema = z.object({
  user: publicUserResponseSchema,
  active_context: contextResponseSchema,
  available_contexts: z.array(contextResponseSchema),
  permissions: z.array(permissionSchema),
  entitlement_summary: z.record(z.string(), z.unknown()).nullable().optional(),
  quota_summary: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const signinRequestSchema = loginRequestSchema;
export const signinResponseSchema = tokenResponseSchema;
export const meResponseSchema = authMeResponseSchema;

export type UserStatus = z.infer<typeof userStatusSchema>;
export type GlobalRole = z.infer<typeof globalRoleSchema>;
export type ContextType = z.infer<typeof contextTypeSchema>;
export type EffectiveRole = z.infer<typeof effectiveRoleSchema>;
export type Permission = z.infer<typeof permissionSchema>;
export type SignupRequest = z.infer<typeof signupRequestSchema>;
export type SignupResponse = z.infer<typeof signupResponseSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type TokenResponse = z.infer<typeof tokenResponseSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;
export type ResendVerificationRequest = z.infer<
  typeof resendVerificationRequestSchema
>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type MessageResponse = z.infer<typeof messageResponseSchema>;
export type PublicUserResponse = z.infer<typeof publicUserResponseSchema>;
export type ContextResponse = z.infer<typeof contextResponseSchema>;
export type AuthMeResponse = z.infer<typeof authMeResponseSchema>;
export type SigninRequest = LoginRequest;
export type SigninResponse = TokenResponse;
export type MeResponse = AuthMeResponse;
