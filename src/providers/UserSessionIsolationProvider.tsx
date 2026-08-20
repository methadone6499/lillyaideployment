"use client";

import { clearCompanyInvitationSession } from "@/features/company-invitations";
import { clearCompanyQuotaSession } from "@/features/company-quota";
import { clearEnterpriseActivationSession } from "@/features/enterprise-activation";
import { clearReportGenerationSession } from "@/features/report-generation";
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
        void clearReportGenerationSession(queryClient);
        void clearPlatformReportSession(queryClient);
        void clearEnterpriseActivationSession(queryClient);
        void clearCompanySeatSession(queryClient);
        void clearCompanyInvitationSession(queryClient);
        void clearCompanyQuotaSession(queryClient);
      } else if (becameAuthenticated) {
        void syncPendingPlatformSavesWithAuthSession(queryClient);
      }

      prevStatusRef.current = status;
      prevUserIdRef.current = confirmedUserId;
    });
  }, [queryClient]);

  return children;
}
