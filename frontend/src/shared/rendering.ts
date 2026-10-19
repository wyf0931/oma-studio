import type { Workspace } from "../app/workspace";

import { marked } from "marked";
import DOMPurify from "dompurify";

import hljs from "highlight.js/lib/common";

import { createId } from "../browser";

import type * as DTO from "./types";

// Explicit dependency contract for this feature; the composition root supplies it.
type Context = Pick<
  Workspace,
  | "activeChat"
  | "browserViewUrl"
  | "escape"
  | "faviconFor"
  | "fileExtension"
  | "fileViewer"
  | "filesOpen"
  | "formatCompactNumber"
  | "highlightCode"
  | "imageArtifactMessage"
  | "imageArtifactUrl"
  | "isCodeFile"
  | "isCsvFile"
  | "linkDrawerItems"
  | "linkDrawerOpen"
  | "linkDrawerTitle"
  | "mode"
  | "normalizeCodeLanguage"
  | "opensInNativeBrowser"
  | "parseCsv"
  | "parseFetchResult"
  | "parseSearchResults"
  | "partsText"
  | "processDisclosure"
  | "processFileName"
  | "processLine"
  | "productionToolAllowlist"
  | "reasoningOpen"
  | "renderCodeFile"
  | "renderCsv"
  | "renderFinalMarkdown"
  | "renderImageArtifact"
  | "renderMarkdown"
  | "renderPart"
  | "renderProcessToolCall"
  | "renderReasoning"
  | "renderReasoningPart"
  | "renderToolResult"
  | "renderUserMessage"
  | "renderWebActivity"
  | "renderWebActivityItems"
  | "sessionUsage"
  | "sharedMode"
  | "sharedToken"
  | "stableMessageKey"
  | "t"
  | "theme"
  | "toolArgs"
  | "truncateLabel"
  | "webActivities"
