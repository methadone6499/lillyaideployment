import { ApiRequestError } from "@/services/ApiRequestError";
import { useAuthStore } from "@/store/useAuthStore";

import {
  forceRefreshSession,
  getAccessTokenForAuthenticatedRequest,
  markCompanyAccessDisabled,
} from "./authSession";
import { AuthSessionError } from "./authSessionErrors";

export async function authenticatedAuthRequest<T>(
  request: (accessToken: string, signal?: AbortSignal) => Promise<T>,
  signal?: AbortSignal,
  options: { allowBlockedCompanyAccess?: boolean } = {},
): Promise<T> {
  const accessToken = await getAccessTokenForAuthenticatedRequest(signal);
  const generation = useAuthStore.getState().sessionGeneration;
  const contextVersion = useAuthStore.getState().companyContextVersion;
  const assertCurrentContext = () => {
    const current = useAuthStore.getState();
    if (!current.isGenerationCurrent(generation) || current.companyContextVersion !== contextVersion) {
      throw new AuthSessionError("Your workspace changed. Please retry.");
    }
  };
  const assertCompanyAccess = () => {
    if (!options.allowBlockedCompanyAccess && useAuthStore.getState().companyAccess !== "available") {
      throw new ApiRequestError({ status: 403, code: "company_access_disabled", message: "Company access is disabled" });
    }
  };
  assertCompanyAccess();

  try {
    const result = await request(accessToken, signal);
    assertCurrentContext();
    return result;
  } catch (error) {
    assertCurrentContext();
    markCompanyAccessDisabled(error, generation);
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

    assertCompanyAccess();
    try {
      const result = await request(state.accessToken, signal);
      assertCurrentContext();
      return result;
    } catch (retryError) {
      assertCurrentContext();
      markCompanyAccessDisabled(retryError, generation);
      throw retryError;
    }
  }
}
