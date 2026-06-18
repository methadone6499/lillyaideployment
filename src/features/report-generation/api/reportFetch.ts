import type { z } from "zod";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";
import { getAuthToken } from "./reportAuth";

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
  return `${getApiBaseUrl()}${normalizedPath}`;
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
  const token = getAuthToken();
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetch(buildUrl(path), {
    method: options.method ?? "GET",
    headers,
    body,
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

  // #region agent log
  if (path.includes("/generate") || path.endsWith("/status")) {
    const payload =
      typeof json === "object" && json !== null ? (json as Record<string, unknown>) : null;
    fetch("http://127.0.0.1:7335/ingest/c77454a4-bbbd-44ba-8c53-f65d82f35195", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "383606",
      },
      body: JSON.stringify({
        sessionId: "383606",
        runId: "status-fix",
        hypothesisId: path.endsWith("/status") ? "E,F" : "A,B",
        location: "reportFetch.ts:parse",
        message: "report response pre-parse",
        data: {
          path,
          reportStatus: payload?.report_status ?? null,
          statusReasonType:
            payload && "status_reason" in payload
              ? payload.status_reason === null
                ? "null"
                : typeof payload.status_reason
              : null,
          currentSectionType:
            payload &&
            typeof payload.progress === "object" &&
            payload.progress !== null &&
            "current_section_type" in payload.progress
              ? (payload.progress as { current_section_type: unknown })
                  .current_section_type
              : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion

  try {
    return schema.parse(json);
  } catch (parseError) {
    // #region agent log
    fetch("http://127.0.0.1:7335/ingest/c77454a4-bbbd-44ba-8c53-f65d82f35195", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "383606",
      },
      body: JSON.stringify({
        sessionId: "383606",
        runId: "status-fix",
        hypothesisId: path.endsWith("/status") ? "E,F" : "A,B,C,D",
        location: "reportFetch.ts:parse-catch",
        message: "schema parse failed",
        data: {
          path,
          error:
            parseError instanceof Error ? parseError.message : String(parseError),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw parseError;
  }
}
