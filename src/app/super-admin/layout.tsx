"use client";

import { AuthenticatedBoundary } from "@/features/auth";
import type { ReactNode } from "react";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedBoundary requiredPermission="admin:reports_read">
      {children}
    </AuthenticatedBoundary>
  );
}
