import createClient from "openapi-fetch";
import type { Client } from "openapi-fetch";
import type { paths } from "../generated/api";
import { responseValidators } from "../generated/validators.mjs";
import { ApiError, toRecord } from "./types";
import { createId } from "../browser";
import type { Actions as I18nActions } from "./i18n";

export type HttpClient = Client<paths>;
export interface Actions {
  client: HttpClient;
  resetSession(): void;
  request(path: string, options?: RequestInit): Promise<{ response: Response; requestId: string }>;
  responseData(
    response: Response,
    requestId: string,
    requestPath: string,
  ): Promise<{ data: unknown; responseId: string }>;
  invalidResponse(path: string, requestId: string): ApiError;
}
export type Feature = Actions;
export interface Dependencies {
  baseUrl: string;
  fetch(request: Request): Promise<Response>;
  onUnauthorized(response: Response, path: string, error: ApiError): void;
  i18n: Pick<I18nActions, "t">;
}
export function createApi(deps: Dependencies): Feature {
  let generation = 0;
  const pending = new Set<AbortController>();
  function resetSession(): void {
    generation += 1;
    for (const controller of pending) controller.abort();
    pending.clear();
  }
  async function trackedFetch(request: Request): Promise<Response> {
    const current = generation;
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (request.signal.aborted) abort();
    request.signal.addEventListener("abort", abort, { once: true });
    pending.add(controller);
    request.headers.set("X-Request-ID", createId());
    try {
      const response = await deps.fetch(new Request(request, { cache: "no-store", signal: controller.signal }));
      if (current !== generation) throw new DOMException("Session changed", "AbortError");
      return response;
    } finally {
      pending.delete(controller);
      // Keep caller cancellation linked while a returned streaming body is being read.
    }
  }
  async function request(path: string, options: RequestInit = {}): Promise<{ response: Response; requestId: string }> {
    const input = new Request(new URL(path, deps.baseUrl), options);
    const response = await trackedFetch(input);
    return { response, requestId: input.headers.get("X-Request-ID")! };
  }
  function invalidResponse(path: string, requestId: string): ApiError {
    const error = new ApiError(
      `Server response does not match the API contract for ${path} (request_id: ${requestId})`,
    );
    error.requestId = requestId;
    return error;
  }
  async function responseData(
    response: Response,
    requestId: string,
    requestPath: string,
  ): Promise<{ data: unknown; responseId: string }> {
    const current = generation;
    const responseId = response.headers.get("X-Request-ID") || requestId;
    let data: unknown = null;
    if (response.headers.get("content-type")?.includes("json")) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      await response.text();
    }
    if (current !== generation) throw new DOMException("Session changed", "AbortError");
    if (!response.ok) {
      const payload = toRecord(data);
      const detail = typeof payload.detail === "string" ? payload.detail : `Server returned ${response.status}`;
      const code = typeof payload.code === "string" ? payload.code : "";
      const params = Object.fromEntries(
        Object.entries(toRecord(payload.params)).filter(
          (entry): entry is [string, string | number] => typeof entry[1] === "string" || typeof entry[1] === "number",
        ),
      );
      const message = code ? deps.i18n.t(code, { ...params, defaultValue: detail }) : detail;
      const error = new ApiError(`${message} (request_id: ${responseId})`);
      error.uiMessage = message;
      error.status = response.status;
      error.requestId = responseId;
      error.code = code;
      error.params = params;
      deps.onUnauthorized(response, requestPath, error);
      throw error;
    }
    if (data === null) throw invalidResponse(requestPath, responseId);
    return { data, responseId };
  }
  const client = createClient<paths>({ baseUrl: deps.baseUrl, fetch: trackedFetch });
  client.use({
    async onResponse({ request, response, schemaPath }) {
      const path = new URL(request.url).pathname;
      const { data, responseId } = await responseData(
        response.clone(),
        request.headers.get("X-Request-ID") || "",
        path,
      );
      const validate = responseValidators[`${request.method} ${schemaPath} ${response.status}`];
      if (!validate || !validate(data)) throw invalidResponse(schemaPath, responseId);
      return response;
    },
  });
  return { client, request, responseData, invalidResponse, resetSession };
}
// openapi-fetch has a typed success/error union; middleware throws errors before unwrap.
export function unwrap<T>(result: { data?: T; error?: unknown }): T {
  if (result.data === undefined) throw new ApiError("Server returned no response data");
  return result.data;
}
