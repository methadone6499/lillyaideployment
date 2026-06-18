import type { z } from "zod";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";

export class AuthApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthApiError";
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

type AuthFetchOptions<TSchema extends z.ZodType> = {
  method?: string;
  body?: unknown;
  schema: TSchema;
  signal?: AbortSignal;
};

export async function authFetch<TSchema extends z.ZodType>(
  path: string,
  options: AuthFetchOptions<TSchema>,
): Promise<z.infer<TSchema>> {
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
    signal: options.signal,
  });

  if (!response.ok) {
    throw new AuthApiError(response.status, await parseErrorMessage(response));
  }

  const json: unknown = await response.json();
  return options.schema.parse(json);
}
