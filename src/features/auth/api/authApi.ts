import { apiRequest } from "@/services/apiRequest";
import { ApiRequestError } from "@/services/ApiRequestError";

import {
  authMeResponseSchema,
  forgotPasswordRequestSchema,
  loginRequestSchema,
  messageResponseSchema,
  resendVerificationRequestSchema,
  resetPasswordRequestSchema,
  signupRequestSchema,
  signupResponseSchema,
  tokenResponseSchema,
  verifyEmailRequestSchema,
  type AuthMeResponse,
  type ForgotPasswordRequest,
  type LoginRequest,
  type MessageResponse,
  type ResendVerificationRequest,
  type ResetPasswordRequest,
  type SigninRequest,
  type SigninResponse,
  type SignupRequest,
  type SignupResponse,
  type TokenResponse,
  type VerifyEmailRequest,
} from "../schemas/authSchemas";

const AUTH_API_PREFIX = "/api/v1/auth";

function buildAuthUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  return `${AUTH_API_PREFIX}/${normalizedPath}`;
}

function bearerHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export { ApiRequestError as AuthApiError };

export function signup(input: SignupRequest): Promise<SignupResponse> {
  return apiRequest(buildAuthUrl("signup"), {
    method: "POST",
    body: signupRequestSchema.parse(input),
    schema: signupResponseSchema,
    credentials: "include",
  });
}

export function login(input: LoginRequest): Promise<TokenResponse> {
  return apiRequest(buildAuthUrl("login"), {
    method: "POST",
    body: loginRequestSchema.parse(input),
    schema: tokenResponseSchema,
    credentials: "include",
  });
}

export function signin(input: SigninRequest): Promise<SigninResponse> {
  return login(input);
}

export function refresh(signal?: AbortSignal): Promise<TokenResponse> {
  return apiRequest(buildAuthUrl("refresh"), {
    method: "POST",
    schema: tokenResponseSchema,
    credentials: "include",
    signal,
  });
}

export function logout(accessToken: string, signal?: AbortSignal): Promise<void> {
  return apiRequest(buildAuthUrl("logout"), {
    method: "POST",
    credentials: "include",
    headers: bearerHeaders(accessToken),
    expectEmpty: true,
    signal,
  });
}

export function verifyEmail(
  input: VerifyEmailRequest,
  signal?: AbortSignal,
): Promise<MessageResponse> {
  return apiRequest(buildAuthUrl("email/verify"), {
    method: "POST",
    body: verifyEmailRequestSchema.parse(input),
    schema: messageResponseSchema,
    credentials: "include",
    signal,
  });
}

export function resendVerification(
  input: ResendVerificationRequest,
  signal?: AbortSignal,
): Promise<MessageResponse> {
  return apiRequest(buildAuthUrl("email/resend-verification"), {
    method: "POST",
    body: resendVerificationRequestSchema.parse(input),
    schema: messageResponseSchema,
    credentials: "include",
    signal,
  });
}

export function forgotPassword(
  input: ForgotPasswordRequest,
  signal?: AbortSignal,
): Promise<MessageResponse> {
  return apiRequest(buildAuthUrl("password/forgot"), {
    method: "POST",
    body: forgotPasswordRequestSchema.parse(input),
    schema: messageResponseSchema,
    credentials: "include",
    signal,
  });
}

export function resetPassword(
  input: ResetPasswordRequest,
  signal?: AbortSignal,
): Promise<MessageResponse> {
  return apiRequest(buildAuthUrl("password/reset"), {
    method: "POST",
    body: resetPasswordRequestSchema.parse(input),
    schema: messageResponseSchema,
    credentials: "include",
    signal,
  });
}

export function getMe(
  accessToken: string,
  signal?: AbortSignal,
): Promise<AuthMeResponse> {
  return apiRequest(buildAuthUrl("me"), {
    schema: authMeResponseSchema,
    credentials: "include",
    headers: bearerHeaders(accessToken),
    signal,
  });
}
