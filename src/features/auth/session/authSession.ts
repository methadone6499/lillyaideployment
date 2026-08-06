import type { QueryClient } from "@tanstack/react-query";

import { ApiRequestError } from "@/services/ApiRequestError";
import { useAuthStore } from "@/store/useAuthStore";

import { getMe, logout, refresh } from "../api/authApi";
import { authQueryKeys } from "../api/authQueryKeys";
import type { AuthMeResponse, TokenResponse } from "../schemas/authSchemas";
import { EXPIRY_SAFETY_WINDOW_MS } from "./constants";
import {
  AuthSessionError,
  AuthSessionUnavailableError,
} from "./authSessionErrors";

let authQueryClient: QueryClient | null = null;
let bootstrapPromise: Promise<void> | null = null;
let refreshPromise: Promise<void> | null = null;

export function setAuthQueryClient(queryClient: QueryClient): void {
  authQueryClient = queryClient;
}

function requireAuthQueryClient(): QueryClient {
  if (!authQueryClient) {
    throw new Error("Auth query client has not been configured.");
  }

  return authQueryClient;
}

function cacheAuthMe(me: AuthMeResponse): void {
  requireAuthQueryClient().setQueryData(authQueryKeys.me, me);
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  return error instanceof Error && error.name === "AbortError";
}

function isTerminalRefreshError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    (error.status === 401 || error.status === 403)
  );
}

function isTransientRefreshError(error: unknown): boolean {
  if (error instanceof ApiRequestError) {
    return error.status >= 500;
  }

  return error instanceof TypeError;
}

function isTokenComfortablyValid(expiresAt: number | null): boolean {
  if (expiresAt === null) {
    return false;
  }

  return expiresAt - Date.now() > EXPIRY_SAFETY_WINDOW_MS;
}

async function applyTokenAndMe(
  generation: number,
  token: TokenResponse,
  signal?: AbortSignal,
): Promise<void> {
  const store = useAuthStore.getState();

  if (!store.establishToken(generation, token)) {
    return;
  }

  const me = await getMe(token.access_token, signal);

  if (!useAuthStore.getState().isGenerationCurrent(generation)) {
    return;
  }

  cacheAuthMe(me);
  useAuthStore.getState().confirmUserId(generation, me.user.id);
}

type RefreshExecutionOptions = {
  isBootstrap: boolean;
};

async function executeRefresh(
  generation: number,
  signal: AbortSignal | undefined,
  options: RefreshExecutionOptions,
): Promise<void> {
  try {
    const token = await refresh(signal);
    await applyTokenAndMe(generation, token, signal);
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    if (!useAuthStore.getState().isGenerationCurrent(generation)) {
      return;
    }

    if (isTerminalRefreshError(error)) {
      performTerminalAuthCleanup(requireAuthQueryClient(), generation);

      if (!options.isBootstrap) {
        throw new AuthSessionError();
      }

      return;
    }

    if (isTransientRefreshError(error) || error instanceof ApiRequestError) {
      throw new AuthSessionUnavailableError();
    }

    throw error;
  }
}

export async function runBootstrapAuthSession(
  queryClient: QueryClient,
  signal?: AbortSignal,
): Promise<void> {
  setAuthQueryClient(queryClient);

  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const store = useAuthStore.getState();
    store.beginInitializing();
    const generation = store.sessionGeneration;

    try {
      await executeRefresh(generation, signal, { isBootstrap: true });
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      throw error;
    } finally {
      bootstrapPromise = null;
    }
  })();

  return bootstrapPromise;
}

export function createBootstrapAuthSessionQueryOptions(queryClient: QueryClient) {
  return {
    queryKey: [...authQueryKeys.root, "bootstrap"] as const,
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      await runBootstrapAuthSession(queryClient, signal);

      return true;
    },
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  };
}

async function runRefreshSession(signal?: AbortSignal): Promise<void> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const generation = useAuthStore.getState().sessionGeneration;

    try {
      await executeRefresh(generation, signal, { isBootstrap: false });
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function forceRefreshSession(signal?: AbortSignal): Promise<void> {
  return runRefreshSession(signal);
}

export async function ensureAuthenticatedSession(
  signal?: AbortSignal,
): Promise<void> {
  if (bootstrapPromise) {
    await bootstrapPromise;
  }

  const initialState = useAuthStore.getState();

  if (
    initialState.status === "authenticated" &&
    isTokenComfortablyValid(initialState.expiresAt)
  ) {
    return;
  }

  if (initialState.status === "unauthenticated") {
    throw new AuthSessionError();
  }

  if (refreshPromise) {
    await refreshPromise;
  } else {
    const currentState = useAuthStore.getState();

    if (currentState.status === "unauthenticated") {
      throw new AuthSessionError();
    }

    if (
      currentState.status === "authenticated" &&
      isTokenComfortablyValid(currentState.expiresAt)
    ) {
      return;
    }

    await runRefreshSession(signal);
  }

  const finalState = useAuthStore.getState();

  if (finalState.status !== "authenticated") {
    throw new AuthSessionError();
  }
}

export async function getAccessTokenForAuthenticatedRequest(
  signal?: AbortSignal,
): Promise<string> {
  await ensureAuthenticatedSession(signal);

  const accessToken = useAuthStore.getState().accessToken;

  if (!accessToken) {
    throw new AuthSessionError();
  }

  return accessToken;
}

export async function establishAuthenticatedSession(
  queryClient: QueryClient,
  generation: number,
  token: TokenResponse,
  signal?: AbortSignal,
): Promise<AuthMeResponse | null> {
  setAuthQueryClient(queryClient);

  await applyTokenAndMe(generation, token, signal);

  if (!useAuthStore.getState().isGenerationCurrent(generation)) {
    return null;
  }

  const me = queryClient.getQueryData<AuthMeResponse>(authQueryKeys.me);

  if (!me) {
    if (!useAuthStore.getState().isGenerationCurrent(generation)) {
      return null;
    }

    throw new AuthSessionError("Failed to establish authenticated session.");
  }

  return me;
}

export function beginNewAuthSession(): number {
  return useAuthStore.getState().beginNewAuthSession();
}

export function performTerminalAuthCleanup(
  queryClient: QueryClient,
  generation: number,
): boolean {
  const cleared = useAuthStore.getState().terminalClear(generation);

  if (cleared) {
    void queryClient.cancelQueries({ queryKey: authQueryKeys.root });
    queryClient.removeQueries({ queryKey: authQueryKeys.me });
  }

  return cleared;
}

export function getCachedAuthMe(
  queryClient: QueryClient,
): AuthMeResponse | undefined {
  return queryClient.getQueryData<AuthMeResponse>(authQueryKeys.me);
}

export async function performLogout(queryClient: QueryClient): Promise<void> {
  setAuthQueryClient(queryClient);

  const capturedToken = useAuthStore.getState().accessToken;
  const generation = useAuthStore.getState().sessionGeneration;

  performTerminalAuthCleanup(queryClient, generation);

  await queryClient.cancelQueries({ queryKey: authQueryKeys.root });

  try {
    if (capturedToken) {
      await logout(capturedToken);
    }
  } catch {
    // Server logout is best-effort; local session is already closed.
  }
}
