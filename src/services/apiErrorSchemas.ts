import { z } from "zod";

export const validationErrorItemSchema = z.object({
  loc: z.array(z.union([z.string(), z.number()])),
  msg: z.string(),
  type: z.string(),
  input: z.unknown().optional(),
  ctx: z.record(z.string(), z.unknown()).optional(),
});

export const httpValidationErrorSchema = z.object({
  detail: z.array(validationErrorItemSchema),
});

export const platformErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().nullable().optional(),
  request_id: z.string().nullable().optional(),
});

export type ValidationErrorItem = z.infer<typeof validationErrorItemSchema>;
export type HttpValidationError = z.infer<typeof httpValidationErrorSchema>;
export type PlatformError = z.infer<typeof platformErrorSchema>;
