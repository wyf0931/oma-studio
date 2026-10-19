export type Page = "chat" | "library" | "file" | "agents" | "market" | "autopilots";
export interface User {
  id: string;
  username: string;
  nickname: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  last_login_at: string | null;
}
export interface Agent {
  id: string;
  name: string;
  description: string;
  instruction: string;
  tags: string[];
  quickstarts: string[];
  provider: string;
  model: string;
  thinking_level: string;
  tools: string[];
  extensions: string[];
  skills: string[];
  mcp_servers: string[];
  protected: boolean;
  avatar: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
  marketplace_update_available: boolean;
  installed_agent_ids: string[];
  version: string;
  avatar_available: boolean;
  avatar_path: string;
  author: string;
  marketplace_latest_version: string;
  installation_status: string;
  install_count: number;
}
export interface Chat {
  id: string;
  agent_id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}
export interface Attachment {
  id: string;
  name?: string;
  filename?: string;
  path?: string;
  media_type?: string;
  size: number;
  _localFile?: File;
}
export interface Artifact extends Attachment {
  path: string;
  name: string;
  filename?: string;
  media_type?: string;
  chat_id?: string;
  agent_id?: string;
  created_at?: string;
  kind?: string;
  url?: string;
  extension?: string;
  generated_at?: string;
  agent_name?: string;
}

export interface Resource {
  id: string;
  name: string;
  path: string;
  description: string;
  source: string;
  author: string;
}
export interface Model {
  id: string;
  name: string;
  reasoning: boolean;
  thinking_levels: string[];
}
export interface Provider {
  id: string;
  name: string;
  models: Model[];
}
export interface Share {
  token: string;
  url: string;
  title: string;
  chat_title: string;
  target: string;
  created_at: string;
  expires_at: string;
  kind: string;
  revoked_at: string | null;
  path: string;
}
export interface Autopilot {
  id: string;
  name: string;
  instruction: string;
  agent_id: string;
  cron: string;
  starts_at: string;
  ends_at: string;
  enabled: boolean;
  status: string;
  created_at: string;
  next_run_at: string;
  last_run_at: string;
  last_status: string;
  agent_name: string;
}
export interface Run {
  id: string;
  chat_id: string;
  status: string;
  error: string;
  started_at: string;
  finished_at: string;
  trigger: string;
  duration_ms: number | null;
}
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
export interface SkillResult {
  repo: string;
  skill: string;
  name: string;
  description: string;
  source: string;
  url: string;
  installs: number;
  owner: string;
}
export interface FileViewer {
  chatId: string;
  path: string;
  kind: string;
  isShared: boolean;
  canManageShare: boolean;
  artifactShare: Share | null;
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
  _skill_invocation?: { command: string; name?: string };
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
export interface Resources {
  extensions: Resource[];
  skills: Resource[];
  mcp_servers: Resource[];
  providers: Provider[];
  default_tools: string[];
  default_extensions: string[];
  default_skills: string[];
  default_mcp_servers: string[];
  mode: string;
  default_thinking_level: string;
  default_provider: string;
  default_model: string;
  tools: { name: string; description: string }[];
}

export interface ToolArgs {
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
export type TurnEvent =
  | { type: "delta" | "thinking_delta"; delta: string }
  | { type: "assistant_message_end" }
  | { type: "final"; text: string }
  | { type: "tool"; name?: string; arguments?: ToolArgs };
export type StreamEvent =
  | TurnEvent
  | { type: "error"; error: string }
  | { type: "complete"; chat: Chat; messages?: Message[]; assistant?: string };
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
