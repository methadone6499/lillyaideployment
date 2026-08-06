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
      message: "Expected a JSON response",
    });
  }

  const json: unknown = await response.json();
  const schema = (options as JsonApiRequestOptions<TSchema>).schema;

  try {
    return schema.parse(json);
  } catch (error) {
    throw new ApiRequestError({
      status: response.status,
      message: "Response did not match the expected schema",
      rawCause: error,
    });
  }
}
