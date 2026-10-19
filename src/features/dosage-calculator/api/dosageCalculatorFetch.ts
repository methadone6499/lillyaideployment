import { ensureAuthenticatedSession } from "@/features/auth";
import { getReportApiBaseUrl } from "@/lib/reportApiBaseUrl";
import type { z } from "zod";
import { getCalculatorApiValidationMessages } from "../utils/calculatorValidation";

export class DosageCalculatorApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly validationMessages: readonly string[] = [],
  ) {
    super(message);
    this.name = "DosageCalculatorApiError";
  }
}

export class DosageCalculatorResponseError extends Error {
  constructor() {
    super("The calculator returned incomplete results. Try the calculation again. If this continues, contact support.");
    this.name = "DosageCalculatorResponseError";
  }
}

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getReportApiBaseUrl()}${normalizedPath}`;
}

async function parseErrorMessage(response: Response): Promise<{ message: string; validationMessages: string[] }> {
  try {
    const body: unknown = await response.json();
    const validationMessages = getCalculatorApiValidationMessages(body);
    const result = (message: string) => ({ message, validationMessages });
    if (typeof body === "object" && body !== null) {
      if ("detail" in body) {
        const { detail } = body as { detail: unknown };
        if (typeof detail === "string") {
          return result(detail);
        }
        if (Array.isArray(detail)) {
          return result(detail
            .map((item) =>
              typeof item === "object" &&
              item !== null &&
              "msg" in item &&
              typeof item.msg === "string"
                ? item.msg
                : JSON.stringify(item),
            )
            .join("; "));
        }
        if (
          typeof detail === "object" &&
          detail !== null &&
          "message" in detail &&
          typeof detail.message === "string"
        ) {
          return result(detail.message);
        }
      }
      if ("message" in body && typeof body.message === "string") {
        return result(body.message);
      }
    }
  } catch {
    // Response body is not JSON — fall back to status text.
  }

  return { message: response.statusText || `Request failed with status ${response.status}`, validationMessages: [] };
}

type DosageCalculatorFetchOptions<TSchema extends z.ZodType> = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  schema: TSchema;
};

export async function dosageCalculatorFetch<TSchema extends z.ZodType>(
  path: string,
  options: DosageCalculatorFetchOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  await ensureAuthenticatedSession(options.signal);

  const headers = new Headers(options.headers);

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetch(buildUrl(path), {
    method: options.method ?? "GET",
    headers,
    body,
    credentials: "omit",
    signal: options.signal,
  });

  if (!response.ok) {
    const error = await parseErrorMessage(response);
    throw new DosageCalculatorApiError(
      response.status,
      error.message,
      error.validationMessages,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    if (options.signal?.aborted || (error instanceof Error && error.name === "AbortError")) throw error;
    throw new DosageCalculatorResponseError();
  }
  const parsed = options.schema.safeParse(json);
  if (!parsed.success) throw new DosageCalculatorResponseError();
  return parsed.data;
}
