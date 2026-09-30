const ACCEPT_PATH = "/reviewer-invitations/accept";
const MAX_TOKEN_LENGTH = 512;

export type ReviewerInvitationTokenSnapshot = {
  captured: boolean;
  token: string | null;
};

const SERVER_SNAPSHOT: ReviewerInvitationTokenSnapshot = {
  captured: false,
  token: null,
};

let snapshot: ReviewerInvitationTokenSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function emitChange(): void {
  for (const listener of listeners) listener();
}

export function subscribeReviewerInvitationToken(
  listener: () => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getReviewerInvitationTokenSnapshot(): ReviewerInvitationTokenSnapshot {
  return snapshot;
}

export function getReviewerInvitationTokenServerSnapshot(): ReviewerInvitationTokenSnapshot {
  return SERVER_SNAPSHOT;
}

export function parseReviewerInvitationToken(hash: string): string | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const token = new URLSearchParams(raw).get("token")?.trim() ?? "";
  return token && token.length <= MAX_TOKEN_LENGTH ? token : null;
}

export function captureReviewerInvitationToken(): string | null {
  if (typeof window === "undefined") return snapshot.token;

  const hasHash = window.location.hash.length > 0;
  const token = hasHash
    ? parseReviewerInvitationToken(window.location.hash)
    : snapshot.token;

  if (hasHash || window.location.search.length > 0) {
    window.history.replaceState(null, "", ACCEPT_PATH);
  }

  snapshot = { captured: true, token };
  emitChange();
  return token;
}

export function getReviewerInvitationToken(): string | null {
  return snapshot.token;
}

export function resetReviewerInvitationToken(): void {
  snapshot = SERVER_SNAPSHOT;
  emitChange();
}
