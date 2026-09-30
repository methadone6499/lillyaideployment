import type {
  AuthMeResponse,
  ContextResponse,
  Permission,
} from "../schemas/authSchemas";
import { sanitizeReturnTo } from "../session/returnTo";

const STANDARD_HOME_PATH = "/dashboard";
const COMPANY_ADMIN_HOME_PATH = "/company-admin/dashboard";
const SUPER_ADMIN_HOME_PATH = "/super-admin/dashboard";
const REVIEWER_HOME_PATH = "/reviewer/assignments";

export function getActiveContext(
  me: AuthMeResponse | null | undefined,
): ContextResponse | null {
  return me?.active_context ?? null;
}

export function hasPermission(
  me: AuthMeResponse | null | undefined,
  permission: Permission,
): boolean {
  return Boolean(me?.permissions.includes(permission));
}

export function getPostAuthHomePath(
  me: AuthMeResponse | null | undefined,
): string {
  const context = getActiveContext(me);

  if (context?.type === "global" && context.role === "super_admin") {
    return SUPER_ADMIN_HOME_PATH;
  }

  if (context?.type === "reviewer" && context.role === "reviewer") {
    return REVIEWER_HOME_PATH;
  }

  if (context?.type === "company" && context.role === "company_admin") {
    return COMPANY_ADMIN_HOME_PATH;
  }

  return STANDARD_HOME_PATH;
}

export function getReviewerDestination(
  me: AuthMeResponse | null | undefined,
  returnTo?: string | null,
): string | null {
  if (getActiveContext(me)?.type !== "reviewer") {
    return null;
  }

  const destination = sanitizeReturnTo(returnTo, REVIEWER_HOME_PATH);
  const pathname = new URL(destination, "https://reviewer.local").pathname;

  return pathname === REVIEWER_HOME_PATH ||
    pathname.startsWith(`${REVIEWER_HOME_PATH}/`)
    ? destination
    : REVIEWER_HOME_PATH;
}
