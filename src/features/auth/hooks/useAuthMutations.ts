"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  forgotPassword,
  login,
  resendVerification,
  resetPassword,
  signup,
  verifyEmail,
} from "../api/authApi";
import { performLogout } from "../session/authSession";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
  SignupRequest,
  VerifyEmailRequest,
} from "../schemas/authSchemas";

export function useSignupMutation() {
  return useMutation({
    mutationFn: (input: SignupRequest) => signup(input),
  });
}

export function useSigninMutation() {
  return useMutation({
    mutationFn: (input: LoginRequest) => login(input),
  });
}

export function useResendVerificationMutation() {
  return useMutation({
    mutationFn: (input: ResendVerificationRequest) => resendVerification(input),
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (input: ForgotPasswordRequest) => forgotPassword(input),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (input: ResetPasswordRequest) => resetPassword(input),
  });
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: (input: VerifyEmailRequest) => verifyEmail(input),
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => performLogout(queryClient),
  });
}
