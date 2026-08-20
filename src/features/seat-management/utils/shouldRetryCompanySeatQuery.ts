import { ApiRequestError } from "@/services/ApiRequestError";

export function shouldRetryCompanySeatQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (error instanceof ApiRequestError && error.status < 500) {
    return false;
  }

  return failureCount < 1;
}
