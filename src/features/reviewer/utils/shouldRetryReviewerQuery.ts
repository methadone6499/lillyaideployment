import { ApiRequestError } from "@/services/ApiRequestError";

export function shouldRetryReviewerQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (error instanceof ApiRequestError && error.status < 500) {
    return false;
  }

  return failureCount < 2;
}
