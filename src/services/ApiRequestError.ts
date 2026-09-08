export type FieldErrors = Record<string, string>;

type ApiRequestErrorOptions = {
  status: number;
  message: string;
  code?: string | null;
  details?: unknown;
  requestId?: string | null;
  fieldErrors?: FieldErrors;
  rawCause?: unknown;
  retryAfterSeconds?: number | null;
};

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly details: unknown;
  readonly requestId: string | null;
  readonly fieldErrors: FieldErrors;
  readonly rawCause: unknown;
  readonly retryAfterSeconds: number | null;

  constructor(options: ApiRequestErrorOptions) {
    super(options.message);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.code = options.code ?? null;
    this.details = options.details ?? null;
    this.requestId = options.requestId ?? null;
    this.fieldErrors = options.fieldErrors ?? {};
    this.rawCause = options.rawCause ?? null;
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
  }
}
