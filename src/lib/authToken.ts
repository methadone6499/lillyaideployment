const AUTH_TOKEN_STORAGE_KEY = "lillyai_access_token";
const AUTH_USER_ID_STORAGE_KEY = "lillyai_user_id";

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (stored) {
      return stored;
    }
  }

  return process.env.NEXT_PUBLIC_API_TOKEN ?? null;
}

export function getAuthUserId(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(AUTH_USER_ID_STORAGE_KEY);
  }

  return null;
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  }
}

export function setAuthUserId(userId: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_USER_ID_STORAGE_KEY, userId);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_ID_STORAGE_KEY);
  }
}
