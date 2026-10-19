import type * as DTO from "../../shared/types";
import { ApiError, toRecord } from "../../shared/types";
import { validatePiMessage, validateStreamEnvelope } from "../../generated/validators.mjs";

const text = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);
const number = (value: unknown): number | undefined =>
  (typeof value === "number" || typeof value === "string") && Number.isFinite(Number(value))
    ? Number(value)
    : undefined;
function timestamp(value: unknown): string | number | undefined {
  return text(value) ?? number(value);
}
function toolResult(value: unknown): DTO.ToolResult | undefined {
  if (value === null || typeof value !== "object") return undefined;
  const result = toRecord(value),
    details = toRecord(result.details);
  return {
    content: parts(result.content),
    details: { ...details, sourceUrl: text(details.sourceUrl) },
    timestamp: timestamp(result.timestamp),
  };
}
export function toolArguments(value: unknown): DTO.ToolArgs {
  const raw = toRecord(value),
    args: DTO.ToolArgs = { ...raw };
  for (const key of ["path", "pattern", "command", "code", "tool", "query", "url", "arguments"] as const) {
    if (typeof raw[key] === "string") args[key] = raw[key];
    else delete args[key];
  }
  args._webResult = toolResult(raw._webResult);
  args.webResult = toolResult(raw.webResult);
  return args;
}
function parts(value: unknown): DTO.MessagePart[] {
  if (typeof value === "string") return [{ type: "text", text: value }];
  if (!Array.isArray(value)) return [];
  return value.map((value) => {
    const part = toRecord(value);
    if (typeof part.type !== "string") throw new ApiError("Invalid message content from the server");
    return {
      ...part,
      type: part.type,
      text: text(part.text),
      thinking: text(part.thinking),
      id: text(part.id),
      name: text(part.name),
      arguments: typeof part.arguments === "string" ? part.arguments : toolArguments(part.arguments),
      webResult: toolResult(part.webResult),
      _timestamp: timestamp(part._timestamp),
    };
  });
}
export function decodeMessages(value: unknown): DTO.Message[] {
  if (!Array.isArray(value)) throw new ApiError("Invalid message list from the server");
  return value.map((raw) => {
    if (!validatePiMessage(raw)) throw new ApiError("Invalid message from the server");
    const usage = toRecord(raw.usage),
      cost = toRecord(usage.cost),
      details = toRecord(raw.details),
      image = toRecord(details.imageArtifact),
      invocation = toRecord(raw._skill_invocation);
    const attachments = (raw._attachments || []).map((value, index) => ({
      id: text(value.id) || text(value.path) || `attachment:${index}`,
      name: text(value.name) || text(value.filename),
      filename: text(value.filename),
      path: text(value.path),
      media_type: text(value.media_type),
      size: number(value.size) || 0,
    }));
    return {
      ...raw,
      role: raw.role,
      content: parts(raw.content),
      id: raw.id ?? undefined,
      stopReason: raw.stopReason ?? undefined,
      timestamp: timestamp(raw.timestamp),
      toolName: raw.toolName ?? undefined,
      toolCallId: raw.toolCallId ?? undefined,
      display_content: raw.display_content ?? undefined,
      _key: text(raw._key),
      _streaming: raw._streaming === true,
      _thinkingBoundary: raw._thinkingBoundary === true,
      _reasoningParts: Array.isArray(raw._reasoningParts) ? parts(raw._reasoningParts) : undefined,
      _imageArtifacts: Array.isArray(raw._imageArtifacts)
        ? raw._imageArtifacts.flatMap((value) =>
            typeof toRecord(value).path === "string" ? [{ path: String(toRecord(value).path) }] : [],
          )
        : undefined,
      _attachments: attachments,
      _skill_invocation: raw._skill_invocation
        ? { name: text(invocation.name), command: text(invocation.command) }
        : undefined,
      usage: {
        input: number(usage.input),
        output: number(usage.output),
        cacheRead: number(usage.cacheRead),
        cost: { total: number(cost.total) },
      },
      details: {
        ...details,
        path: text(details.path),
        imageArtifact: typeof image.path === "string" ? { path: image.path } : undefined,
      },
    };
  });
}
const eventTypes = new Set(["delta", "thinking_delta", "assistant_message_end", "final", "tool", "error", "complete"]);
export function parseStreamEvent(source: string, requestId?: string): DTO.StreamEvent | null {
  const invalid = () => {
    const error = new ApiError(
      `Invalid streamed event from the server${requestId ? ` (request_id: ${requestId})` : ""}`,
    );
    error.requestId = requestId || "";
    return error;
  };
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw invalid();
  }
  const type = toRecord(value).type;
  // Ignore future event types, but reject malformed variants of the known contract.
  if (typeof type === "string" && !eventTypes.has(type)) return null;
  if (!validateStreamEnvelope(value)) throw invalid();

  return value;
}
