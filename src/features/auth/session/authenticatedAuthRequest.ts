import { ApiRequestError } from "@/services/ApiRequestError";
import { useAuthStore } from "@/store/useAuthStore";

import {
  forceRefreshSession,
  getAccessTokenForAuthenticatedRequest,
} from "./authSession";
import { AuthSessionError } from "./authSessionErrors";

export async function authenticatedAuthRequest<T>(
  request: (accessToken: string, signal?: AbortSignal) => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  const accessToken = await getAccessTokenForAuthenticatedRequest(signal);
  const generation = useAuthStore.getState().sessionGeneration;

  try {
    return await request(accessToken, signal);
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 401) {
      throw error;
    }

    await forceRefreshSession(signal);

    const state = useAuthStore.getState();

    if (
      !state.accessToken ||
      !state.isGenerationCurrent(generation) ||
      state.status !== "authenticated"
    ) {
      throw new AuthSessionError();
    }

    return request(state.accessToken, signal);
  }
}
