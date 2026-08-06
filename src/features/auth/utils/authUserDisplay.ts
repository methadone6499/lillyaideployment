import type { AuthMeResponse, PublicUserResponse } from "../schemas/authSchemas";

export function getAuthUserDisplayName(
  user: PublicUserResponse | undefined,
): string {
  return user?.full_name ?? "";
}

export function getAuthUserInstitutionName(
  user: PublicUserResponse | undefined,
): string {
  return user?.institution_name ?? "";
}

export function getAuthUserId(user: PublicUserResponse | undefined): string | null {
  return user?.id ?? null;
}

export function getAuthUserFromMe(
  me: AuthMeResponse | undefined,
): PublicUserResponse | undefined {
  return me?.user;
}
