import { AuthenticatedBoundary } from "@/features/auth";
import type { ReactNode } from "react";

export default function SubscriptionOnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthenticatedBoundary>{children}</AuthenticatedBoundary>;
}
