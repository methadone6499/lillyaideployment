import type {
  AuthMeResponse,
  ContextResponse,
  Permission,
} from "../schemas/authSchemas";

const STANDARD_HOME_PATH = "/dashboard";
const COMPANY_ADMIN_HOME_PATH = "/company-admin/dashboard";
const SUPER_ADMIN_HOME_PATH = "/super-admin/dashboard";

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

  if (context?.type === "company" && context.role === "company_admin") {
    return COMPANY_ADMIN_HOME_PATH;
  }

  return STANDARD_HOME_PATH;
}
