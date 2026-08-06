export class AuthSessionError extends Error {
  readonly retryable = false;

  constructor(message = "Not authenticated") {
    super(message);
    this.name = "AuthSessionError";
  }
}

export class AuthSessionUnavailableError extends Error {
  readonly retryable = true;

  constructor(
    message = "Authentication is temporarily unavailable. Please try again.",
  ) {
    super(message);
    this.name = "AuthSessionUnavailableError";
  }
}
