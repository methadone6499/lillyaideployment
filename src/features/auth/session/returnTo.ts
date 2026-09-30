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

function splitPath(path: string): { pathname: string; search: string } {
  const hashIndex = path.indexOf("#");
  const withoutHash = hashIndex === -1 ? path : path.slice(0, hashIndex);
  const queryIndex = withoutHash.indexOf("?");

  if (queryIndex === -1) {
    return { pathname: withoutHash, search: "" };
  }

  return {
    pathname: withoutHash.slice(0, queryIndex),
    search: withoutHash.slice(queryIndex + 1),
  };
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

export function buildPathWithReturnTo(
  destination: string,
  returnTo?: string | null,
  fallback = DEFAULT_RETURN_PATH,
): string {
  const safeDestination = sanitizeReturnTo(destination, fallback);
  const { pathname, search } = splitPath(safeDestination);
  const params = new URLSearchParams(search);
  const safeReturnTo = returnTo ? sanitizeReturnTo(returnTo, "") : "";

  if (safeReturnTo && splitPath(safeReturnTo).pathname !== pathname) {
    params.set("returnTo", safeReturnTo);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function resolveAuthenticatedDestination(
  authenticatedDestination: string | null | undefined,
  returnTo: string | null | undefined,
  fallback: string,
): string {
  if (!authenticatedDestination) {
    return sanitizeReturnTo(returnTo, fallback);
  }

  return buildPathWithReturnTo(
    authenticatedDestination,
    returnTo,
    fallback,
  );
}

export function buildLoginRedirect(pathname: string): string {
  const safePath = sanitizeReturnTo(pathname, DEFAULT_RETURN_PATH);
  return `/login?returnTo=${encodeURIComponent(safePath)}`;
}
