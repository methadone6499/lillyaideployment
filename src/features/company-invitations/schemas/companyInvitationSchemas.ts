import { z } from "zod";

export const companyRoleSchema = z.enum([
  "company_admin",
  "company_seat_user",
]);

export const invitationStatusSchema = z.enum([
  "pending",
  "accepted",
  "revoked",
  "expired",
]);

export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const invitationAcceptanceModeSchema = z.enum([
  "login",
  "create_account",
]);

export const invitationTokenRequestSchema = z
  .object({
    token: z.string().min(1).max(512),
  })
  .strict();

export const registerInvitationRequestSchema = invitationTokenRequestSchema
  .extend({
    full_name: z.string().trim().min(1).max(200),
    password: z.string().min(12).max(128),
  })
  .strict();

export const createInvitationRequestSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email address."),
  })
  .strict();

export const invitationSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  email: z.string().email(),
  role: companyRoleSchema,
  status: invitationStatusSchema,
  invited_by_user_id: z.string(),
  expires_at: isoDateTimeSchema,
  last_sent_at: isoDateTimeSchema,
  accepted_by_user_id: z.string().nullish(),
  accepted_at: isoDateTimeSchema.nullish(),
  revoked_by_user_id: z.string().nullish(),
  revoked_at: isoDateTimeSchema.nullish(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const invitationListResponseSchema = z.object({
  items: z.array(invitationSchema),
  next_cursor: z.string().nullish(),
});

export const invitationPreviewSchema = z.object({
  company_name: z.string(),
  email_masked: z.string(),
  expires_at: isoDateTimeSchema,
  acceptance_mode: invitationAcceptanceModeSchema,
});

export const invitationAcceptanceSchema = z.object({
  invitation_id: z.string(),
  company_id: z.string(),
  membership_id: z.string(),
  user_id: z.string(),
  message: z.string(),
});

export type CompanyRole = z.infer<typeof companyRoleSchema>;
export type InvitationStatus = z.infer<typeof invitationStatusSchema>;
export type InvitationAcceptanceMode = z.infer<
  typeof invitationAcceptanceModeSchema
>;
export type InvitationTokenRequest = z.infer<typeof invitationTokenRequestSchema>;
export type RegisterInvitationRequest = z.infer<
  typeof registerInvitationRequestSchema
>;
export type CreateInvitationRequest = z.infer<
  typeof createInvitationRequestSchema
>;
export type Invitation = z.infer<typeof invitationSchema>;
export type InvitationListResponse = z.infer<
  typeof invitationListResponseSchema
>;
export type InvitationPreview = z.infer<typeof invitationPreviewSchema>;
export type InvitationAcceptance = z.infer<typeof invitationAcceptanceSchema>;

export type ListCompanyInvitationsParams = {
  status?: InvitationStatus;
  limit?: number;
  cursor?: string | null;
};
