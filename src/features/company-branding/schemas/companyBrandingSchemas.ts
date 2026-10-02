import { z } from "zod";

export const MAX_COMPANY_LOGO_BYTES = 10 * 1024 * 1024;

export const companyLogoMetadataSchema = z.object({
  content_type: z.literal("image/png"),
  size_bytes: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  checksum_sha256: z.string().regex(/^[a-f0-9]{64}$/i),
  version: z.number().int().positive(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const companyLogoResponseSchema = z.object({
  logo: companyLogoMetadataSchema.nullable(),
});

export type CompanyLogoMetadata = z.infer<
  typeof companyLogoMetadataSchema
>;
export type CompanyLogoResponse = z.infer<typeof companyLogoResponseSchema>;
