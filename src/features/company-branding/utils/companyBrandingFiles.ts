import { ApiRequestError } from "@/services/ApiRequestError";

import { MAX_COMPANY_LOGO_BYTES } from "../schemas/companyBrandingSchemas";

export function validateCompanyLogoFile(file: File): string | null {
  if (file.type !== "image/png") {
    return "Choose a PNG image.";
  }

  if (file.size > MAX_COMPANY_LOGO_BYTES) {
    return "The logo must be 10 MiB or smaller.";
  }

  return null;
}

export function getCompanyLogoErrorMessage(
  error: unknown,
  fallback = "Unable to update the company logo. Please try again.",
): string {
  if (error instanceof ApiRequestError) {
    switch (error.code) {
      case "subscription_required":
        return "Company branding requires an active Enterprise or Custom subscription.";
      case "permission_denied":
        return "You do not have permission to access company branding.";
      case "company_logo_not_found":
        return "No company logo is configured.";
      case "logo_too_large":
        return "The logo must be 10 MiB or smaller.";
      case "invalid_logo_format":
        return "Choose a valid, non-animated PNG image.";
      case "unsafe_logo_dimensions":
        return "Choose a PNG with smaller pixel dimensions.";
      default:
        return error.message || fallback;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
