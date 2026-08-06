"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import {
  createBootstrapAuthSessionQueryOptions,
  setAuthQueryClient,
} from "../session/authSession";

export function useBootstrapAuthSession() {
  const queryClient = useQueryClient();

  useEffect(() => {
    setAuthQueryClient(queryClient);
  }, [queryClient]);

  return useQuery(createBootstrapAuthSessionQueryOptions(queryClient));
}
