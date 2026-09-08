import { AuthenticatedBoundary } from "@/features/auth";
import type { ReactNode } from "react";

export default function BillingLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedBoundary>{children}</AuthenticatedBoundary>;
}

