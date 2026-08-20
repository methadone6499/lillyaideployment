import {
  httpValidationErrorSchema,
  platformErrorSchema,
  type ValidationErrorItem,
} from "./apiErrorSchemas";
import { ApiRequestError, type FieldErrors } from "./ApiRequestError";

function parseRetryAfterSeconds(header: string | null): number | null {
  if (!header) {
    return null;
  }

  const trimmed = header.trim();

  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    return Number.parseInt(trimmed, 10);
  }

  const dateMs = Date.parse(trimmed);

  if (Number.isNaN(dateMs)) {
    return null;
  }

  return Math.max(0, Math.ceil((dateMs - Date.now()) / 1000));
}

function retryAfterFromDetails(details: unknown): number | null {
  if (typeof details !== "object" || details === null) {
    return null;
  }

  const record = details as Record<string, unknown>;
  const raw = record.retry_after ?? record.retry_after_seconds;

  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
    return Math.ceil(raw);
  }

  if (typeof raw === "string") {
    return parseRetryAfterSeconds(raw);
  }

  return null;
}

function validationLocToFieldKey(loc: ValidationErrorItem["loc"]): string | null {
  const fieldParts = loc.filter(
    (part): part is string => part !== "body" && typeof part === "string",
  );

  if (fieldParts.length === 0) {
    return null;
  }

  if (fieldParts.length === 1) {
    return fieldParts[0];
  }

  return fieldParts.join(".");
}

function fieldErrorsFromValidationItems(
  items: ValidationErrorItem[],
): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const item of items) {
    const fieldKey = validationLocToFieldKey(item.loc);

    if (fieldKey) {
      fieldErrors[fieldKey] = item.msg;
    }
  }

  return fieldErrors;
}

function validationFallbackMessage(items: ValidationErrorItem[]): string {
  return items.map((item) => item.msg).join("; ");
}

function buildApiRequestErrorFromBody(
  status: number,
  body: unknown,
  retryAfterSeconds: number | null,
): ApiRequestError {
  const platformError = platformErrorSchema.safeParse(body);

  if (platformError.success) {
    const parsed = platformError.data;

    return new ApiRequestError({
      status,
      message: parsed.message,
      code: parsed.code,
      details: parsed.details ?? null,
      requestId: parsed.request_id ?? null,
      rawCause: body,
      retryAfterSeconds:
        retryAfterSeconds ?? retryAfterFromDetails(parsed.details),
    });
  }

  const validationError = httpValidationErrorSchema.safeParse(body);

  if (validationError.success) {
    const items = validationError.data.detail;
    const fieldErrors = fieldErrorsFromValidationItems(items);

    return new ApiRequestError({
      status,
      message: validationFallbackMessage(items),
      fieldErrors,
      rawCause: body,
      retryAfterSeconds,
    });
  }

  if (typeof body === "object" && body !== null) {
    if ("detail" in body) {
      const { detail } = body as { detail: unknown };

      if (typeof detail === "string") {
        return new ApiRequestError({
          status,
          message: detail,
          rawCause: body,
          retryAfterSeconds,
        });
      }
    }

    if ("message" in body && typeof body.message === "string") {
      return new ApiRequestError({
        status,
        message: body.message,
        rawCause: body,
        retryAfterSeconds,
      });
    }
  }

  return new ApiRequestError({
    status,
    message: `Request failed with status ${status}`,
    rawCause: body,
    retryAfterSeconds,
  });
}

export async function parseApiErrorResponse(
  response: Response,
): Promise<ApiRequestError> {
  const status = response.status;
  const retryAfterSeconds = parseRetryAfterSeconds(
    response.headers.get("retry-after"),
  );
  let rawBody: unknown = undefined;
  let fallbackText: string | undefined;

  try {
    fallbackText = await response.text();

    if (fallbackText) {
      rawBody = JSON.parse(fallbackText) as unknown;
    }
  } catch {
    return new ApiRequestError({
      status,
      message:
        fallbackText ||
        response.statusText ||
        `Request failed with status ${status}`,
      rawCause: fallbackText ?? null,
      retryAfterSeconds,
    });
  }

  if (rawBody !== undefined) {
    return buildApiRequestErrorFromBody(status, rawBody, retryAfterSeconds);
  }

  return new ApiRequestError({
    status,
    message: response.statusText || `Request failed with status ${status}`,
    rawCause: null,
    retryAfterSeconds,
  });
}
