"use client";

import { setAuthToken, setAuthUserId } from "@/lib/authToken";
import { useMutation } from "@tanstack/react-query";
import { signin, signup } from "../api/authApi";
import type { SigninRequest, SignupRequest } from "../schemas/authSchemas";

export function useSignupMutation() {
  return useMutation({
    mutationFn: (input: SignupRequest) => signup(input),
  });
}

export function useSigninMutation() {
  return useMutation({
    mutationFn: (input: SigninRequest) => signin(input),
    onSuccess: (data) => {
      setAuthToken(data.access_token);
      setAuthUserId(data.user_id);
    },
  });
}
