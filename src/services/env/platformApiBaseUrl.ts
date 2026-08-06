/**
 * Server-only Platform API base URL.
 * Must never be exposed through a NEXT_PUBLIC_ variable.
 */
const PLATFORM_API_BASE_URL_ENV = "PLATFORM_API_BASE_URL";

export function getPlatformApiBaseUrl(): string | null {
  const url = process.env[PLATFORM_API_BASE_URL_ENV];

  if (!url || url.trim() === "") {
    return null;
  }

  return url.replace(/\/$/, "");
}
