import { ensureAuthenticatedSession } from "@/features/auth";
import { getReportApiBaseUrl } from "@/lib/reportApiBaseUrl";
import type { z } from "zod";

export class DosageCalculatorApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "DosageCalculatorApiError";
  }
}

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getReportApiBaseUrl()}${normalizedPath}`;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null) {
      if ("detail" in body) {
        const { detail } = body as { detail: unknown };
        if (typeof detail === "string") {
          return detail;
        }
        if (Array.isArray(detail)) {
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
      }
      if ("message" in body && typeof body.message === "string") {
        return body.message;
      }
    }
  } catch {
    // Response body is not JSON — fall back to status text.
  }

  return response.statusText || `Request failed with status ${response.status}`;
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
    throw new DosageCalculatorApiError(
      response.status,
      await parseErrorMessage(response),
    );
  }

  const json: unknown = await response.json();
  return options.schema.parse(json);
}
