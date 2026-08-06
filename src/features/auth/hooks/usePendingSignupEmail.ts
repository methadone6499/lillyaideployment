"use client";

import { useSyncExternalStore } from "react";

import { readPendingSignupEmail } from "../utils/pendingSignupEmail";

function subscribeToPendingSignupEmail(): () => void {
  return () => {};
}

function getPendingSignupEmailSnapshot(): string {
  return readPendingSignupEmail() ?? "";
}

function getPendingSignupEmailServerSnapshot(): string {
  return "";
}

export function usePendingSignupEmail(): string {
  return useSyncExternalStore(
    subscribeToPendingSignupEmail,
    getPendingSignupEmailSnapshot,
    getPendingSignupEmailServerSnapshot,
  );
}
