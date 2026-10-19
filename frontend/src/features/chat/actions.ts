import { ApiError, asError } from "../../shared/types";
import type { Workspace } from "../../app/workspace";
import { nextTick } from "vue";

import { createId, writeClipboardText } from "../../browser";

import type * as DTO from "../../shared/types";

// Explicit dependency contract for this feature; the composition root supplies it.
type Context = Pick<
  Workspace,
  | "abortChatReads"
  | "activeChat"
  | "agentName"
  | "agentPickerOpen"
  | "agents"
  | "api"
  | "beginChatReads"
  | "cancelEditingChatTitle"
  | "chatRead"
  | "chatSearchAgentFilter"
  | "chatSearchAgentPickerOpen"
  | "chatSearchQuery"
  | "chatTitleDraft"
  | "chatTitleSaving"
  | "chatViewToken"
  | "chats"
  | "chooseSkillCommand"
  | "copiedKey"
  | "deleteChatTarget"
  | "draft"
  | "editingChatTitle"
  | "error"
  | "escape"
  | "files"
  | "filesOpen"
  | "filesTab"
  | "finishWatch"
  | "handleTurnEvent"
  | "inputFiles"
  | "isAbortError"
  | "loading"
  | "markStreamingAssistantMessageEnd"
  | "messageVisible"
  | "messages"
  | "messagesFingerprint"
  | "messagesLoading"
  | "mode"
  | "modeQuery"
  | "newChat"
  | "normalizeMessages"
  | "normalizeResourcePath"
  | "openChat"
  | "page"
  | "partsText"
  | "pendingArtifacts"
  | "pendingAttachments"
  | "pendingUploads"
  | "pollTimer"
  | "reasoningOpen"
  | "refreshOpenFiles"
  | "request"
  | "resetConversationInput"
  | "resetShare"
  | "resources"
  | "responseData"
  | "scrollMessagesToLatest"
  | "searchOpen"
  | "selectedAgentId"
  | "sendMessage"
  | "setMessagesIfChanged"
  | "sharedMode"
  | "showError"
  | "skillCommandDismissed"
  | "skillCommandIndex"
  | "skillCommandItems"
  | "skillCommandMatch"
  | "skillCommandVisible"
  | "startPolling"
  | "stopPolling"
  | "stopWatching"
  | "streamSource"
  | "updateStreamingAssistant"
  | "updateStreamingThinking"
  | "uploadFiles"
  | "uploadSelection"
  | "watchChat"
  | "watchingChat"
