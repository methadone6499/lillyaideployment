import { ApiRequestError } from "@/services/ApiRequestError";

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
