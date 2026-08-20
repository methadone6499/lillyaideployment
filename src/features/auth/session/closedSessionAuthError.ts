import { ApiRequestError } from "@/services/ApiRequestError";

export const COMPANY_ACCESS_CLOSED_SESSION_CODES = [
  "company_access_disabled",
  "company_access_unavailable",
] as const;

type CompanyAccessClosedSessionCode =
  (typeof COMPANY_ACCESS_CLOSED_SESSION_CODES)[number];

export function isCompanyAccessClosedSessionCode(
  code: string | null | undefined,
): code is CompanyAccessClosedSessionCode {
  return (
    code === "company_access_disabled" ||
    code === "company_access_unavailable"
  );
}

export function isClosedSessionAuthError(error: unknown): boolean {
  if (!(error instanceof ApiRequestError)) {
    return false;
  }

  if (error.status === 401 || error.status === 403) {
    return true;
  }

  return isCompanyAccessClosedSessionCode(error.code);
}
