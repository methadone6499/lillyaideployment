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

type ReportFetchBaseOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

type ReportFetchOptions<TSchema extends z.ZodType> = ReportFetchBaseOptions & {
  schema: TSchema;
};

type ReportFetchBlobOptions = ReportFetchBaseOptions & {
  responseType: "blob";
};

type ReportFetchEmptyOptions = ReportFetchBaseOptions & {
  responseType: "empty";
};

export async function reportFetch<TSchema extends z.ZodType>(
  path: string,
  options: ReportFetchOptions<TSchema>,
): Promise<z.infer<TSchema>>;

export async function reportFetch(
  path: string,
  options: ReportFetchBlobOptions,
): Promise<Blob>;

export async function reportFetch(
  path: string,
  options: ReportFetchEmptyOptions,
): Promise<void>;

export async function reportFetch<TSchema extends z.ZodType>(
  path: string,
  options:
    | ReportFetchOptions<TSchema>
    | ReportFetchBlobOptions
    | ReportFetchEmptyOptions,
): Promise<z.infer<TSchema> | Blob | void> {
  await ensureAuthenticatedSession(options.signal);

  const headers = new Headers(options.headers);

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
    // Let the browser set multipart Content-Type including the boundary.
    headers.delete("Content-Type");
  } else if (options.body !== undefined) {
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

  if ("responseType" in options) {
    if (options.responseType === "blob") {
      return response.blob();
    }
    return;
  }

  const json: unknown = await response.json();
  const schema = (options as ReportFetchOptions<TSchema>).schema;
  return schema.parse(json);
}
