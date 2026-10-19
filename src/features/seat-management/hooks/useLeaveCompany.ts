"use client";
import { useIsMutating, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { leaveCompany } from "../api/companySeatApi";
const key = ["company-membership", "leave"] as const;
let leaving = false;
export function useLeaveCompany() {
  const count = useIsMutating({ mutationKey: key });
  const mutation = useMutation({
    mutationKey: key, retry: false,
    mutationFn: async () => {
      if (leaving)
        throw new Error("A company departure is already in progress.");
      const generation = useAuthStore.getState().sessionGeneration;
      leaving = true;
      try {
        await leaveCompany();
        return generation;
      }
      finally {
        leaving = false;
      }
    },
    onSuccess: (generation) => {
      useAuthStore.getState().setCompanyAccess(generation, "transitioning");
    },
  });
  return { ...mutation, isLeaving: mutation.isPending || count > 0 };
}
