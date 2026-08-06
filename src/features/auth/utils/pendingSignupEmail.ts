const PENDING_SIGNUP_EMAIL_KEY = "lillyai.pending-signup-email";

export function storePendingSignupEmail(email: string): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(PENDING_SIGNUP_EMAIL_KEY, email);
}

export function readPendingSignupEmail(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem(PENDING_SIGNUP_EMAIL_KEY);
}

export function clearPendingSignupEmail(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);
}
