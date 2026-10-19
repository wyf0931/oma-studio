import type * as DTO from "./types";
import { ApiError, toRecord } from "./types";
import { createId } from "../browser";

import type { Actions as I18nActions } from "./i18n";
export interface Actions {
  request(path: string, options?: RequestInit): Promise<{ response: Response; requestId: string }>;
  responseData<T = unknown>(
    response: Response,
    requestId: string,
    requestPath: string,
  ): Promise<{ data: T; responseId: string }>;
  api<T = unknown>(path: string, options?: RequestInit): Promise<T>;
  errorFromResponse(response: Response, requestId: string, data?: unknown): DTO.ApiError;
}
export type Feature = Actions;
export interface Dependencies {
  getMode(): string;
  onUnauthorized(response: Response, path: string, error: DTO.ApiError): void;
  i18n: Pick<I18nActions, "t">;
}
export function createApi(deps: Dependencies): Feature {
  async function request(path: string, options: RequestInit = {}): Promise<{ response: Response; requestId: string }> {
    const requestId = createId();
    const headers = new Headers(options.headers || {});
    headers.set("X-Request-ID", requestId);
    const response = await fetch(path, {
      ...options,
      cache: "no-store",
      headers,
    });
    return { response, requestId };
  }
  async function responseData<T = unknown>(
    response: Response,
    requestId: string,
    requestPath: string,
  ): Promise<{ data: T; responseId: string }> {
    const responseId = response.headers.get("X-Request-ID") || requestId;
    const contentType = response.headers.get("content-type") || "";
    let data: unknown = null;
    if (contentType.includes("json")) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      await response.text();
    }
    if (!response.ok) {
      const error = errorFromResponse(response, responseId, data);
      deps.onUnauthorized(response, requestPath, error);
      throw error;
    }
    if (data === null) throw new ApiError(`Server returned a non-JSON response (request_id: ${responseId})`);
    return { data: data as T, responseId };
  }
  async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
    const requestPath = path.includes("/messages") && !path.includes("?") ? `${path}?mode=${deps.getMode()}` : path;
    const headers = new Headers(options.headers || {});
    if (options.body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const { response, requestId } = await request(requestPath, { ...options, headers });
    const { data, responseId } = await responseData<T>(response, requestId, requestPath);
    if (data === null) {
      const error = new ApiError(`Server returned a non-JSON response (request_id: ${responseId})`);
      error.requestId = responseId;
      throw error;
    }
    return data;
  }
  function errorFromResponse(response: Response, requestId: string, data: unknown = null): DTO.ApiError {
    const payload = toRecord(data);
    const detail = typeof payload.detail === "string" ? payload.detail : `Server returned ${response.status}`;
    const code = typeof payload.code === "string" ? payload.code : "";
    const params = Object.fromEntries(
      Object.entries(toRecord(payload.params)).filter(
        (entry): entry is [string, string | number] => typeof entry[1] === "string" || typeof entry[1] === "number",
      ),
    );
    const message = code ? deps.i18n.t(code, { ...params, defaultValue: detail }) : detail;
    const error = new ApiError(`${message} (request_id: ${requestId})`);
    error.uiMessage = message;
    error.requestId = requestId;
    error.status = response.status;
    error.code = code || "";
    error.params = params;
    return error;
  }
  return { request, responseData, api, errorFromResponse };
}
