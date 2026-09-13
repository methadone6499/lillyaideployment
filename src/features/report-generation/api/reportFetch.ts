import type { z } from "zod";
import { ensureAuthenticatedSession } from "@/features/auth";
import { getReportApiBaseUrl } from "@/lib/reportApiBaseUrl";
import { createReportApiError } from "./reportApiError";

export {
  ReportApiError,
  createReportApiError,
  getEditingErrorCode,
  isEditingErrorCode,
  isReportApiError,
} from "./reportApiError";

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getReportApiBaseUrl()}${normalizedPath}`;
}

async function readErrorBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
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
    throw createReportApiError(
      response.status,
      await readErrorBody(response),
      response.statusText || `Request failed with status ${response.status}`,
    );
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
