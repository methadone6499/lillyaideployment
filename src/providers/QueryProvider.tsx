"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { TopUpForfeitureConfirmation, TopUpSessionIsolation } from "@/features/billing";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}><TopUpSessionIsolation />{children}<TopUpForfeitureConfirmation /></QueryClientProvider>
  );
}