>;
export interface Actions {
  loadChats(): Promise<void>;
  startEditingChatTitle(): void;
  cancelEditingChatTitle(): void;
  saveChatTitle(): Promise<void>;
  openChatSearch(): void;
  searchChatResults(): DTO.Chat[];
  selectChatSearchAgent(agentId: string): void;
  selectSearchChat(chat: DTO.Chat): void;
  newChat(): void;
  openChat(chat: DTO.Chat, updateUrl?: boolean): Promise<void>;
  sendFirst(): Promise<void>;
  skillCommandMatch(): { query: string; hasPrefix: boolean } | null;
  skillCommandItems(): DTO.Resource[];
  skillCommandVisible(): boolean;
  updateSkillCommandState(): void;
  handleSkillCommandKeydown(event: KeyboardEvent): void;
  chooseSkillCommand(skill: DTO.Resource): void;
  skillCommandHighlightHtml(): string;
  syncSkillCommandScroll(event: Event): void;
  sendMessage(): Promise<void>;
  markStreamingAssistantMessageEnd(): void;
  updateStreamingAssistant(value: string, append: boolean): void;
  updateStreamingThinking(value: string): void;
  handleTurnEvent(event: DTO.TurnEvent): void;
  watchChat(chatId: string): Promise<void>;
  finishWatch(chatId: string, viewToken?: number): Promise<void>;
  startPolling(chatId: string, viewToken?: number): void;
  stopPolling(): void;
  stopWatching(): void;
  setReasoningOpen(input: HTMLInputElement): void;
  stableMessageKey(message: DTO.Message, index: number): string;
  messagesFingerprint(messages: DTO.Message[]): string;
  setMessagesIfChanged(rawMessages: DTO.Message[]): DTO.Message[];
  isActionableAssistant(message: DTO.Message): boolean;
  copyMessage(message: DTO.Message): Promise<void>;
  copyCodeBlock(button: HTMLElement & { _copyTimer?: ReturnType<typeof setTimeout> }): Promise<void>;
  abort(): Promise<void>;
  deleteChat(chat: DTO.Chat): void;
  confirmDeleteChat(): Promise<void>;
}
export const chatActions: Actions = {
  async loadChats(this: Context): Promise<void> {
    try {
      this.chats = (await this.api<{ chats: DTO.Chat[] }>("/api/chats")).chats;
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    }
  },
  startEditingChatTitle(this: Context): void {
    if (this.sharedMode || !this.activeChat) return;
    this.chatTitleDraft = this.activeChat.title || "";
    this.editingChatTitle = true;
    nextTick(() => {
      document.getElementById("chat-title-input")?.focus();
    });
  },
  cancelEditingChatTitle(this: Context): void {
    this.editingChatTitle = false;
    this.chatTitleDraft = "";
  },
  async saveChatTitle(this: Context): Promise<void> {
    if (!this.editingChatTitle || this.chatTitleSaving) return;
    const chatId = this.activeChat?.id;
    if (!chatId) return;
    const title = this.chatTitleDraft.trim();
    if (!title) {
      this.showError(new ApiError("Chat title cannot be empty"));
      this.chatTitleDraft = this.activeChat?.title || "";
      return;
    }
    this.chatTitleSaving = true;
    try {
      const updated = await this.api<DTO.Chat>(`/api/chats/${chatId}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      if (this.activeChat?.id === chatId) {
        this.activeChat = updated;
        const sidebarChat = this.chats.find((chat) => chat.id === updated.id);
        if (sidebarChat) Object.assign(sidebarChat, updated);
        document.title = `${updated.title} · OMA studio`;
        this.cancelEditingChatTitle();
      }
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    } finally {
      this.chatTitleSaving = false;
    }
  },
  openChatSearch(this: Context): void {
    this.chatSearchQuery = "";
    this.chatSearchAgentFilter = "";
    this.chatSearchAgentPickerOpen = false;
    this.searchOpen = true;
  },
  searchChatResults(this: Context): DTO.Chat[] {
    const query = this.chatSearchQuery.trim().toLowerCase();
    const matches = this.chats.filter((chat) => {
      const matchesAgent = !this.chatSearchAgentFilter || chat.agent_id === this.chatSearchAgentFilter;
      const matchesQuery =
        !query ||
        chat.title.toLowerCase().includes(query) ||
        this.agentName(chat.agent_id).toLowerCase().includes(query);
      return matchesAgent && matchesQuery;
    });
    return matches.slice(0, query || this.chatSearchAgentFilter ? 50 : 5);
  },
  selectChatSearchAgent(this: Context, agentId: string): void {
    this.chatSearchAgentFilter = agentId;
    this.chatSearchAgentPickerOpen = false;
  },
  selectSearchChat(this: Context, chat: DTO.Chat): void {
    this.searchOpen = false;
    this.openChat(chat);
  },
  newChat(this: Context): void {
    const draftChat = this.activeChat?.status === "created" && this.pendingUploads.length ? this.activeChat : null;
    if (draftChat) void this.api(`/api/chats/${draftChat.id}`, { method: "DELETE" }).catch(() => {});
    this.stopWatching();
    this.abortChatReads();
    this.chatViewToken += 1;
    this.resetShare();
    this.cancelEditingChatTitle();
    this.activeChat = null;
    this.messages = [];
    this.files = [];
    this.inputFiles = [];
    this.filesOpen = false;
    this.filesTab = "outputs";
    this.pendingUploads = [];
    this.uploadSelection = [];
    this.pendingArtifacts = [];
    this.draft = "";
    this.loading = false;
    this.messagesLoading = false;
    this.error = "";
    this.page = "chat";
    this.agentPickerOpen = false;
    history.pushState({}, "", "/chat" + this.modeQuery());
    if (this.agents.length) this.selectedAgentId = this.agents[0]!.id;
  },
  async openChat(this: Context, chat: DTO.Chat, updateUrl: boolean = true): Promise<void> {
    this.stopWatching();
    this.beginChatReads();
    const viewToken = ++this.chatViewToken;
    this.resetShare();
    this.page = "chat";
    this.cancelEditingChatTitle();
    this.activeChat = chat;
    this.loading = false;
    this.files = [];
    this.inputFiles = [];
    this.filesOpen = false;
    this.filesTab = "outputs";
    this.pendingUploads = [];
    this.pendingArtifacts = [];
    this.resetConversationInput();
    if (updateUrl) history.pushState({}, "", `/chat/${chat.id}` + this.modeQuery());
    this.messages = [];
    this.messagesLoading = true;
    try {
      const [data, currentChat] = await Promise.all([
        this.chatRead<{ messages: DTO.Message[] }>(`/api/chats/${chat.id}/messages?mode=${this.mode}`),
        chat.status === "created" ? Promise.resolve(chat) : this.chatRead<DTO.Chat>(`/api/chats/${chat.id}`),
      ]);
      if (viewToken !== this.chatViewToken || this.activeChat?.id !== chat.id) return;
      this.activeChat = currentChat;
      const sidebarChat = this.chats.find((item) => item.id === chat.id);
      if (sidebarChat) Object.assign(sidebarChat, currentChat);
      this.loading = currentChat.status === "running";
      this.messages = this.normalizeMessages(data.messages);
      if (currentChat.status === "created") {
        this.pendingUploads =
          (await this.chatRead<{ uploads: DTO.Artifact[] }>(`/api/chats/${chat.id}/uploads`)).uploads || [];
      }
      this.scrollMessagesToLatest();
    } catch (cause) {
      const e = asError(cause);
      if (!this.isAbortError(e) && viewToken === this.chatViewToken && this.activeChat?.id === chat.id)
        this.showError(e);
    } finally {
      if (viewToken === this.chatViewToken && this.activeChat?.id === chat.id) this.messagesLoading = false;
    }
    if (this.activeChat?.status === "running") void this.watchChat(chat.id);
  },
  async sendFirst(this: Context): Promise<void> {
    if (!this.draft.trim() || !this.selectedAgentId) return;
    try {
      const chat = await this.api<DTO.Chat>("/api/chats", {
        method: "POST",
        body: JSON.stringify({ agent_id: this.selectedAgentId }),
      });
      this.selectedAgentId = chat.agent_id;
      this.activeChat = chat;
      this.chats.unshift(chat);
      history.pushState({}, "", `/chat/${chat.id}`);
      await this.sendMessage();
      if (this.activeChat?.title === "New conversation") {
        this.chats = this.chats.filter((item) => item.id !== chat.id);
        this.activeChat = null;
        this.messages = [];
        history.pushState({}, "", "/chat" + this.modeQuery());
      }
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    }
  },
  skillCommandMatch(this: Context): { query: string; hasPrefix: boolean } | null {
    const match = this.draft.match(/^\/(?:skill:)?([^\s]*)$/i);
    if (!match) return null;
    const typed = match[1] || "";
    return {
      query: typed.toLowerCase(),
      hasPrefix: /^\/skill:/i.test(this.draft),
    };
  },
  skillCommandItems(this: Context): DTO.Resource[] {
    const match = this.skillCommandMatch();
    const agent = this.agents.find((item) => item.id === this.selectedAgentId);
    if (!match || !agent) return [];
    const enabled = agent.skills || [];
    return this.resources.skills
      .filter((skill) =>
        enabled.some((path) => this.normalizeResourcePath(path) === this.normalizeResourcePath(skill.path)),
      )
      .filter((skill) => skill.name.toLowerCase().includes(match.query))
      .slice(0, 8);
  },
  skillCommandVisible(this: Context): boolean {
    return Boolean(this.skillCommandMatch()) && !this.skillCommandDismissed;
  },
  updateSkillCommandState(this: Context): void {
    if (this.skillCommandMatch()) this.skillCommandDismissed = false;
    this.skillCommandIndex = 0;
  },
  handleSkillCommandKeydown(this: Context, event: KeyboardEvent): void {
    if (!this.skillCommandVisible()) return;
    const items = this.skillCommandItems();
    if (event.key === "Escape") {
      event.preventDefault();
      this.skillCommandDismissed = true;
    } else if (event.key === "ArrowDown" && items.length) {
      event.preventDefault();
      this.skillCommandIndex = (this.skillCommandIndex + 1) % items.length;
    } else if (event.key === "ArrowUp" && items.length) {
      event.preventDefault();
      this.skillCommandIndex = (this.skillCommandIndex - 1 + items.length) % items.length;
    } else if ((event.key === "Enter" || event.key === "Tab") && items.length) {
      event.preventDefault();
      this.chooseSkillCommand(items[this.skillCommandIndex]!);
    }
  },
  chooseSkillCommand(this: Context, skill: DTO.Resource): void {
    this.draft = `/skill:${skill.name} `;
    this.skillCommandDismissed = true;
    this.skillCommandIndex = 0;
    nextTick(() => document.getElementById("new-chat-message")?.focus());
  },
  skillCommandHighlightHtml(this: Context): string {
    const command = this.draft.match(/^\/skill:([^\s]+)/i);
    if (!command) return this.escape(this.draft);
    const agent = this.agents.find((item) => item.id === this.selectedAgentId);
    const enabled = agent?.skills || [];
    const skill = this.resources.skills.find(
      (item) =>
        item.name.toLowerCase() === (command[1] || "").toLowerCase() &&
        enabled.some((path) => this.normalizeResourcePath(path) === this.normalizeResourcePath(item.path)),
    );
    if (!skill) return this.escape(this.draft);
    return `<span class="skill-command-highlight-token">${this.escape(command[0])}</span>${this.escape(this.draft.slice(command[0].length))}`;
  },
  syncSkillCommandScroll(this: Context, event: Event): void {
    const mirror = document.querySelector<HTMLElement>('[data-ref="skillCommandHighlight"]');
    if (!mirror || !(event.target instanceof HTMLTextAreaElement)) return;
    mirror.scrollTop = event.target.scrollTop;
    mirror.scrollLeft = event.target.scrollLeft;
  },
  async sendMessage(this: Context): Promise<void> {
    const content = this.draft.trim();
    if (!content || !this.activeChat || this.loading) return;
    this.loading = true;
    const chatId = this.activeChat.id;
    const viewToken = this.chatViewToken;
    const isCurrentView = () => viewToken === this.chatViewToken && this.activeChat?.id === chatId;
    try {
      await this.uploadFiles(this.activeChat);
      const messageAttachments = this.pendingAttachments().map((file) => ({
        id: file.id || `artifact:${file.path}`,
        name: file.filename || file.name,
        path: file.path,
        media_type: file.media_type || "application/octet-stream",
        size: file.size,
      }));
      this.draft = "";
      this.resetConversationInput();
      this.messages.push({
        _key: createId(),
        role: "user",
        content: [{ type: "text", text: content }],
        _attachments: messageAttachments,
      });
      this.messages.push({
        _key: createId(),
        role: "assistant",
        content: [{ type: "text", text: "" }],
        _reasoningParts: [{ type: "thinking", thinking: "" }],
        _tools: [],
        _streaming: true,
      });
      const uploadIds = this.pendingUploads.map((file) => file.id);
      const artifactPaths = this.pendingArtifacts.map((file) => file.path);
      const requestPath = `/api/chats/${chatId}/messages`;
      const { response, requestId } = await this.request(requestPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, upload_ids: uploadIds, artifact_paths: artifactPaths }),
      });
      if (!response.ok) {
        await this.responseData(response, requestId, requestPath);
      }
      this.pendingUploads = [];
      this.pendingArtifacts = [];
      if (!response.body) throw new ApiError("Server returned an empty stream");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() || "";
        for (const frame of frames) {
          const line = frame.split("\n").find((value) => value.startsWith("data: "));
          if (!line) continue;
          const event = JSON.parse(line.slice(6)) as DTO.StreamEvent;
          if (event.type === "complete") {
            const found = this.chats.find((c) => c.id === event.chat?.id);
            if (found && event.chat) Object.assign(found, event.chat);
            if (isCurrentView()) {
              this.activeChat = event.chat;
              const i = this.messages.length - 1;
              const normalized = this.normalizeMessages(event.messages || []);
              const hasFinal = normalized.some(
                (message) => message.role === "assistant" && this.partsText(message.content),
              );
              if (!hasFinal && event.assistant)
                normalized.push({
                  _key: createId(),
                  role: "assistant",
                  content: [{ type: "text", text: event.assistant }],
                  _reasoningParts: [],
                  _streaming: false,
                });
              this.messages.splice(i, 1, ...normalized);
              void this.refreshOpenFiles(chatId);
            }
          } else if (event.type === "error") {
            throw new ApiError(event.error);
          } else if (isCurrentView()) {
            this.handleTurnEvent(event);
          }
        }
      }
    } catch (cause) {
      const e = asError(cause);
      if (isCurrentView()) {
        this.showError(e);
        this.loading = false;
        if (chatId) void this.watchChat(chatId);
      }
      return;
    } finally {
      if (isCurrentView()) {
        this.loading = false;
        this.messages = [...this.messages];
      }
    }
  },
  markStreamingAssistantMessageEnd(this: Context): void {
    const i = this.messages.length - 1;
    const current = this.messages[i];
    if (!current) return;
    if (current?.role === "assistant") this.messages[i] = { ...current, _thinkingBoundary: true };
  },
  updateStreamingAssistant(this: Context, value: string, append: boolean): void {
    const i = this.messages.length - 1;
    const current = this.messages[i];
    if (!current) return;
    const text = append ? this.partsText(current.content) + value : value;
    this.messages[i] = {
      ...current,
      content: [{ type: "text", text }],
      _thinkingBoundary: false,
    };
  },
  updateStreamingThinking(this: Context, value: string): void {
    const i = this.messages.length - 1;
    const current = this.messages[i];
    if (!current) return;
    const parts = [...(current._reasoningParts || [])];
    const last = parts[parts.length - 1];
    if (current._thinkingBoundary || !last || last.type !== "thinking")
      parts.push({ type: "thinking", thinking: value });
    else
      parts[parts.length - 1] = {
        ...last,
        thinking: (last.thinking || "") + value,
      };
    this.messages[i] = {
      ...current,
      _reasoningParts: parts,
      _thinkingBoundary: false,
    };
  },
  handleTurnEvent(this: Context, event: DTO.TurnEvent): void {
    if (event.type === "delta") this.updateStreamingAssistant(event.delta, true);
    else if (event.type === "thinking_delta") this.updateStreamingThinking(event.delta);
    else if (event.type === "assistant_message_end") this.markStreamingAssistantMessageEnd();
    else if (event.type === "final") this.updateStreamingAssistant(event.text, false);
    else if (event.type === "tool") {
      const i = this.messages.length - 1;
      if (!this.messages[i]) return;
      this.messages[i] = {
        ...this.messages[i],
        _tools: [...(this.messages[i]!._tools || []), event],
      };
    }
  },
  async watchChat(this: Context, chatId: string): Promise<void> {
    if (!chatId || this.watchingChat === chatId) return;
    const viewToken = this.chatViewToken;
    this.watchingChat = chatId;
    try {
      const chat = await this.chatRead<DTO.Chat>(`/api/chats/${chatId}`);
      if (viewToken !== this.chatViewToken || this.activeChat?.id !== chatId) return;
      if (this.activeChat?.id === chatId) this.activeChat = chat;
      const data = await this.chatRead<{ messages: DTO.Message[] }>(`/api/chats/${chatId}/messages?mode=${this.mode}`);
      if (viewToken !== this.chatViewToken || this.activeChat?.id !== chatId) return;
      const normalized = this.normalizeMessages(data.messages);
      this.messages = normalized;
      const last = normalized[normalized.length - 1];
      const finishedSnapshot = last?.role === "assistant" && !last._streaming;
      if (chat.status !== "running" || finishedSnapshot) {
        this.watchingChat = null;
        this.loading = false;
        return;
      }
      if (!last || last.role !== "assistant" || !last._streaming)
        this.messages.push({
          _key: createId(),
          role: "assistant",
          content: [{ type: "text", text: "" }],
          _reasoningParts: [{ type: "thinking", thinking: "" }],
          _tools: [],
          _streaming: true,
        });
      const source = new EventSource(`/api/chats/${chatId}/stream`);
      this.streamSource = source;
      source.onmessage = (m) => {
        let event: DTO.StreamEvent;
        try {
          event = JSON.parse(m.data) as DTO.StreamEvent;
        } catch {
          return;
        }
        if (event.type === "complete" || event.type === "error") {
          source.close();
          if (viewToken === this.chatViewToken && this.activeChat?.id === chatId) {
            this.streamSource = null;
            this.watchingChat = null;
            this.loading = false;
            if (event.type === "error") this.showError(new ApiError(event.error));
            void this.finishWatch(chatId, viewToken);
          }
          return;
        }
        if (viewToken === this.chatViewToken && this.activeChat?.id === chatId) this.handleTurnEvent(event);
      };
      source.onerror = () => {
        source.close();
        if (viewToken === this.chatViewToken && this.activeChat?.id === chatId) {
          this.streamSource = null;
          this.watchingChat = null;
          this.startPolling(chatId, viewToken);
        }
      };
    } catch (cause) {
      const e = asError(cause);
      if (!this.isAbortError(e) && viewToken === this.chatViewToken && this.activeChat?.id === chatId) {
        this.watchingChat = null;
        this.showError(e);
      }
    }
  },
  async finishWatch(this: Context, chatId: string, viewToken: number = this.chatViewToken): Promise<void> {
    if (viewToken !== this.chatViewToken || this.activeChat?.id !== chatId) return;
    try {
      const data = await this.chatRead<{ messages: DTO.Message[] }>(`/api/chats/${chatId}/messages?mode=${this.mode}`);
      if (viewToken !== this.chatViewToken || this.activeChat?.id !== chatId) return;
      this.setMessagesIfChanged(data.messages);
      const chat = await this.chatRead<DTO.Chat>(`/api/chats/${chatId}`);
      if (viewToken !== this.chatViewToken || this.activeChat?.id !== chatId) return;
      this.activeChat = chat;
      const found = this.chats.find((c) => c.id === chatId);
      if (found) Object.assign(found, chat);
      this.loading = false;
      await this.refreshOpenFiles(chatId);
    } catch (cause) {
      const e = asError(cause);
      if (!this.isAbortError(e) && viewToken === this.chatViewToken && this.activeChat?.id === chatId)
        this.showError(e);
    }
  },
  startPolling(this: Context, chatId: string, viewToken: number = this.chatViewToken): void {
    this.stopPolling();
    this.pollTimer = setInterval(async () => {
      if (viewToken !== this.chatViewToken || this.activeChat?.id !== chatId) {
        this.stopPolling();
        return;
      }
      try {
        const chat = await this.chatRead<DTO.Chat>(`/api/chats/${chatId}`);
        if (viewToken !== this.chatViewToken || this.activeChat?.id !== chatId) {
          this.stopPolling();
          return;
        }
        if (chat.status !== "running") {
          const data = await this.chatRead<{ messages: DTO.Message[] }>(
            `/api/chats/${chatId}/messages?mode=${this.mode}`,
          );
          if (viewToken !== this.chatViewToken || this.activeChat?.id !== chatId) return;
          this.setMessagesIfChanged(data.messages);
          this.activeChat = chat;
          const found = this.chats.find((c) => c.id === chatId);
          if (found) Object.assign(found, chat);
          this.loading = false;
          this.stopPolling();
          await this.refreshOpenFiles(chatId);
          return;
        }
        const data = await this.chatRead<{ messages: DTO.Message[] }>(
          `/api/chats/${chatId}/messages?mode=${this.mode}`,
        );
        if (viewToken !== this.chatViewToken || this.activeChat?.id !== chatId) return;
        const normalized = this.setMessagesIfChanged(data.messages);
        const last = normalized[normalized.length - 1];
        if (last?.role === "assistant" && !last._streaming) {
          this.loading = false;
          this.stopPolling();
          await this.refreshOpenFiles(chatId);
        }
      } catch {}
    }, 3000);
  },
  stopPolling(this: Context): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  },
  stopWatching(this: Context): void {
    if (this.streamSource) {
      this.streamSource.close();
      this.streamSource = null;
    }
    this.watchingChat = null;
    this.stopPolling();
  },
  setReasoningOpen(this: Context, input: HTMLInputElement): void {
    const key = input.dataset.reasoningKey;
    if (key) this.reasoningOpen[key] = input.checked;
  },
  stableMessageKey(this: Context, message: DTO.Message, index: number): string {
    return message.id || `${message.role || "message"}:${message.timestamp || ""}:${index}`;
  },
  messagesFingerprint(this: Context, messages: DTO.Message[]): string {
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
  },
  setMessagesIfChanged(this: Context, rawMessages: DTO.Message[]): DTO.Message[] {
    const normalized = this.normalizeMessages(rawMessages);
    if (this.messagesFingerprint(normalized) !== this.messagesFingerprint(this.messages)) this.messages = normalized;
    return normalized;
  },
  isActionableAssistant(this: Context, message: DTO.Message): boolean {
    if (this.sharedMode || this.loading) return false;
    if (message.role !== "assistant" || message._streaming) return false;
    if (!this.partsText(message.content).trim()) return false;
    const candidates = this.messages.filter(
      (item) =>
        item.role === "assistant" &&
        !item._streaming &&
        this.partsText(item.content).trim() &&
        this.messageVisible(item),
    );
    return candidates.length > 0 && candidates[candidates.length - 1]?._key === message._key;
  },
  async copyMessage(this: Context, message: DTO.Message): Promise<void> {
    const text = this.partsText(message.content);
    try {
      await writeClipboardText(text);
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
      return;
    }
    this.copiedKey = message._key || "";
    setTimeout(() => {
      if (this.copiedKey === message._key) this.copiedKey = "";
    }, 1500);
  },
  async copyCodeBlock(
    this: Context,
    button: HTMLElement & { _copyTimer?: ReturnType<typeof setTimeout> },
  ): Promise<void> {
    const block = button?.closest?.(".code-block");
    const text = block?.querySelector("code")?.textContent || "";
    if (!text) return;
    try {
      await writeClipboardText(text);
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
      return;
    }
    if (button._copyTimer) clearTimeout(button._copyTimer);
    button.classList.add("copied");
    button._copyTimer = setTimeout(() => button.classList.remove("copied"), 1500);
  },
  async abort(this: Context): Promise<void> {
    if (!this.activeChat) return;
    try {
      await this.api(`/api/chats/${this.activeChat.id}/abort`, {
        method: "POST",
      });
      this.loading = false;
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    }
  },
  deleteChat(this: Context, chat: DTO.Chat): void {
    this.deleteChatTarget = chat;
  },
  async confirmDeleteChat(this: Context): Promise<void> {
    const chat = this.deleteChatTarget;
    if (!chat) return;
    try {
      await this.api(`/api/chats/${chat.id}`, { method: "DELETE" });
      this.chats = this.chats.filter((item) => item.id !== chat.id);
      this.deleteChatTarget = null;
      if (this.activeChat?.id === chat.id) this.newChat();
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    }
  },
};
