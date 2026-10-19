import { ApiError } from "./types";
import type { Workspace } from "../app/workspace";

import { createId } from "../browser";

// Explicit dependency contract for this feature; the composition root supplies it.
type Context = Pick<
  Workspace,
  | "abortChatReads"
  | "api"
  | "chatReadController"
  | "errorFromResponse"
  | "handleUnauthorizedResponse"
  | "mode"
  | "request"
  | "responseData"
>;
export interface Actions {
  request(path: string, options?: RequestInit): Promise<{ response: Response; requestId: string }>;
  responseData<T = unknown>(
    response: Response,
    requestId: string,
    requestPath: string,
  ): Promise<{ data: T; responseId: string }>;
  api<T = unknown>(path: string, options?: RequestInit): Promise<T>;
  beginChatReads(): void;
  abortChatReads(): void;
  isAbortError(error: unknown): boolean;
  chatRead<T = unknown>(path: string): Promise<T>;
}
export const apiActions: Actions = {
  async request(
    this: Context,
    path: string,
    options: RequestInit = {},
  ): Promise<{ response: Response; requestId: string }> {
    const requestId = createId();
    const headers = new Headers(options.headers || {});
    headers.set("X-Request-ID", requestId);
    const response = await fetch(path, {
      ...options,
      cache: "no-store",
      headers,
    });
    return { response, requestId };
  },
  async responseData<T = unknown>(
    this: Context,
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
      const error = this.errorFromResponse(response, responseId, data);
      this.handleUnauthorizedResponse(response, requestPath, error);
      throw error;
    }
    if (data === null) throw new ApiError(`Server returned a non-JSON response (request_id: ${responseId})`);
    return { data: data as T, responseId };
  },
  async api<T = unknown>(this: Context, path: string, options: RequestInit = {}): Promise<T> {
    const requestPath = path.includes("/messages") && !path.includes("?") ? `${path}?mode=${this.mode}` : path;
    const headers = new Headers(options.headers || {});
    if (options.body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const { response, requestId } = await this.request(requestPath, { ...options, headers });
    const { data, responseId } = await this.responseData<T>(response, requestId, requestPath);
    if (data === null) {
      const error = new ApiError(`Server returned a non-JSON response (request_id: ${responseId})`);
      error.requestId = responseId;
      throw error;
    }
    return data;
  },
  beginChatReads(this: Context): void {
    this.abortChatReads();
    this.chatReadController = new AbortController();
  },
  abortChatReads(this: Context): void {
    this.chatReadController?.abort();
    this.chatReadController = null;
  },
  isAbortError(this: Context, error: unknown): boolean {
    return error instanceof Error && error.name === "AbortError";
  },
  chatRead<T = unknown>(this: Context, path: string): Promise<T> {
    return this.api<T>(path, { signal: this.chatReadController?.signal });
  },
};
