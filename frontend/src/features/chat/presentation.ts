import type { State as ShellState } from "../../app/actions";
import type { State as SharesState } from "../shares/actions";
import type { State as ChatState } from "./actions";
import type { State as AgentsState } from "../agents/actions";
import type { State as SettingsState } from "../settings/actions";
import type { Actions as FormatActions } from "../../shared/format";
import type { Actions as ArtifactsActions } from "../artifacts/actions";
import type { Actions as ContentActions } from "../../shared/content";
import type { Actions as I18nActions } from "../../shared/i18n";
import { reactive } from "vue";
import type * as DTO from "../../shared/types";

import { createId } from "../../browser";

import { createPresentationState } from "./presentation-state";
export type State = ReturnType<typeof createPresentationState>;
export interface Actions {
  closeLinkDrawer(): void;
  setReasoningOpen(input: HTMLInputElement): void;
  stableMessageKey(message: DTO.Message, index: number): string;
  messagesFingerprint(messages: DTO.Message[]): string;
  normalizeMessages(messages: DTO.Message[]): DTO.Message[];
  renderMessage(message: DTO.Message): string;
  renderUserMessage(message: DTO.Message, parts: DTO.MessagePart[]): string;
  imageArtifactMessage(message: DTO.Message, _index: number): { path: string } | null;
  imageArtifactUrl(path: string): string;
  renderImageArtifact(message: { path: string }): string;
  renderReasoningPart(part: DTO.MessagePart): string;
  messageVisible(message: DTO.Message): boolean;
  partsText(parts: DTO.MessagePart[]): string;
  renderPart(part: DTO.MessagePart): string;
  renderFinalMarkdown(part: DTO.MessagePart): string;
  processLine(label: string, value: string): string;
  processFileName(path: string): string;
  processDisclosure(label: string, value: string, detail: string, kind?: string, showPreview?: boolean): string;
  toolArgs(part: DTO.MessagePart): DTO.ToolArgs;
  renderToolResult(message: DTO.Message): string;
  renderWebActivity(name: string, args: DTO.ToolArgs): string | null;
  renderWebActivityItems(name: string, items: DTO.WebItem[]): string;
  parseSearchResults(text: string): DTO.WebItem[];
  parseFetchResult(text: string, result: DTO.ToolResult, args: DTO.ToolArgs): DTO.WebItem[];
  truncateLabel(value: string, limit?: number): string;
  sessionUsageMarkup(): string;
  faviconFor(url: string): string;
  openWebActivity(button: HTMLElement): void;
  renderReasoning(parts: DTO.MessagePart[], messageKey: string | undefined, isStreaming?: boolean): string;
  renderProcessToolCall(name: string, args: DTO.ToolArgs): string | null;
}
export interface Feature extends Actions {
  state: State;
}
export interface Dependencies {
  shell: { state: Readonly<Pick<ShellState, "mode">> };
  shares: { state: Readonly<Pick<SharesState, "sharedMode" | "sharedToken">> };
  chat: { state: Readonly<Pick<ChatState, "activeChat">> };
  agents: { state: Readonly<Pick<AgentsState, "productionToolAllowlist">> };
  settings: { state: Readonly<Pick<SettingsState, "theme">> };
  format: Pick<FormatActions, "escape" | "formatCompactNumber">;
  artifacts: Pick<ArtifactsActions, "browserViewUrl" | "closeFiles" | "opensInNativeBrowser">;
  content: Pick<ContentActions, "fileExtension" | "highlightCode" | "renderMarkdown">;
  i18n: Pick<I18nActions, "t">;
}
export function createPresentation(deps: Dependencies): Feature {
  const state = reactive(createPresentationState());
  function setReasoningOpen(input: HTMLInputElement): void {
    const key = input.dataset.reasoningKey;
    if (key) state.reasoningOpen[key] = input.checked;
  }
  function stableMessageKey(message: DTO.Message, index: number): string {
    return message.id || `${message.role || "message"}:${message.timestamp || ""}:${index}`;
  }
  function messagesFingerprint(messages: DTO.Message[]): string {
    return messages
      .map((message) => {
        const parts = (message.content || [])
          .map(
            (part) =>
              `${part.type || ""}:${part.text || part.thinking || part.name || ""}:${JSON.stringify(part.arguments || "")}`,
          )
          .join("\u001f");
        return `${message.role || ""}|${message.stopReason || ""}|${message._streaming ? "1" : "0"}|${JSON.stringify(message._usage || {})}|${parts}`;
      })
      .join("\u001e");
  }
  function normalizeMessages(messages: DTO.Message[]): DTO.Message[] {
    const archived: DTO.Message[] = [];
    const sessionUsage = {
      input: 0,
      output: 0,
      cacheRead: 0,
      cost: 0,
      search: 0,
      fetch: 0,
    };
    let assistantGroup:
      (DTO.Message & { _reasoningParts: DTO.MessagePart[]; _imageArtifacts: { path: string }[] }) | null = null;
    const flushAssistant = () => {
      if (assistantGroup) {
        if (
          assistantGroup._reasoningParts.length ||
          assistantGroup._imageArtifacts.length ||
          assistantGroup.content.length ||
          assistantGroup._streaming
        )
          archived.push(assistantGroup);
        assistantGroup = null;
      }
    };
    for (const [index, message] of messages.entries()) {
      if (message.role === "user") {
        flushAssistant();
        archived.push({
          ...message,
          _key: stableMessageKey(message, index),
        });
        continue;
      }
      if (message.role === "toolResult") {
        const artifact = imageArtifactMessage(message, index);
        if (artifact && assistantGroup) assistantGroup._imageArtifacts.push(artifact);
        if (deps.shell.state.mode === "development") {
          flushAssistant();
          archived.push({
            ...message,
            _key: stableMessageKey(message, index),
          });
        }
        continue;
      }
      if (message.role === "assistant") {
        if (!assistantGroup)
          assistantGroup = {
            _key: stableMessageKey(message, index),
            role: "assistant",
            content: [],
            _reasoningParts: [],
            _imageArtifacts: [],
            _streaming: false,
          };
        const hasToolCall =
          (message.content || []).some((part) => part.type === "toolCall") || message.stopReason === "toolUse";
        const usage = message.usage || {};
        sessionUsage.input += Number(usage.input) || 0;
        sessionUsage.output += Number(usage.output) || 0;
        sessionUsage.cacheRead += Number(usage.cacheRead) || 0;
        sessionUsage.cost += Number(usage.cost?.total) || 0;
        for (const part of message.content || []) {
          if (part.type !== "toolCall") continue;
          if (part.name === "web_search") sessionUsage.search += 1;
          if (part.name === "web_fetch") sessionUsage.fetch += 1;
        }
        const isFinal =
          !hasToolCall &&
          ["stop", "length", "aborted", "error"].includes(message.stopReason || "") &&
          (message.content || []).some((part) => part.type === "text");
        for (const part of message.content || []) {
          if (part.type === "thinking" || !isFinal || part.type !== "text") assistantGroup._reasoningParts.push(part);
          else assistantGroup.content.push(part);
        }
        assistantGroup._streaming = assistantGroup._streaming || Boolean(message._streaming);
        continue;
      }
      flushAssistant();
      archived.push({ ...message, _key: stableMessageKey(message, index) });
    }
    flushAssistant();
    state.sessionUsage = sessionUsage;
    return archived;
  }
  function renderMessage(message: DTO.Message): string {
    const role = message.role || "message";
    const parts = message.content || [];
    if (role === "user") return renderUserMessage(message, parts);
    if (role === "toolResult") return deps.shell.state.mode === "development" ? renderToolResult(message) : "";
    if (role === "assistant") {
      const text = partsText(parts);
      const reasoning = renderReasoning(message._reasoningParts || [], message._key, message._streaming);
      const artifacts = (message._imageArtifacts || []).map((artifact) => renderImageArtifact(artifact)).join("");
      if (message._streaming && !text)
        return reasoning || '<span class="loading loading-dots loading-xs" aria-label="Waiting for response"></span>';
      return (
        reasoning +
        artifacts +
        parts.map((part) => (part.type === "text" ? renderFinalMarkdown(part) : renderPart(part))).join("")
      );
    }
    const fallback = partsText(parts);
    return `<div class="system-message"><span>${deps.format.escape(role)}</span>${fallback ? `<p>${deps.format.escape(fallback).replace(/\n/g, "<br>")}</p>` : ""}</div>`;
  }
  function renderUserMessage(message: DTO.Message, parts: DTO.MessagePart[]): string {
    const text = message.display_content || partsText(parts);
    const command = message._skill_invocation?.command;
    const body =
      !command || !text.startsWith(command)
        ? deps.format.escape(text).replace(/\n/g, "<br>")
        : `<span class="skill-invocation-command">${deps.format.escape(command)}</span>${deps.format.escape(text.slice(command.length)).replace(/\n/g, "<br>")}`;
    const attachments = (message._attachments || [])
      .map(
        (file) =>
          `<span class="message-attachment"><i data-lucide="paperclip" aria-hidden="true"></i>${deps.format.escape(`@${file.name}`)}</span>`,
      )
      .join("");
    return attachments ? `<div class="message-attachments">${attachments}</div>${body}` : body;
  }
  function imageArtifactMessage(message: DTO.Message, _index: number): { path: string } | null {
    if (!["generate_image", "edit_image"].includes(message.toolName || "")) return null;
    const path = message.details?.path;
    if (
      typeof path !== "string" ||
      !deps.artifacts.opensInNativeBrowser({ extension: deps.content.fileExtension(path) })
    )
      return null;
    return { path };
  }
  function imageArtifactUrl(path: string): string {
    return deps.shares.state.sharedMode
      ? `/api/share/${encodeURIComponent(deps.shares.state.sharedToken)}/files/view?path=${encodeURIComponent(path)}`
      : deps.artifacts.browserViewUrl(deps.chat.state.activeChat?.id || "", path);
  }
  function renderImageArtifact(message: { path: string }): string {
    const url = imageArtifactUrl(message.path);
    return `<a class="chat-image-artifact skeleton" href="${deps.format.escape(url)}" target="_blank" rel="noopener"><img src="${deps.format.escape(url)}" alt="Generated image" loading="lazy" decoding="async" /></a>`;
  }
  function renderReasoningPart(part: DTO.MessagePart): string {
    if (part.type === "thinking")
      return `<div class="reasoning-text markdown-part">${deps.content.renderMarkdown(part.thinking || "")}</div>`;
    if (part.type === "text")
      return `<div class="reasoning-text markdown-part">${deps.content.renderMarkdown(part.text || "")}</div>`;
    return renderPart(part);
  }
  function messageVisible(message: DTO.Message): boolean {
    if (message.role === "toolResult") return deps.shell.state.mode === "development";
    if (deps.shell.state.mode !== "production" || message.role !== "assistant") return true;
    if (message._streaming) return true;
    return [...(message._reasoningParts || []), ...(message.content || [])].some(
      (part) =>
        part.type === "text" ||
        part.type === "thinking" ||
        deps.agents.state.productionToolAllowlist.includes(part.name || ""),
    );
  }
  function partsText(parts: DTO.MessagePart[]): string {
    return parts
      .filter((part) => part.type === "text")
      .map((part) => part.text || "")
      .join("");
  }
  function renderPart(part: DTO.MessagePart): string {
    if (part.type === "text") return `<div class="markdown-part">${deps.content.renderMarkdown(part.text || "")}</div>`;
    if (part.type === "thinking") {
      const value = part.thinking || "";
      return `<details class="process-disclosure"><summary><span class="process-label">Thinking</span></summary><div class="process-detail">${deps.format.escape(value).replace(/\n/g, "<br>")}</div></details>`;
    }
    if (part.type === "toolCall") {
      const name = part.name || "unknown";
      const args = toolArgs(part);
      if (deps.shell.state.mode === "production" && !deps.agents.state.productionToolAllowlist.includes(name))
        return "";
      const process = renderProcessToolCall(name, args);
      if (process !== null) return process;
      const compact = `<span class="tool-kicker">Tool call</span><b>${deps.format.escape(name)}</b>`;
      return `<details class="tool-block"><summary><i class="process-chevron" data-lucide="chevron-right" aria-hidden="true"></i>${compact}<span class="tool-id">${deps.format.escape(part.id || "")}</span></summary><pre>${deps.format.escape(JSON.stringify(args, null, 2))}</pre></details>`;
    }
    return `<details class="tool-block"><summary><i class="process-chevron" data-lucide="chevron-right" aria-hidden="true"></i>${deps.format.escape(part.type || "content")}</summary><pre>${deps.format.escape(JSON.stringify(part, null, 2))}</pre></details>`;
  }
  function renderFinalMarkdown(part: DTO.MessagePart): string {
    const invert = deps.settings.state.theme === "dark" ? " prose-invert" : "";
    return `<div class="markdown-part prose${invert} max-w-none">${deps.content.renderMarkdown(part.text || "")}</div>`;
  }
  function processLine(label: string, value: string): string {
    const fullValue = String(value).replace(/\s+/g, " ").trim();
    return `<div class="process-line"><span class="process-label">${deps.format.escape(label)}</span><span class="process-preview" title="${deps.format.escape(fullValue)}">${deps.format.escape(fullValue)}</span></div>`;
  }
  function processFileName(path: string): string {
    const normalized = String(path || "")
      .trim()
      .replaceAll("\\", "/");
    return normalized.split("/").filter(Boolean).pop() || normalized;
  }
  function processDisclosure(
    label: string,
    value: string,
    detail: string,
    kind: string = "",
    showPreview: boolean = false,
  ): string {
    return `<details class="process-disclosure ${kind ? `${kind}-disclosure` : ""}"><summary><i class="process-chevron" data-lucide="chevron-right" aria-hidden="true"></i><span class="process-label">${deps.format.escape(label)}</span>${showPreview ? `<span class="process-preview">${deps.format.escape(String(value).replace(/\s+/g, " ").trim())}</span>` : ""}</summary><pre class="process-detail-code ${kind ? `${kind}-code` : ""}">${detail}</pre></details>`;
  }
  function toolArgs(part: DTO.MessagePart): DTO.ToolArgs {
    if (part.arguments && typeof part.arguments === "object") return part.arguments;
    try {
      return JSON.parse(part.arguments || "{}");
    } catch {
      return { arguments: part.arguments || "" };
    }
  }
  function renderToolResult(message: DTO.Message): string {
    const content = partsText(message.content || []);
    const label = message.toolName || "Tool result";
    return `<details class="tool-result"><summary><i class="process-chevron" data-lucide="chevron-right" aria-hidden="true"></i><span class="tool-kicker">Tool result</span><b>${deps.format.escape(label)}</b><span class="tool-id">${deps.format.escape(message.toolCallId || "")}</span></summary><pre>${deps.format.escape(content)}</pre></details>`;
  }
  function renderWebActivity(name: string, args: DTO.ToolArgs): string | null {
    const result = args._webResult || args.webResult;
    if (!result) return null;
    const text = partsText(result.content || []);
    const items = name === "web_search" ? parseSearchResults(text) : parseFetchResult(text, result, args);
    if (!items.length)
      return processLine(
        name === "web_search" ? "Search" : "Read",
        name === "web_search" ? args.query || "" : args.url || "",
      );
    return renderWebActivityItems(name, items);
  }
  function renderWebActivityItems(name: string, items: DTO.WebItem[]): string {
    const key = createId();
    state.webActivities[key] = { kind: name, items };
    const label =
      name === "web_search"
        ? deps.i18n.t("chat.searchFound", { count: items.length })
        : deps.i18n.t("chat.readPages", { count: items.length });
    const viewAll =
      items.length > 5
        ? `<span class="web-activity-more">${deps.format.escape(deps.i18n.t("chat.viewAll"))}</span>`
        : "";
    const pages =
      name === "web_fetch"
        ? `<span class="web-activity-pages">${items
            .slice(0, 5)
            .map(
              (item) =>
                `<a href="${deps.format.escape(item.url)}" title="${deps.format.escape(item.title)}" target="_blank" rel="noopener"><span class="web-activity-page-title">${deps.format.escape(truncateLabel(item.title))}</span><i data-lucide="external-link"></i></a>`,
            )
            .join("")}</span>`
        : "";
    const sites =
      name === "web_search"
        ? `<span class="web-activity-sites">${items
            .slice(0, 5)
            .map((item) =>
              item.favicon ? `<img src="${deps.format.escape(item.favicon)}" alt="" loading="lazy">` : "",
            )
            .join("")}</span>`
        : "";
    return `<div role="button" tabindex="0" class="web-activity web-activity-${name}" data-web-activity-id="${key}"><span class="web-activity-label">${label}</span>${sites}${pages}${viewAll}<span class="web-activity-arrow"><i data-lucide="chevron-right" aria-hidden="true"></i></span></div>`;
  }
  function parseSearchResults(text: string): DTO.WebItem[] {
    const items = [];
    const pattern = /(?:^|\n)\s*\d+\.\s+\*\*(.+?)\*\*\s*\n([\s\S]*?)\n(https?:\/\/\S+)/g;
    let match;
    while ((match = pattern.exec(text))) {
      const url = match[3]!.replace(/[)>.,]+$/, "");
      items.push({
        title: match[1]!.trim(),
        snippet: match[2]!.trim(),
        url,
        favicon: faviconFor(url),
      });
    }
    return items;
  }
  function parseFetchResult(text: string, result: DTO.ToolResult, args: DTO.ToolArgs): DTO.WebItem[] {
    const url = result.details?.sourceUrl || args.url || "";
    if (!url) return [];
    const titleLine = text.match(/^\s*Title:\s*(.+)$/im)?.[1]?.trim();
    const heading = text.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim();
    let title = titleLine || heading || "";
    if (/^(?:url(?:\s+source)?:\s*)?https?:\/\//i.test(title)) title = heading || "";
    try {
      title = title || new URL(url).hostname;
    } catch {
      title = title || url;
    }
    return [{ title, url, snippet: "", favicon: faviconFor(url) }];
  }
  function truncateLabel(value: string, limit: number = 20): string {
    const characters = [...String(value || "")];
    return characters.length > limit ? `${characters.slice(0, limit).join("")}…` : characters.join("");
  }
  function sessionUsageMarkup(): string {
    const usage = state.sessionUsage || {};
    const stat = (icon: string, label: string, value: string) =>
      `<span class="usage-stat" title="${label}"><i data-lucide="${icon}" aria-hidden="true"></i><span>${deps.format.escape(value)}</span></span>`;
    return [
      stat("arrow-up", "Input tokens", deps.format.formatCompactNumber(usage.input)),
      stat("arrow-down", "Output tokens", deps.format.formatCompactNumber(usage.output)),
      stat("zap", "Cached input tokens", deps.format.formatCompactNumber(usage.cacheRead)),
      usage.search || usage.fetch
        ? `<span class="usage-stat usage-tools" title="Web tool calls"><i data-lucide="globe" aria-hidden="true"></i><span>search ${usage.search || 0} · fetch ${usage.fetch || 0}</span></span>`
        : "",
      stat("coins", "Estimated cost", `¥${(Number(usage.cost) || 0).toFixed(2)}`),
    ].join("");
  }
  function faviconFor(url: string): string {
    try {
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(url).hostname)}&sz=32`;
    } catch {
      return "";
    }
  }
  function openWebActivity(button: HTMLElement): void {
    const activity = state.webActivities[button.dataset.webActivityId || ""];
    if (!activity) return;
    state.linkDrawerTitle = deps.i18n.t(activity.kind === "web_search" ? "chat.searchResults" : "chat.readPagesTitle");
    state.linkDrawerItems = activity.items || [];
    deps.artifacts.closeFiles();
    state.linkDrawerOpen = true;
  }
  function renderReasoning(
    parts: DTO.MessagePart[],
    messageKey: string | undefined,
    isStreaming: boolean = false,
  ): string {
    const entries = [];
    for (const part of parts) {
      if (part.type === "toolCall" && part.name === "web_fetch") {
        const args = toolArgs(part);
        const result = args._webResult || part.webResult;
        if (result) {
          const fetchItems = parseFetchResult(partsText(result.content || []), result, args);
          if (fetchItems.length) {
            const previous = entries[entries.length - 1];
            if (previous?.kind === "web_fetch") previous.items.push(...fetchItems);
            else entries.push({ kind: "web_fetch", items: fetchItems });
            continue;
          }
        }
      }
      entries.push({ part });
    }
    const items = entries
      .map((entry) => {
        const html = entry.kind ? renderWebActivityItems(entry.kind, entry.items) : renderReasoningPart(entry.part!);
        const toolName = entry.kind || entry.part?.name;
        return html
          ? {
              html,
              marker: toolName === "web_search" ? "globe" : toolName === "web_fetch" ? "globe" : "dot",
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
    const content = items
      .map(
        (item, index) =>
          `<li><hr class="${index === 0 ? "invisible" : ""}" /><div class="timeline-start">${item.html}</div><div class="timeline-middle">${item.marker === "globe" ? `<i data-lucide="globe" aria-hidden="true"></i>` : '<span class="reasoning-dot">•</span>'}</div>${index < items.length - 1 ? "<hr />" : ""}</li>`,
      )
      .join("");
    if (!content) return "";
    const times = parts
      .flatMap((part) => [part._timestamp, part.webResult?.timestamp])
      .map((value) => (typeof value === "number" ? value : Date.parse(String(value || ""))))
      .filter(Number.isFinite);
    const seconds = times.length > 1 ? Math.max(1, Math.round((Math.max(...times) - Math.min(...times)) / 1000)) : null;
    const label = isStreaming ? "Thinking" : seconds === null ? "Thought" : `Thought for ${seconds}s`;
    const reasoningKey = `${messageKey || "message"}:reasoning`;
    const hasPreference = Object.prototype.hasOwnProperty.call(state.reasoningOpen, reasoningKey);
    // The block follows its turn: open while the turn is in flight (there is no
    // answer to read yet), closed once the turn lands. An explicit user toggle in
    // either direction outranks that default and is recorded by setReasoningOpen().
    const checked = (hasPreference ? state.reasoningOpen[reasoningKey] : isStreaming) ? " checked" : "";
    return `<div class="collapse reasoning-collapse"><input type="checkbox" data-reasoning-key="${deps.format.escape(reasoningKey)}"${checked} /><div class="collapse-title process-label"><i data-lucide="sparkle" aria-hidden="true"></i><span>${label}</span><i class="reasoning-chevron" data-lucide="chevron-down" aria-hidden="true"></i></div><div class="collapse-content"><ul class="timeline timeline-compact timeline-snap-icon timeline-vertical reasoning-timeline">${content}</ul></div></div>`;
  }
  function renderProcessToolCall(name: string, args: DTO.ToolArgs): string | null {
    if (name === "web_search" || name === "web_fetch") return renderWebActivity(name, args);
    const renderers: Record<string, () => string> = {
      read: () => (args.path ? processLine("Read", processFileName(args.path)) : ""),
      write: () => (args.path ? processLine("Write", processFileName(args.path)) : ""),
      ls: () => (args.path ? processLine("List", processFileName(args.path)) : ""),
      find: () => (args.pattern && args.path ? processLine("Find", `${args.pattern} in ${args.path}`) : ""),
      grep: () => (args.pattern && args.path ? processLine("Grep", `${args.pattern} in ${args.path}`) : ""),
      edit: () => (args.path ? processLine("Edit", processFileName(args.path)) : ""),
      mcp: () => (args.tool ? processLine("Use", args.tool) : ""),
      bash: () =>
        args.command
          ? processDisclosure("Run", args.command, deps.content.highlightCode(args.command, "bash"), "bash", false)
          : "",
      mcpScript: () =>
        args.code
          ? processDisclosure(
              "Run script",
              args.code,
              deps.content.highlightCode(args.code, "javascript"),
              "script",
              false,
            )
          : "",
      project_report: () => "",
    };
    const renderer = renderers[name];
    return renderer ? renderer() : null;
  }
  function closeLinkDrawer(): void {
    state.linkDrawerOpen = false;
  }
  return {
    state,
    setReasoningOpen,
    stableMessageKey,
    messagesFingerprint,
    normalizeMessages,
    renderMessage,
    renderUserMessage,
    imageArtifactMessage,
    imageArtifactUrl,
    renderImageArtifact,
    renderReasoningPart,
    messageVisible,
    partsText,
    renderPart,
    renderFinalMarkdown,
    processLine,
    processFileName,
    processDisclosure,
    toolArgs,
    renderToolResult,
    renderWebActivity,
    renderWebActivityItems,
    parseSearchResults,
    parseFetchResult,
    truncateLabel,
    sessionUsageMarkup,
    faviconFor,
    openWebActivity,
    renderReasoning,
    renderProcessToolCall,
    closeLinkDrawer,
  };
}
