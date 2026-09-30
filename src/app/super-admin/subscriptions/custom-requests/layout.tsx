"use client";

import { AuthenticatedBoundary } from "@/features/auth";
import type { ReactNode } from "react";

export default function CustomRequestsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthenticatedBoundary requiredPermission="admin:subscriptions_manage">
      {children}
    </AuthenticatedBoundary>
  );
}
