import { z } from "zod";
import {
  editingErrorCodeSchema,
  type EditingErrorCode,
} from "../schemas/editingSchemas";

export type { EditingErrorCode };

const structuredEditingErrorDetailSchema = z.object({
  code: z.string().min(1),
  message: z.string().optional(),
  details: z.unknown().optional(),
});

export class ReportApiError extends Error {
  readonly code: string | null;
  readonly details: unknown;

  constructor(
    public readonly status: number,
    message: string,
    code: string | null = null,
    details: unknown = null,
  ) {
    super(message);
    this.name = "ReportApiError";
    this.code = code;
    this.details = details;
  }
}

export function isReportApiError(error: unknown): error is ReportApiError {
  return error instanceof ReportApiError;
}

export function getEditingErrorCode(error: unknown): EditingErrorCode | null {
  if (!isReportApiError(error) || error.code == null) {
    return null;
  }

  const parsed = editingErrorCodeSchema.safeParse(error.code);
  return parsed.success ? parsed.data : null;
}

export function isEditingErrorCode(
  error: unknown,
  code: EditingErrorCode,
): boolean {
  return getEditingErrorCode(error) === code;
}

function validationDetailMessage(detail: unknown[]): string {
  return detail
    .map((item) =>
      typeof item === "object" &&
      item !== null &&
      "msg" in item &&
      typeof item.msg === "string"
        ? item.msg
        : JSON.stringify(item),
    )
    .join("; ");
}

export function createReportApiError(
  status: number,
  body: unknown,
  fallbackMessage: string,
): ReportApiError {
  if (typeof body === "object" && body !== null) {
    if ("detail" in body) {
      const { detail } = body as { detail: unknown };

      if (typeof detail === "string") {
        return new ReportApiError(status, detail);
      }

      if (Array.isArray(detail)) {
        return new ReportApiError(status, validationDetailMessage(detail));
      }

      const structured = structuredEditingErrorDetailSchema.safeParse(detail);
      if (structured.success) {
        return new ReportApiError(
          status,
          structured.data.message?.trim() ||
            structured.data.code ||
            fallbackMessage,
          structured.data.code,
          structured.data.details ?? null,
        );
      }
    }

    if ("message" in body && typeof body.message === "string") {
      return new ReportApiError(status, body.message);
    }
  }

  return new ReportApiError(status, fallbackMessage);
}
