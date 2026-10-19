"use client";

import { useAuthStore, type AuthStatus } from "@/store/useAuthStore";

export function useAuthStatus(): AuthStatus {
  return useAuthStore((state) => state.status);
}

export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.status === "authenticated" && state.companyAccess === "available");
}

export function useIsAuthInitializing(): boolean {
  return useAuthStore((state) => state.status === "initializing");
}

export function useConfirmedUserId(): string | null {
  return useAuthStore((state) => state.confirmedUserId);
}
