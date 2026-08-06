"use client";

import {
  getAuthUserDisplayName,
  getAuthUserFromMe,
  getAuthUserId,
  getAuthUserInstitutionName,
} from "../utils/authUserDisplay";
import { useCurrentUserQuery } from "./useCurrentUserQuery";

export function useAuthUser() {
  const { data: authMe, ...query } = useCurrentUserQuery();
  const user = getAuthUserFromMe(authMe);

  return {
    ...query,
    authMe,
    user,
    userId: getAuthUserId(user),
    displayName: getAuthUserDisplayName(user),
    institutionName: getAuthUserInstitutionName(user),
    isAuthenticated: Boolean(user?.id),
  };
}
