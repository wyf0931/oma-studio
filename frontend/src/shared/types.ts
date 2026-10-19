import type { components } from "../generated/api";
export type Page = "chat" | "library" | "file" | "agents" | "market" | "autopilots";
export type User = components["schemas"]["UserResponse"];
export type Agent = components["schemas"]["AgentResponse"];
export type Chat = components["schemas"]["ChatResponse"];
export interface Attachment {
  id: string;
  name?: string;
  filename?: string;
  path?: string;
  media_type?: string | null;
  size: number;
  _localFile?: File;
}
export type Artifact = components["schemas"]["ArtifactResponse"];

export type Resource = components["schemas"]["ResourceResponse"];
export type Model = components["schemas"]["ModelResponse"];
export type Provider = components["schemas"]["ProviderResponse"];
export type Share = components["schemas"]["ShareRecordResponse"];
export type Autopilot = components["schemas"]["AutopilotResponse"];
export type Run = components["schemas"]["AutopilotRunResponse"];
export interface WebItem {
  title: string;
  url: string;
  snippet: string;
  favicon: string;
  date?: string;
}
export interface UsageSummary {
  tools: number;
  sessions: number;
  input: number;
  output: number;
  cacheRead: number;
  cost: number;
  search: number;
  fetch: number;
}
export interface UsageRow extends UsageSummary {
  agent: string;
  createdAt: string;
  id: string;
  date: string;
  title: string;
  name: string;
  agent_id: string;
  username: string;
}
export type SkillResult = components["schemas"]["SkillResultResponse"];
export interface FileViewer {
  chatId: string;
  path: string;
  kind: string;
  isShared: boolean;
  canManageShare: boolean;
  artifactShare: ArtifactShare | null;
  content: string;
}
export interface UploadSelection {
  id: string;
  file: File;
  name: string;
  size: number;
  status: string;
  error: string;
}
export interface MessagePart {
  type: string;
  text?: string;
  thinking?: string;
  id?: string;
  name?: string;
  arguments?: ToolArgs | string;
  webResult?: ToolResult;
  _timestamp?: string | number;
}
export interface ToolResult {
  content: MessagePart[];
  details?: { sourceUrl?: string; [key: string]: unknown };
  timestamp?: string | number;
}
export interface Message {
  role: string;
  content: MessagePart[];
  _key?: string;
  _streaming?: boolean;
  _reasoningParts?: MessagePart[];
  _imageArtifacts?: { path: string }[];
  _attachments?: Attachment[];
  _tools?: unknown[];
  stopReason?: string;
  timestamp?: string | number;
  usage?: { input?: number; output?: number; cacheRead?: number; cost?: { total?: number } };
  id?: string;
  _thinkingBoundary?: boolean;
  _usage?: unknown;
  display_content?: string;
  _skill_invocation?: { command?: string; name?: string };
  toolName?: string;
  toolCallId?: string;
  details?: { path?: string; imageArtifact?: { path: string } };
}
export interface ToolGroup {
  id: string;
  label: string;
  description: string;
  tools: string[];
}
export interface UsageData {
  summary: UsageSummary;
  daily: UsageRow[];
  sessions: UsageRow[];
  users: UsageRow[];
  agents: UsageRow[];
}
export interface UsageInput {
  [key: string]: unknown;
}
export class ApiError extends Error {
  requestId = "";
  uiMessage = "";
  status = 0;
  code = "";
  params: Record<string, string | number> = {};
  sessionExpired = false;
}
export type Resources = components["schemas"]["ResourcesResponse"];

export interface ToolArgs {
  [key: string]: unknown;
  path?: string;
  pattern?: string;
  command?: string;
  code?: string;
  tool?: string;
  query?: string;
  url?: string;
  _webResult?: ToolResult;
  webResult?: ToolResult;
  arguments?: string;
}
export type StreamEvent = components["schemas"]["StreamEnvelope"];
export type TurnEvent = Exclude<StreamEvent, { type: "error" | "complete" }>;
export interface TranslationTree {
  [key: string]: string | TranslationTree;
}
export function asError(value: unknown): ApiError {
  if (value instanceof ApiError) return value;
  const error = new ApiError(value instanceof Error ? value.message : String(value));
  if (value instanceof Error) error.name = value.name;
  return error;
}

export function toRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export interface SharedChat {
  id: string;
  status: "ready";
  title: string;
  agent_id: string;
  created_at: string;
  updated_at: string;
}
export type ActiveChat = Chat | SharedChat;
export type ArtifactShare = components["schemas"]["ArtifactShareResponse"] & { kind: "artifact"; title?: string };
export type Upload = components["schemas"]["UploadResponse"];

export type MessageRequest = components["schemas"]["MessageCreate"];
