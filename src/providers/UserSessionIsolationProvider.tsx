"use client";

import { clearReportSession } from "@/features/report-generation";
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

      const userChanged =
        prevUserId !== null &&
        confirmedUserId !== null &&
        prevUserId !== confirmedUserId;

      if (becameUnauthenticated || userChanged) {
        void clearReportSession(queryClient);
      }

      prevStatusRef.current = status;
      prevUserIdRef.current = confirmedUserId;
    });
  }, [queryClient]);

  return children;
}
