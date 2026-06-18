import { z } from "zod";

export const signupRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string(),
  institution: z.string(),
});

export const signupResponseSchema = z.object({
  user_id: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  institution: z.string(),
  role: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
});

export const signinRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signinResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  user_id: z.string(),
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;
export type SignupResponse = z.infer<typeof signupResponseSchema>;
export type SigninRequest = z.infer<typeof signinRequestSchema>;
export type SigninResponse = z.infer<typeof signinResponseSchema>;
