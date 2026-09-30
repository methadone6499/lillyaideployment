const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function resolveHostedBillingUrl(
  url: string | null | undefined,
): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.has(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

export function assignHostedBillingUrl(
  url: string | null | undefined,
): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const href = resolveHostedBillingUrl(url);
  if (!href) {
    return false;
  }

  window.location.assign(href);
  return true;
}