>;
export interface Actions {
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
  highlightCode(source: string, language: string): string;
  normalizeCodeLanguage(language: string): string;
  renderMarkdown(source: string): string;
  parseCsv(source: string): string[][];
  fileExtension(path: string): string;
  isCsvFile(path: string): boolean;
  isCodeFile(path: string): boolean;
  renderCsv(source: string): string;
  renderCodeFile(source: string, extension: string): string;
  renderFilePreview(): string;
  toolArgs(part: DTO.MessagePart): DTO.ToolArgs;
  renderToolResult(message: DTO.Message): string;
  escape(text: string): string;
  renderWebActivity(name: string, args: DTO.ToolArgs): string | null;
  renderWebActivityItems(name: string, items: DTO.WebItem[]): string;
  parseSearchResults(text: string): DTO.WebItem[];
  parseFetchResult(text: string, result: DTO.ToolResult, args: DTO.ToolArgs): DTO.WebItem[];
  truncateLabel(value: string, limit?: number): string;
  formatCompactNumber(value: unknown): string;
  sessionUsageMarkup(): string;
  faviconFor(url: string): string;
  openWebActivity(button: HTMLElement): void;
  resourceCountLabel(count: number): string;
  fileCountLabel(count: number): string;
  renderReasoning(parts: DTO.MessagePart[], messageKey: string | undefined, isStreaming?: boolean): string;
  renderProcessToolCall(name: string, args: DTO.ToolArgs): string | null;
}
export const renderingActions: Actions = {
  normalizeMessages(this: Context, messages: DTO.Message[]): DTO.Message[] {
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
          _key: this.stableMessageKey(message, index),
        });
        continue;
      }
      if (message.role === "toolResult") {
        const artifact = this.imageArtifactMessage(message, index);
        if (artifact && assistantGroup) assistantGroup._imageArtifacts.push(artifact);
        if (this.mode === "development") {
          flushAssistant();
          archived.push({
            ...message,
            _key: this.stableMessageKey(message, index),
          });
        }
        continue;
      }
      if (message.role === "assistant") {
        if (!assistantGroup)
          assistantGroup = {
            _key: this.stableMessageKey(message, index),
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
      archived.push({ ...message, _key: this.stableMessageKey(message, index) });
    }
    flushAssistant();
    this.sessionUsage = sessionUsage;
    return archived;
  },
  renderMessage(this: Context, message: DTO.Message): string {
    const role = message.role || "message";
    const parts = message.content || [];
    if (role === "user") return this.renderUserMessage(message, parts);
    if (role === "toolResult") return this.mode === "development" ? this.renderToolResult(message) : "";
    if (role === "assistant") {
      const text = this.partsText(parts);
      const reasoning = this.renderReasoning(message._reasoningParts || [], message._key, message._streaming);
      const artifacts = (message._imageArtifacts || []).map((artifact) => this.renderImageArtifact(artifact)).join("");
      if (message._streaming && !text)
        return reasoning || '<span class="loading loading-dots loading-xs" aria-label="Waiting for response"></span>';
      return (
        reasoning +
        artifacts +
        parts.map((part) => (part.type === "text" ? this.renderFinalMarkdown(part) : this.renderPart(part))).join("")
      );
    }
    const fallback = this.partsText(parts);
    return `<div class="system-message"><span>${this.escape(role)}</span>${fallback ? `<p>${this.escape(fallback).replace(/\n/g, "<br>")}</p>` : ""}</div>`;
  },
  renderUserMessage(this: Context, message: DTO.Message, parts: DTO.MessagePart[]): string {
    const text = message.display_content || this.partsText(parts);
    const command = message._skill_invocation?.command;
    const body =
      !command || !text.startsWith(command)
        ? this.escape(text).replace(/\n/g, "<br>")
        : `<span class="skill-invocation-command">${this.escape(command)}</span>${this.escape(text.slice(command.length)).replace(/\n/g, "<br>")}`;
    const attachments = (message._attachments || [])
      .map(
        (file) =>
          `<span class="message-attachment"><i data-lucide="paperclip" aria-hidden="true"></i>${this.escape(`@${file.name}`)}</span>`,
      )
      .join("");
    return attachments ? `<div class="message-attachments">${attachments}</div>${body}` : body;
  },
  imageArtifactMessage(this: Context, message: DTO.Message, _index: number): { path: string } | null {
    if (!["generate_image", "edit_image"].includes(message.toolName || "")) return null;
    const path = message.details?.path;
    if (typeof path !== "string" || !this.opensInNativeBrowser({ extension: this.fileExtension(path) })) return null;
    return { path };
  },
  imageArtifactUrl(this: Context, path: string): string {
    return this.sharedMode
      ? `/api/share/${encodeURIComponent(this.sharedToken)}/files/view?path=${encodeURIComponent(path)}`
      : this.browserViewUrl(this.activeChat?.id || "", path);
  },
  renderImageArtifact(this: Context, message: { path: string }): string {
    const url = this.imageArtifactUrl(message.path);
    return `<a class="chat-image-artifact skeleton" href="${this.escape(url)}" target="_blank" rel="noopener"><img src="${this.escape(url)}" alt="Generated image" loading="lazy" decoding="async" /></a>`;
  },
  renderReasoningPart(this: Context, part: DTO.MessagePart): string {
    if (part.type === "thinking")
      return `<div class="reasoning-text markdown-part">${this.renderMarkdown(part.thinking || "")}</div>`;
    if (part.type === "text")
      return `<div class="reasoning-text markdown-part">${this.renderMarkdown(part.text || "")}</div>`;
    return this.renderPart(part);
  },
  messageVisible(this: Context, message: DTO.Message): boolean {
    if (message.role === "toolResult") return this.mode === "development";
    if (this.mode !== "production" || message.role !== "assistant") return true;
    if (message._streaming) return true;
    return [...(message._reasoningParts || []), ...(message.content || [])].some(
      (part) =>
        part.type === "text" || part.type === "thinking" || this.productionToolAllowlist.includes(part.name || ""),
    );
  },
  partsText(this: Context, parts: DTO.MessagePart[]): string {
    return parts
      .filter((part) => part.type === "text")
      .map((part) => part.text || "")
      .join("");
  },
  renderPart(this: Context, part: DTO.MessagePart): string {
    if (part.type === "text") return `<div class="markdown-part">${this.renderMarkdown(part.text || "")}</div>`;
    if (part.type === "thinking") {
      const value = part.thinking || "";
      return `<details class="process-disclosure"><summary><span class="process-label">Thinking</span></summary><div class="process-detail">${this.escape(value).replace(/\n/g, "<br>")}</div></details>`;
    }
    if (part.type === "toolCall") {
      const name = part.name || "unknown";
      const args = this.toolArgs(part);
      if (this.mode === "production" && !this.productionToolAllowlist.includes(name)) return "";
      const process = this.renderProcessToolCall(name, args);
      if (process !== null) return process;
      const compact = `<span class="tool-kicker">Tool call</span><b>${this.escape(name)}</b>`;
      return `<details class="tool-block"><summary><i class="process-chevron" data-lucide="chevron-right" aria-hidden="true"></i>${compact}<span class="tool-id">${this.escape(part.id || "")}</span></summary><pre>${this.escape(JSON.stringify(args, null, 2))}</pre></details>`;
    }
    return `<details class="tool-block"><summary><i class="process-chevron" data-lucide="chevron-right" aria-hidden="true"></i>${this.escape(part.type || "content")}</summary><pre>${this.escape(JSON.stringify(part, null, 2))}</pre></details>`;
  },
  renderFinalMarkdown(this: Context, part: DTO.MessagePart): string {
    const invert = this.theme === "dark" ? " prose-invert" : "";
    return `<div class="markdown-part prose${invert} max-w-none">${this.renderMarkdown(part.text || "")}</div>`;
  },
  processLine(this: Context, label: string, value: string): string {
    const fullValue = String(value).replace(/\s+/g, " ").trim();
    return `<div class="process-line"><span class="process-label">${this.escape(label)}</span><span class="process-preview" title="${this.escape(fullValue)}">${this.escape(fullValue)}</span></div>`;
  },
  processFileName(this: Context, path: string): string {
    const normalized = String(path || "")
      .trim()
      .replaceAll("\\", "/");
    return normalized.split("/").filter(Boolean).pop() || normalized;
  },
  processDisclosure(
    this: Context,
    label: string,
    value: string,
    detail: string,
    kind: string = "",
    showPreview: boolean = false,
  ): string {
    return `<details class="process-disclosure ${kind ? `${kind}-disclosure` : ""}"><summary><i class="process-chevron" data-lucide="chevron-right" aria-hidden="true"></i><span class="process-label">${this.escape(label)}</span>${showPreview ? `<span class="process-preview">${this.escape(String(value).replace(/\s+/g, " ").trim())}</span>` : ""}</summary><pre class="process-detail-code ${kind ? `${kind}-code` : ""}">${detail}</pre></details>`;
  },
  highlightCode(this: Context, source: string, language: string): string {
    try {
      const normalized = this.normalizeCodeLanguage(language);
      if (hljs?.getLanguage(normalized))
        return DOMPurify.sanitize(hljs.highlight(source, { language: normalized }).value);
    } catch {}
    return this.escape(source);
  },
  normalizeCodeLanguage(this: Context, language: string): string {
    const aliases: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      yml: "yaml",
      sh: "bash",
      shell: "bash",
      zsh: "bash",
      html: "xml",
      svg: "xml",
      md: "markdown",
      jsonc: "json",
    };
    const value = String(language || "")
      .trim()
      .toLowerCase();
    return aliases[value] || value;
  },
  renderMarkdown(this: Context, source: string): string {
    try {
      const doc = new DOMParser().parseFromString(
        DOMPurify.sanitize(marked.parse(source, { async: false })),
        "text/html",
      );
      const root = doc.body;
      root.querySelectorAll("table").forEach((el) => {
        el.className = "table table-zebra";
        const wrapper = doc.createElement("div");
        wrapper.className = "markdown-table-wrap";
        el.replaceWith(wrapper);
        wrapper.appendChild(el);
      });
      root.querySelectorAll("ul").forEach((el) => (el.className = "list-disc pl-6 space-y-1"));
      root.querySelectorAll("ol").forEach((el) => (el.className = "list-decimal pl-6 space-y-1"));
      root.querySelectorAll("blockquote").forEach((el) => (el.className = "border-l-4 border-primary pl-4 opacity-80"));
      root.querySelectorAll("pre").forEach((el) => {
        const code = el.querySelector("code");
        const languageClass = [...(code?.classList || [])].find((name) => name.startsWith("language-"));
        const language = languageClass?.slice("language-".length) || "";
        if (this.normalizeCodeLanguage(language) === "mermaid") {
          const diagram = doc.createElement("div");
          diagram.className = "mermaid";
          diagram.textContent = code?.textContent || "";
          el.replaceWith(diagram);
        } else {
          el.className = "bg-base-200 text-base-content rounded-box p-4 w-full overflow-x-auto my-3";
          if (code) {
            const source = code.textContent || "";
            let highlighted = this.highlightCode(source, language);
            if (!language && hljs?.highlightAuto) {
              const detected = hljs.highlightAuto(source, [
                "bash",
                "javascript",
                "json",
                "python",
                "typescript",
                "yaml",
              ]);
              if (detected.language && detected.relevance >= 2) highlighted = DOMPurify.sanitize(detected.value);
            }
            // pi-lens-ignore: no-inner-html-js
            code.innerHTML = highlighted;
            code.classList.add("hljs");
          }
        }
      });
      return root.innerHTML;
    } catch {
      return this.escape(source).replace(/\n/g, "<br>");
    }
  },
  parseCsv(this: Context, source: string): string[][] {
    const text = String(source || "").replace(/^\uFEFF/, "");
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let quoted = false;
    const finishRow = () => {
      if (!row.length && !field) return;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    };

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (quoted) {
        if (character === '"') {
          if (text[index + 1] === '"') {
            field += '"';
            index += 1;
          } else {
            quoted = false;
          }
        } else {
          field += character;
        }
      } else if (character === '"' && !field) {
        quoted = true;
      } else if (character === ",") {
        row.push(field);
        field = "";
      } else if (character === "\n") {
        finishRow();
      } else if (character !== "\r") {
        field += character;
      }
    }
    finishRow();
    return rows;
  },
  fileExtension(this: Context, path: string): string {
    return (
      String(path || "")
        .split("?")[0]
        ?.split(".")
        .pop()
        ?.toLowerCase() || ""
    );
  },
  isCsvFile(this: Context, path: string): boolean {
    return this.fileExtension(path) === "csv";
  },
  isCodeFile(this: Context, path: string): boolean {
    return [
      "bash",
      "css",
      "html",
      "js",
      "json",
      "jsonl",
      "jsx",
      "py",
      "sh",
      "ts",
      "tsx",
      "txt",
      "xml",
      "yaml",
      "yml",
    ].includes(this.fileExtension(path));
  },
  renderCsv(this: Context, source: string): string {
    const rows = this.parseCsv(source);
    if (!rows.length) return '<p class="opacity-60">Empty CSV file</p>';
    const columnCount = Math.max(...rows.map((row) => row.length));
    const cells = (row: string[], tag: "th" | "td") =>
      Array.from({ length: columnCount }, (_, index) => `<${tag}>${this.escape(row[index] ?? "")}</${tag}>`).join("");
    const header = `<thead><tr>${cells(rows[0]!, "th")}</tr></thead>`;
    const body = rows
      .slice(1)
      .map((row) => `<tr>${cells(row, "td")}</tr>`)
      .join("");
    return `<div class="overflow-x-auto w-full"><table class="table table-zebra csv-table">${header}<tbody>${body}</tbody></table></div>`;
  },
  renderCodeFile(this: Context, source: string, extension: string): string {
    const language = this.normalizeCodeLanguage(extension);
    const highlighted = this.highlightCode(String(source || ""), language);
    const label = this.escape(this.t("files.copyCode"));
    return `<div class="code-block"><button type="button" class="code-copy-btn" data-copy-code="" aria-label="${label}" title="${label}"><span class="code-copy-glyph code-copy-glyph-copy"><i data-lucide="copy" aria-hidden="true"></i></span><span class="code-copy-glyph code-copy-glyph-done"><i data-lucide="check" aria-hidden="true"></i></span></button><div class="mockup-code overflow-x-auto w-full"><pre><code class="hljs language-${this.escape(language)}">${highlighted}</code></pre></div></div>`;
  },
  renderFilePreview(this: Context): string {
    const path = this.fileViewer?.path || "";
    const content = this.fileViewer?.content || "";
    if (this.isCsvFile(path)) return this.renderCsv(content);
    if (this.isCodeFile(path)) return this.renderCodeFile(content, this.fileExtension(path));
    return this.renderMarkdown(content);
  },
  toolArgs(this: Context, part: DTO.MessagePart): DTO.ToolArgs {
    if (part.arguments && typeof part.arguments === "object") return part.arguments;
    try {
      return JSON.parse(part.arguments || "{}");
    } catch {
      return { arguments: part.arguments || "" };
    }
  },
  renderToolResult(this: Context, message: DTO.Message): string {
    const content = this.partsText(message.content || []);
    const label = message.toolName || "Tool result";
    return `<details class="tool-result"><summary><i class="process-chevron" data-lucide="chevron-right" aria-hidden="true"></i><span class="tool-kicker">Tool result</span><b>${this.escape(label)}</b><span class="tool-id">${this.escape(message.toolCallId || "")}</span></summary><pre>${this.escape(content)}</pre></details>`;
  },
  escape(this: Context, text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },
  renderWebActivity(this: Context, name: string, args: DTO.ToolArgs): string | null {
    const result = args._webResult || args.webResult;
    if (!result) return null;
    const text = this.partsText(result.content || []);
    const items = name === "web_search" ? this.parseSearchResults(text) : this.parseFetchResult(text, result, args);
    if (!items.length)
      return this.processLine(
        name === "web_search" ? "Search" : "Read",
        name === "web_search" ? args.query || "" : args.url || "",
      );
    return this.renderWebActivityItems(name, items);
  },
  renderWebActivityItems(this: Context, name: string, items: DTO.WebItem[]): string {
    const key = createId();
    this.webActivities[key] = { kind: name, items };
    const label =
      name === "web_search"
        ? this.t("chat.searchFound", { count: items.length })
        : this.t("chat.readPages", { count: items.length });
    const viewAll =
      items.length > 5 ? `<span class="web-activity-more">${this.escape(this.t("chat.viewAll"))}</span>` : "";
    const pages =
      name === "web_fetch"
        ? `<span class="web-activity-pages">${items
            .slice(0, 5)
            .map(
              (item) =>
                `<a href="${this.escape(item.url)}" title="${this.escape(item.title)}" target="_blank" rel="noopener"><span class="web-activity-page-title">${this.escape(this.truncateLabel(item.title))}</span><i data-lucide="external-link"></i></a>`,
            )
            .join("")}</span>`
        : "";
    const sites =
      name === "web_search"
        ? `<span class="web-activity-sites">${items
            .slice(0, 5)
            .map((item) => (item.favicon ? `<img src="${this.escape(item.favicon)}" alt="" loading="lazy">` : ""))
            .join("")}</span>`
        : "";
    return `<div role="button" tabindex="0" class="web-activity web-activity-${name}" data-web-activity-id="${key}"><span class="web-activity-label">${label}</span>${sites}${pages}${viewAll}<span class="web-activity-arrow"><i data-lucide="chevron-right" aria-hidden="true"></i></span></div>`;
  },
  parseSearchResults(this: Context, text: string): DTO.WebItem[] {
    const items = [];
    const pattern = /(?:^|\n)\s*\d+\.\s+\*\*(.+?)\*\*\s*\n([\s\S]*?)\n(https?:\/\/\S+)/g;
    let match;
    while ((match = pattern.exec(text))) {
      const url = match[3]!.replace(/[)>.,]+$/, "");
      items.push({
        title: match[1]!.trim(),
        snippet: match[2]!.trim(),
        url,
        favicon: this.faviconFor(url),
      });
    }
    return items;
  },
  parseFetchResult(this: Context, text: string, result: DTO.ToolResult, args: DTO.ToolArgs): DTO.WebItem[] {
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
    return [{ title, url, snippet: "", favicon: this.faviconFor(url) }];
  },
  truncateLabel(this: Context, value: string, limit: number = 20): string {
    const characters = [...String(value || "")];
    return characters.length > limit ? `${characters.slice(0, limit).join("")}…` : characters.join("");
  },
  formatCompactNumber(this: Context, value: unknown): string {
    const number = Number(value) || 0;
    if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
    if (number >= 1000) return `${(number / 1000).toFixed(1)}k`;
    return String(Math.round(number));
  },
  sessionUsageMarkup(this: Context): string {
    const usage = this.sessionUsage || {};
    const stat = (icon: string, label: string, value: string) =>
      `<span class="usage-stat" title="${label}"><i data-lucide="${icon}" aria-hidden="true"></i><span>${this.escape(value)}</span></span>`;
    return [
      stat("arrow-up", "Input tokens", this.formatCompactNumber(usage.input)),
      stat("arrow-down", "Output tokens", this.formatCompactNumber(usage.output)),
      stat("zap", "Cached input tokens", this.formatCompactNumber(usage.cacheRead)),
      usage.search || usage.fetch
        ? `<span class="usage-stat usage-tools" title="Web tool calls"><i data-lucide="globe" aria-hidden="true"></i><span>search ${usage.search || 0} · fetch ${usage.fetch || 0}</span></span>`
        : "",
      stat("coins", "Estimated cost", `¥${(Number(usage.cost) || 0).toFixed(2)}`),
    ].join("");
  },
  faviconFor(this: Context, url: string): string {
    try {
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(url).hostname)}&sz=32`;
    } catch {
      return "";
    }
  },
  openWebActivity(this: Context, button: HTMLElement): void {
    const activity = this.webActivities[button.dataset.webActivityId || ""];
    if (!activity) return;
    this.linkDrawerTitle = this.t(activity.kind === "web_search" ? "chat.searchResults" : "chat.readPagesTitle");
    this.linkDrawerItems = activity.items || [];
    this.filesOpen = false;
    this.linkDrawerOpen = true;
  },
  resourceCountLabel(this: Context, count: number): string {
    return this.t("chat.resourceCount", { count });
  },
  fileCountLabel(this: Context, count: number): string {
    return this.t("chat.fileCount", { count });
  },
  renderReasoning(
    this: Context,
    parts: DTO.MessagePart[],
    messageKey: string | undefined,
    isStreaming: boolean = false,
  ): string {
    const entries = [];
    for (const part of parts) {
      if (part.type === "toolCall" && part.name === "web_fetch") {
        const args = this.toolArgs(part);
        const result = args._webResult || part.webResult;
        if (result) {
          const fetchItems = this.parseFetchResult(this.partsText(result.content || []), result, args);
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
        const html = entry.kind
          ? this.renderWebActivityItems(entry.kind, entry.items)
          : this.renderReasoningPart(entry.part!);
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
    const hasPreference = Object.prototype.hasOwnProperty.call(this.reasoningOpen, reasoningKey);
    // The block follows its turn: open while the turn is in flight (there is no
    // answer to read yet), closed once the turn lands. An explicit user toggle in
    // either direction outranks that default and is recorded by setReasoningOpen().
    const checked = (hasPreference ? this.reasoningOpen[reasoningKey] : isStreaming) ? " checked" : "";
    return `<div class="collapse reasoning-collapse"><input type="checkbox" data-reasoning-key="${this.escape(reasoningKey)}"${checked} /><div class="collapse-title process-label"><i data-lucide="sparkle" aria-hidden="true"></i><span>${label}</span><i class="reasoning-chevron" data-lucide="chevron-down" aria-hidden="true"></i></div><div class="collapse-content"><ul class="timeline timeline-compact timeline-snap-icon timeline-vertical reasoning-timeline">${content}</ul></div></div>`;
  },
  renderProcessToolCall(this: Context, name: string, args: DTO.ToolArgs): string | null {
    if (name === "web_search" || name === "web_fetch") return this.renderWebActivity(name, args);
    const renderers: Record<string, () => string> = {
      read: () => (args.path ? this.processLine("Read", this.processFileName(args.path)) : ""),
      write: () => (args.path ? this.processLine("Write", this.processFileName(args.path)) : ""),
      ls: () => (args.path ? this.processLine("List", this.processFileName(args.path)) : ""),
      find: () => (args.pattern && args.path ? this.processLine("Find", `${args.pattern} in ${args.path}`) : ""),
      grep: () => (args.pattern && args.path ? this.processLine("Grep", `${args.pattern} in ${args.path}`) : ""),
      edit: () => (args.path ? this.processLine("Edit", this.processFileName(args.path)) : ""),
      mcp: () => (args.tool ? this.processLine("Use", args.tool) : ""),
      bash: () =>
        args.command
          ? this.processDisclosure("Run", args.command, this.highlightCode(args.command, "bash"), "bash", false)
          : "",
      mcpScript: () =>
        args.code
          ? this.processDisclosure(
              "Run script",
              args.code,
              this.highlightCode(args.code, "javascript"),
              "script",
              false,
            )
          : "",
      project_report: () => "",
    };
    const renderer = renderers[name];
    return renderer ? renderer() : null;
  },
};
