"use client";

import type { ReactNode } from "react";

import { useBootstrapAuthSession } from "../hooks/useBootstrapAuthSession";

type AuthSessionProviderProps = {
  children: ReactNode;
};

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  useBootstrapAuthSession();

  return children;
}
