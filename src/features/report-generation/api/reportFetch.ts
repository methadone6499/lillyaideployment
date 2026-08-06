import type { z } from "zod";
import { ensureAuthenticatedSession } from "@/features/auth";
import { getReportApiBaseUrl } from "@/lib/reportApiBaseUrl";

export class ReportApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ReportApiError";
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

type ReportFetchOptions<TSchema extends z.ZodType> = {
  method?: string;
  body?: unknown;
  schema: TSchema;
  signal?: AbortSignal;
};

type ReportFetchBlobOptions = {
  method?: string;
  body?: unknown;
  responseType: "blob";
  signal?: AbortSignal;
};

export async function reportFetch<TSchema extends z.ZodType>(
  path: string,
  options: ReportFetchOptions<TSchema>,
): Promise<z.infer<TSchema>>;

export async function reportFetch(
  path: string,
  options: ReportFetchBlobOptions,
): Promise<Blob>;

export async function reportFetch<TSchema extends z.ZodType>(
  path: string,
  options: ReportFetchOptions<TSchema> | ReportFetchBlobOptions,
): Promise<z.infer<TSchema> | Blob> {
  await ensureAuthenticatedSession(options.signal);

  const headers = new Headers();

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
    throw new ReportApiError(response.status, await parseErrorMessage(response));
  }

  if ("responseType" in options && options.responseType === "blob") {
    return response.blob();
  }

  const json: unknown = await response.json();
  const schema = (options as ReportFetchOptions<TSchema>).schema;
  return schema.parse(json);
}
