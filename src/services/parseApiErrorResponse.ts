import {
  httpValidationErrorSchema,
  platformErrorSchema,
  type ValidationErrorItem,
} from "./apiErrorSchemas";
import { ApiRequestError, type FieldErrors } from "./ApiRequestError";

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
        });
      }
    }

    if ("message" in body && typeof body.message === "string") {
      return new ApiRequestError({
        status,
        message: body.message,
        rawCause: body,
      });
    }
  }

  return new ApiRequestError({
    status,
    message: `Request failed with status ${status}`,
    rawCause: body,
  });
}

export async function parseApiErrorResponse(
  response: Response,
): Promise<ApiRequestError> {
  const status = response.status;
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
    });
  }

  if (rawBody !== undefined) {
    return buildApiRequestErrorFromBody(status, rawBody);
  }

  return new ApiRequestError({
    status,
    message: response.statusText || `Request failed with status ${status}`,
    rawCause: null,
  });
}
