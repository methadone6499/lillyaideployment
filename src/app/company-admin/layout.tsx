"use client";

import { AuthenticatedBoundary } from "@/features/auth";
import type { ReactNode } from "react";

export default function CompanyAdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedBoundary requiredPermission="company:members_read">
      {children}
    </AuthenticatedBoundary>
  );
}
