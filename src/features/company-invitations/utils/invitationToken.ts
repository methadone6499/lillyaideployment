const ACCEPT_PATH = "/company-invitations/accept";
const MAX_INVITATION_TOKEN_LENGTH = 512;

type InvitationTokenSnapshot = {
  captured: boolean;
  token: string | null;
};

const SERVER_SNAPSHOT: InvitationTokenSnapshot = {
  captured: false,
  token: null,
};

let snapshot: InvitationTokenSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();
let autoAcceptToken: string | null = null;

function emitInvitationTokenChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeInvitationToken(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getInvitationTokenSnapshot(): InvitationTokenSnapshot {
  return snapshot;
}

export function getServerInvitationTokenSnapshot(): InvitationTokenSnapshot {
  return SERVER_SNAPSHOT;
}

export function parseInvitationTokenFromHash(hash: string): string | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;

  if (!raw) {
    return null;
  }

  const params = new URLSearchParams(raw);
  const token = params.get("token")?.trim() ?? "";

  if (!token || token.length > MAX_INVITATION_TOKEN_LENGTH) {
    return null;
  }

  return token;
}

export function captureInvitationTokenFromLocation(): string | null {
  if (typeof window === "undefined") {
    return snapshot.token;
  }

  const hasHash = window.location.hash.length > 0;
  const parsed = parseInvitationTokenFromHash(window.location.hash);

  if (hasHash || window.location.search.length > 0) {
    window.history.replaceState(null, "", ACCEPT_PATH);
  }

  const nextToken = hasHash ? parsed : snapshot.token;

  if (nextToken !== snapshot.token) {
    autoAcceptToken = null;
  }

  snapshot = {
    captured: true,
    token: nextToken,
  };
  emitInvitationTokenChange();

  return snapshot.token;
}

export function getInvitationToken(): string | null {
  return snapshot.token;
}

export function clearInvitationToken(): void {
  snapshot = {
    captured: snapshot.captured,
    token: null,
  };
  autoAcceptToken = null;
  emitInvitationTokenChange();
}

export function tryBeginInvitationAutoAccept(): boolean {
  const token = snapshot.token;

  if (!token || autoAcceptToken === token) {
    return false;
  }

  autoAcceptToken = token;
  return true;
}
