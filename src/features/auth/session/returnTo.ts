const DEFAULT_RETURN_PATH = "/dashboard";

function isUnsafePath(value: string): boolean {
  if (!value.startsWith("/")) {
    return true;
  }

  if (value.startsWith("//")) {
    return true;
  }

  if (value.includes("\\")) {
    return true;
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)) {
    return true;
  }

  return false;
}

export function sanitizeReturnTo(
  value: string | null | undefined,
  fallback = DEFAULT_RETURN_PATH,
): string {
  if (!value || typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  if (isUnsafePath(trimmed)) {
    return fallback;
  }

  try {
    const decoded = decodeURIComponent(trimmed);

    if (isUnsafePath(decoded)) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return trimmed;
}

export function buildLoginRedirect(pathname: string): string {
  const safePath = sanitizeReturnTo(pathname, DEFAULT_RETURN_PATH);
  return `/login?returnTo=${encodeURIComponent(safePath)}`;
}
