import type { z } from "zod";

import { ApiRequestError } from "./ApiRequestError";
import { parseApiErrorResponse } from "./parseApiErrorResponse";

type BaseApiRequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
};

type JsonApiRequestOptions<TSchema extends z.ZodType> = BaseApiRequestOptions & {
  schema: TSchema;
};

type EmptyApiRequestOptions = BaseApiRequestOptions & {
  expectEmpty: true;
};

export async function apiRequest<TSchema extends z.ZodType>(
  url: string,
  options: JsonApiRequestOptions<TSchema>,
): Promise<z.infer<TSchema>>;

export async function apiRequest(
  url: string,
  options: EmptyApiRequestOptions,
): Promise<void>;

export async function apiRequest<TSchema extends z.ZodType>(
  url: string,
  options: JsonApiRequestOptions<TSchema> | EmptyApiRequestOptions,
): Promise<z.infer<TSchema> | void> {
  const headers = new Headers(options.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  let body: BodyInit | undefined;

  if (options.body !== undefined) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body,
    signal: options.signal,
    credentials: options.credentials ?? "same-origin",
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  if ("expectEmpty" in options && options.expectEmpty) {
    return;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new ApiRequestError({
      status: response.status,
      code: "invalid_response",
      message: "We could not read the information returned by the service. Try again. If this continues, contact support.",
    });
  }

  const schema = (options as JsonApiRequestOptions<TSchema>).schema;

  try {
    const json: unknown = await response.json();
    return schema.parse(json);
  } catch (error) {
    if (options.signal?.aborted || (error instanceof Error && error.name === "AbortError")) throw error;
    throw new ApiRequestError({
      status: response.status,
      code: "invalid_response",
      message: "We could not read the information returned by the service. Try again. If this continues, contact support.",
      rawCause: error,
    });
  }
}
