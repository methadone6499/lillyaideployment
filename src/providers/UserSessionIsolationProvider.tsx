"use client";

import { clearBillingSession } from "@/features/billing";
import { clearCompanyBrandingSession } from "@/features/company-branding";
import { clearCompanyInvitationSession } from "@/features/company-invitations";
import { clearCompanyQuotaSession } from "@/features/company-quota";
import { clearCustomSubscriptionSession } from "@/features/custom-subscriptions";
import { clearDosageCalculatorSession } from "@/features/dosage-calculator";
import { clearReportGenerationSession } from "@/features/report-generation";
import { clearReviewerSession } from "@/features/reviewer";
import {
  clearPlatformReportSession,
  syncPendingPlatformSavesWithAuthSession,
} from "@/features/reports";
import { clearCompanySeatSession } from "@/features/seat-management";
import { useAuthStore } from "@/store/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, type ReactNode } from "react";

type UserSessionIsolationProviderProps = {
  children: ReactNode;
};

export function UserSessionIsolationProvider({
  children,
}: UserSessionIsolationProviderProps) {
  const queryClient = useQueryClient();
  const prevStatusRef = useRef(useAuthStore.getState().status);
  const prevUserIdRef = useRef(useAuthStore.getState().confirmedUserId);

  useEffect(() => {
    return useAuthStore.subscribe((state) => {
      const prevStatus = prevStatusRef.current;
      const prevUserId = prevUserIdRef.current;
      const { status, confirmedUserId } = state;

      const becameUnauthenticated =
        prevStatus === "authenticated" && status === "unauthenticated";

      const becameAuthenticated =
        prevStatus !== "authenticated" &&
        status === "authenticated" &&
        confirmedUserId !== null;

      const userChanged =
        prevUserId !== null &&
        confirmedUserId !== null &&
        prevUserId !== confirmedUserId;

      if (becameUnauthenticated || userChanged) {
        // Cross-feature orchestration: each feature clears only its own session.
        void clearBillingSession(queryClient);
        void clearReportGenerationSession(queryClient);
        void clearPlatformReportSession(queryClient);
        void clearCompanyBrandingSession(queryClient);
        void clearCompanySeatSession(queryClient);
        void clearCompanyInvitationSession(queryClient);
        void clearCompanyQuotaSession(queryClient);
        void clearCustomSubscriptionSession(queryClient);
        void clearDosageCalculatorSession(queryClient);
        void clearReviewerSession(queryClient);
      } else if (becameAuthenticated) {
        void syncPendingPlatformSavesWithAuthSession(queryClient);
      }

      prevStatusRef.current = status;
      prevUserIdRef.current = confirmedUserId;
    });
  }, [queryClient]);

  return children;
}
