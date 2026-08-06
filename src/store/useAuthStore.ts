"use client";

import { create } from "zustand";

export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

type TokenPayload = {
  access_token: string;
  expires_in: number;
};

type AuthStoreState = {
  status: AuthStatus;
  accessToken: string | null;
  expiresAt: number | null;
  confirmedUserId: string | null;
  sessionGeneration: number;
};

type AuthStoreActions = {
  beginInitializing: () => void;
  incrementSessionGeneration: () => number;
  isGenerationCurrent: (generation: number) => boolean;
  establishToken: (generation: number, token: TokenPayload) => boolean;
  confirmUserId: (generation: number, userId: string) => boolean;
  terminalClear: (generation: number) => boolean;
  beginNewAuthSession: () => number;
};

export type AuthStore = AuthStoreState & AuthStoreActions;

const clearedSessionState = {
  status: "unauthenticated" as const,
  accessToken: null,
  expiresAt: null,
  confirmedUserId: null,
};

const initialState: AuthStoreState = {
  ...clearedSessionState,
  sessionGeneration: 0,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,

  beginInitializing: () => {
    set({ status: "initializing" });
  },

  incrementSessionGeneration: () => {
    const nextGeneration = get().sessionGeneration + 1;
    set({ sessionGeneration: nextGeneration });
    return nextGeneration;
  },

  isGenerationCurrent: (generation) => get().sessionGeneration === generation,

  establishToken: (generation, token) => {
    if (!get().isGenerationCurrent(generation)) {
      return false;
    }

    set({
      accessToken: token.access_token,
      expiresAt: Date.now() + token.expires_in * 1000,
    });

    return true;
  },

  confirmUserId: (generation, userId) => {
    if (!get().isGenerationCurrent(generation)) {
      return false;
    }

    set({
      status: "authenticated",
      confirmedUserId: userId,
    });

    return true;
  },

  terminalClear: (generation) => {
    if (!get().isGenerationCurrent(generation)) {
      return false;
    }

    set({
      ...clearedSessionState,
      sessionGeneration: generation + 1,
    });

    return true;
  },

  beginNewAuthSession: () => {
    const nextGeneration = get().sessionGeneration + 1;

    set({
      ...clearedSessionState,
      sessionGeneration: nextGeneration,
    });

    return nextGeneration;
  },
}));
