import {
  getActiveContext,
  type AuthMeResponse,
} from "@/features/auth";

export function canActivateEnterprise(
  me: AuthMeResponse | null | undefined,
): boolean {
  const context = getActiveContext(me);

  return context?.type === "personal" && context.role === "standard_user";
}
