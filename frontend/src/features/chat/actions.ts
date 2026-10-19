import type { Actions as SharesActions, State as SharesState } from "../shares/actions";
import type { Actions as ArtifactsActions, State as ArtifactsState } from "../artifacts/actions";
import type { Actions as AgentsActions, State as AgentsState } from "../agents/actions";
import type { Actions as ShellActions, State as ShellState } from "../../app/actions";
import type { Actions as ApiActions } from "../../shared/api";
import type { Actions as DomActions } from "../../shared/dom";
import type { Actions as PresentationActions } from "./presentation";
import type { Actions as FormatActions } from "../../shared/format";
import { reactive, nextTick } from "vue";
import type * as DTO from "../../shared/types";
import { ApiError, asError } from "../../shared/types";
import { createId, writeClipboardText } from "../../browser";

import { createChatState } from "./state";
export type State = ReturnType<typeof createChatState>;
export interface Actions {
  clearAttachmentCommand(): void;
  setSharedConversation(chat: DTO.Chat | null, messages: DTO.Message[]): void;
  setMessagesLoading(loading: boolean): void;
  chooseAgent(id: string): void;
  chatCount(id: string): number;
  beginChatReads(): void;
  abortChatReads(): void;
  isAbortError(error: unknown): boolean;
  chatRead<T = unknown>(path: string): Promise<T>;
  startQuickstart(agent: DTO.Agent, prompt: string): void;
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
  setMessagesIfChanged(rawMessages: DTO.Message[]): DTO.Message[];
  isActionableAssistant(message: DTO.Message): boolean;
  copyMessage(message: DTO.Message): Promise<void>;
  copyCodeBlock(button: HTMLElement & { _copyTimer?: ReturnType<typeof setTimeout> }): Promise<void>;
  abort(): Promise<void>;
  deleteChat(chat: DTO.Chat): void;
  confirmDeleteChat(): Promise<void>;
}
export interface Feature extends Actions {
  state: State;
}
export interface Dependencies {
  shares: Pick<SharesActions, "resetShare"> & { state: Readonly<Pick<SharesState, "sharedMode">> };
  artifacts: Pick<
    ArtifactsActions,
    "clearAttachments" | "pendingAttachments" | "refreshOpenFiles" | "resetFilePanel" | "restoreUploads" | "uploadFiles"
  > & { state: Readonly<Pick<ArtifactsState, "pendingArtifacts" | "pendingUploads">> };
  agents: Pick<AgentsActions, "agentName" | "normalizeResourcePath"> & {
    state: Readonly<Pick<AgentsState, "agents" | "resources">>;
  };
  shell: Pick<ShellActions, "clearError" | "modeQuery" | "showError" | "showPage"> & {
    state: Readonly<Pick<ShellState, "mode">>;
  };
  api: Pick<ApiActions, "api" | "request" | "responseData">;
  dom: Pick<DomActions, "resetConversationInput" | "scrollMessagesToLatest">;
  presentation: Pick<PresentationActions, "messageVisible" | "messagesFingerprint" | "normalizeMessages" | "partsText">;
  format: Pick<FormatActions, "escape">;
}
export function createChat(deps: Dependencies): Feature {
  const state = reactive(createChatState());
  function beginChatReads(): void {
    abortChatReads();
    state.chatReadController = new AbortController();
  }
  function abortChatReads(): void {
    state.chatReadController?.abort();
    state.chatReadController = null;
  }
  function isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === "AbortError";
  }
  function chatRead<T = unknown>(path: string): Promise<T> {
    return deps.api.api<T>(path, { signal: state.chatReadController?.signal });
  }
  function startQuickstart(agent: DTO.Agent, prompt: string): void {
    newChat();
    state.selectedAgentId = agent.id;
    state.draft = prompt;
    nextTick(() => document.getElementById("new-chat-message")?.focus());
  }
  async function loadChats(): Promise<void> {
    try {
      state.chats = (await deps.api.api<{ chats: DTO.Chat[] }>("/api/chats")).chats;
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    }
  }
  function startEditingChatTitle(): void {
    if (deps.shares.state.sharedMode || !state.activeChat) return;
    state.chatTitleDraft = state.activeChat.title || "";
    state.editingChatTitle = true;
    nextTick(() => {
      document.getElementById("chat-title-input")?.focus();
    });
  }
  function cancelEditingChatTitle(): void {
    state.editingChatTitle = false;
    state.chatTitleDraft = "";
  }
  async function saveChatTitle(): Promise<void> {
    if (!state.editingChatTitle || state.chatTitleSaving) return;
    const chatId = state.activeChat?.id;
    if (!chatId) return;
    const title = state.chatTitleDraft.trim();
    if (!title) {
      deps.shell.showError(new ApiError("Chat title cannot be empty"));
      state.chatTitleDraft = state.activeChat?.title || "";
      return;
    }
    state.chatTitleSaving = true;
    try {
      const updated = await deps.api.api<DTO.Chat>(`/api/chats/${chatId}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      if (state.activeChat?.id === chatId) {
        state.activeChat = updated;
        const sidebarChat = state.chats.find((chat) => chat.id === updated.id);
        if (sidebarChat) Object.assign(sidebarChat, updated);
        document.title = `${updated.title} · OMA studio`;
        cancelEditingChatTitle();
      }
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    } finally {
      state.chatTitleSaving = false;
    }
  }
  function openChatSearch(): void {
    state.chatSearchQuery = "";
    state.chatSearchAgentFilter = "";
    state.chatSearchAgentPickerOpen = false;
    state.searchOpen = true;
  }
  function searchChatResults(): DTO.Chat[] {
    const query = state.chatSearchQuery.trim().toLowerCase();
    const matches = state.chats.filter((chat) => {
      const matchesAgent = !state.chatSearchAgentFilter || chat.agent_id === state.chatSearchAgentFilter;
      const matchesQuery =
        !query ||
        chat.title.toLowerCase().includes(query) ||
        deps.agents.agentName(chat.agent_id).toLowerCase().includes(query);
      return matchesAgent && matchesQuery;
    });
    return matches.slice(0, query || state.chatSearchAgentFilter ? 50 : 5);
  }
  function selectChatSearchAgent(agentId: string): void {
    state.chatSearchAgentFilter = agentId;
    state.chatSearchAgentPickerOpen = false;
  }
  function selectSearchChat(chat: DTO.Chat): void {
    state.searchOpen = false;
    openChat(chat);
  }
  function newChat(): void {
    const draftChat =
      state.activeChat?.status === "created" && deps.artifacts.state.pendingUploads.length ? state.activeChat : null;
    if (draftChat) void deps.api.api(`/api/chats/${draftChat.id}`, { method: "DELETE" }).catch(() => {});
    stopWatching();
    abortChatReads();
    state.chatViewToken += 1;
    deps.shares.resetShare();
    cancelEditingChatTitle();
    state.activeChat = null;
    state.messages = [];
    deps.artifacts.resetFilePanel();
    deps.artifacts.clearAttachments();
    state.draft = "";
    state.loading = false;
    state.messagesLoading = false;
    deps.shell.clearError();
    deps.shell.showPage("chat");
    state.agentPickerOpen = false;
    history.pushState({}, "", "/chat" + deps.shell.modeQuery());
    if (deps.agents.state.agents.length) state.selectedAgentId = deps.agents.state.agents[0]!.id;
  }
  async function openChat(chat: DTO.Chat, updateUrl: boolean = true): Promise<void> {
    stopWatching();
    beginChatReads();
    const viewToken = ++state.chatViewToken;
    deps.shares.resetShare();
    deps.shell.showPage("chat");
    cancelEditingChatTitle();
    state.activeChat = chat;
    state.loading = false;
    deps.artifacts.resetFilePanel();
    deps.artifacts.clearAttachments(false);
    deps.dom.resetConversationInput();
    if (updateUrl) history.pushState({}, "", `/chat/${chat.id}` + deps.shell.modeQuery());
    state.messages = [];
    state.messagesLoading = true;
    try {
      const [data, currentChat] = await Promise.all([
        chatRead<{ messages: DTO.Message[] }>(`/api/chats/${chat.id}/messages?mode=${deps.shell.state.mode}`),
        chat.status === "created" ? Promise.resolve(chat) : chatRead<DTO.Chat>(`/api/chats/${chat.id}`),
      ]);
      if (viewToken !== state.chatViewToken || state.activeChat?.id !== chat.id) return;
      state.activeChat = currentChat;
      const sidebarChat = state.chats.find((item) => item.id === chat.id);
      if (sidebarChat) Object.assign(sidebarChat, currentChat);
      state.loading = currentChat.status === "running";
      state.messages = deps.presentation.normalizeMessages(data.messages);
      if (currentChat.status === "created") {
        deps.artifacts.restoreUploads(
          (await chatRead<{ uploads: DTO.Artifact[] }>(`/api/chats/${chat.id}/uploads`)).uploads || [],
        );
      }
      deps.dom.scrollMessagesToLatest();
    } catch (cause) {
      const e = asError(cause);
      if (!isAbortError(e) && viewToken === state.chatViewToken && state.activeChat?.id === chat.id)
        deps.shell.showError(e);
    } finally {
      if (viewToken === state.chatViewToken && state.activeChat?.id === chat.id) state.messagesLoading = false;
    }
    if (state.activeChat?.status === "running") void watchChat(chat.id);
  }
  async function sendFirst(): Promise<void> {
    if (!state.draft.trim() || !state.selectedAgentId) return;
    try {
      const chat = await deps.api.api<DTO.Chat>("/api/chats", {
        method: "POST",
        body: JSON.stringify({ agent_id: state.selectedAgentId }),
      });
      state.selectedAgentId = chat.agent_id;
      state.activeChat = chat;
      state.chats.unshift(chat);
      history.pushState({}, "", `/chat/${chat.id}`);
      await sendMessage();
      if (state.activeChat?.title === "New conversation") {
        state.chats = state.chats.filter((item) => item.id !== chat.id);
        state.activeChat = null;
        state.messages = [];
        history.pushState({}, "", "/chat" + deps.shell.modeQuery());
      }
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    }
  }
  function skillCommandMatch(): { query: string; hasPrefix: boolean } | null {
    const match = state.draft.match(/^\/(?:skill:)?([^\s]*)$/i);
    if (!match) return null;
    const typed = match[1] || "";
    return {
      query: typed.toLowerCase(),
      hasPrefix: /^\/skill:/i.test(state.draft),
    };
  }
  function skillCommandItems(): DTO.Resource[] {
    const match = skillCommandMatch();
    const agent = deps.agents.state.agents.find((item) => item.id === state.selectedAgentId);
    if (!match || !agent) return [];
    const enabled = agent.skills || [];
    return deps.agents.state.resources.skills
      .filter((skill) =>
        enabled.some(
          (path) => deps.agents.normalizeResourcePath(path) === deps.agents.normalizeResourcePath(skill.path),
        ),
      )
      .filter((skill) => skill.name.toLowerCase().includes(match.query))
      .slice(0, 8);
  }
  function skillCommandVisible(): boolean {
    return Boolean(skillCommandMatch()) && !state.skillCommandDismissed;
  }
  function updateSkillCommandState(): void {
    if (skillCommandMatch()) state.skillCommandDismissed = false;
    state.skillCommandIndex = 0;
  }
  function handleSkillCommandKeydown(event: KeyboardEvent): void {
    if (!skillCommandVisible()) return;
    const items = skillCommandItems();
    if (event.key === "Escape") {
      event.preventDefault();
      state.skillCommandDismissed = true;
    } else if (event.key === "ArrowDown" && items.length) {
      event.preventDefault();
      state.skillCommandIndex = (state.skillCommandIndex + 1) % items.length;
    } else if (event.key === "ArrowUp" && items.length) {
      event.preventDefault();
      state.skillCommandIndex = (state.skillCommandIndex - 1 + items.length) % items.length;
    } else if ((event.key === "Enter" || event.key === "Tab") && items.length) {
      event.preventDefault();
      chooseSkillCommand(items[state.skillCommandIndex]!);
    }
  }
  function chooseSkillCommand(skill: DTO.Resource): void {
    state.draft = `/skill:${skill.name} `;
    state.skillCommandDismissed = true;
    state.skillCommandIndex = 0;
    nextTick(() => document.getElementById("new-chat-message")?.focus());
  }
  function skillCommandHighlightHtml(): string {
    const command = state.draft.match(/^\/skill:([^\s]+)/i);
    if (!command) return deps.format.escape(state.draft);
    const agent = deps.agents.state.agents.find((item) => item.id === state.selectedAgentId);
    const enabled = agent?.skills || [];
    const skill = deps.agents.state.resources.skills.find(
      (item) =>
        item.name.toLowerCase() === (command[1] || "").toLowerCase() &&
        enabled.some(
          (path) => deps.agents.normalizeResourcePath(path) === deps.agents.normalizeResourcePath(item.path),
        ),
    );
    if (!skill) return deps.format.escape(state.draft);
    return `<span class="skill-command-highlight-token">${deps.format.escape(command[0])}</span>${deps.format.escape(state.draft.slice(command[0].length))}`;
  }
  function syncSkillCommandScroll(event: Event): void {
    const mirror = document.querySelector<HTMLElement>('[data-ref="skillCommandHighlight"]');
    if (!mirror || !(event.target instanceof HTMLTextAreaElement)) return;
    mirror.scrollTop = event.target.scrollTop;
    mirror.scrollLeft = event.target.scrollLeft;
  }
  async function sendMessage(): Promise<void> {
    const content = state.draft.trim();
    if (!content || !state.activeChat || state.loading) return;
    state.loading = true;
    const chatId = state.activeChat.id;
    const viewToken = state.chatViewToken;
    const isCurrentView = () => viewToken === state.chatViewToken && state.activeChat?.id === chatId;
    try {
      await deps.artifacts.uploadFiles(state.activeChat);
      const messageAttachments = deps.artifacts.pendingAttachments().map((file) => ({
        id: file.id || `artifact:${file.path}`,
        name: file.filename || file.name,
        path: file.path,
        media_type: file.media_type || "application/octet-stream",
        size: file.size,
      }));
      state.draft = "";
      deps.dom.resetConversationInput();
      state.messages.push({
        _key: createId(),
        role: "user",
        content: [{ type: "text", text: content }],
        _attachments: messageAttachments,
      });
      state.messages.push({
        _key: createId(),
        role: "assistant",
        content: [{ type: "text", text: "" }],
        _reasoningParts: [{ type: "thinking", thinking: "" }],
        _tools: [],
        _streaming: true,
      });
      const uploadIds = deps.artifacts.state.pendingUploads.map((file) => file.id);
      const artifactPaths = deps.artifacts.state.pendingArtifacts.map((file) => file.path);
      const requestPath = `/api/chats/${chatId}/messages`;
      const { response, requestId } = await deps.api.request(requestPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, upload_ids: uploadIds, artifact_paths: artifactPaths }),
      });
      if (!response.ok) {
        await deps.api.responseData(response, requestId, requestPath);
      }
      deps.artifacts.clearAttachments(false);
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
            const found = state.chats.find((c) => c.id === event.chat?.id);
            if (found && event.chat) Object.assign(found, event.chat);
            if (isCurrentView()) {
              state.activeChat = event.chat;
              const i = state.messages.length - 1;
              const normalized = deps.presentation.normalizeMessages(event.messages || []);
              const hasFinal = normalized.some(
                (message) => message.role === "assistant" && deps.presentation.partsText(message.content),
              );
              if (!hasFinal && event.assistant)
                normalized.push({
                  _key: createId(),
                  role: "assistant",
                  content: [{ type: "text", text: event.assistant }],
                  _reasoningParts: [],
                  _streaming: false,
                });
              state.messages.splice(i, 1, ...normalized);
              void deps.artifacts.refreshOpenFiles(chatId);
            }
          } else if (event.type === "error") {
            throw new ApiError(event.error);
          } else if (isCurrentView()) {
            handleTurnEvent(event);
          }
        }
      }
    } catch (cause) {
      const e = asError(cause);
      if (isCurrentView()) {
        deps.shell.showError(e);
        state.loading = false;
        if (chatId) void watchChat(chatId);
      }
      return;
    } finally {
      if (isCurrentView()) {
        state.loading = false;
        state.messages = [...state.messages];
      }
    }
  }
  function markStreamingAssistantMessageEnd(): void {
    const i = state.messages.length - 1;
    const current = state.messages[i];
    if (!current) return;
    if (current?.role === "assistant") state.messages[i] = { ...current, _thinkingBoundary: true };
  }
  function updateStreamingAssistant(value: string, append: boolean): void {
    const i = state.messages.length - 1;
    const current = state.messages[i];
    if (!current) return;
    const text = append ? deps.presentation.partsText(current.content) + value : value;
    state.messages[i] = {
      ...current,
      content: [{ type: "text", text }],
      _thinkingBoundary: false,
    };
  }
  function updateStreamingThinking(value: string): void {
    const i = state.messages.length - 1;
    const current = state.messages[i];
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
    state.messages[i] = {
      ...current,
      _reasoningParts: parts,
      _thinkingBoundary: false,
    };
  }
  function handleTurnEvent(event: DTO.TurnEvent): void {
    if (event.type === "delta") updateStreamingAssistant(event.delta, true);
    else if (event.type === "thinking_delta") updateStreamingThinking(event.delta);
    else if (event.type === "assistant_message_end") markStreamingAssistantMessageEnd();
    else if (event.type === "final") updateStreamingAssistant(event.text, false);
    else if (event.type === "tool") {
      const i = state.messages.length - 1;
      if (!state.messages[i]) return;
      state.messages[i] = {
        ...state.messages[i],
        _tools: [...(state.messages[i]!._tools || []), event],
      };
    }
  }
  async function watchChat(chatId: string): Promise<void> {
    if (!chatId || state.watchingChat === chatId) return;
    const viewToken = state.chatViewToken;
    state.watchingChat = chatId;
    try {
      const chat = await chatRead<DTO.Chat>(`/api/chats/${chatId}`);
      if (viewToken !== state.chatViewToken || state.activeChat?.id !== chatId) return;
      if (state.activeChat?.id === chatId) state.activeChat = chat;
      const data = await chatRead<{ messages: DTO.Message[] }>(
        `/api/chats/${chatId}/messages?mode=${deps.shell.state.mode}`,
      );
      if (viewToken !== state.chatViewToken || state.activeChat?.id !== chatId) return;
      const normalized = deps.presentation.normalizeMessages(data.messages);
      state.messages = normalized;
      const last = normalized[normalized.length - 1];
      const finishedSnapshot = last?.role === "assistant" && !last._streaming;
      if (chat.status !== "running" || finishedSnapshot) {
        state.watchingChat = null;
        state.loading = false;
        return;
      }
      if (!last || last.role !== "assistant" || !last._streaming)
        state.messages.push({
          _key: createId(),
          role: "assistant",
          content: [{ type: "text", text: "" }],
          _reasoningParts: [{ type: "thinking", thinking: "" }],
          _tools: [],
          _streaming: true,
        });
      const source = new EventSource(`/api/chats/${chatId}/stream`);
      state.streamSource = source;
      source.onmessage = (m) => {
        let event: DTO.StreamEvent;
        try {
          event = JSON.parse(m.data) as DTO.StreamEvent;
        } catch {
          return;
        }
        if (event.type === "complete" || event.type === "error") {
          source.close();
          if (viewToken === state.chatViewToken && state.activeChat?.id === chatId) {
            state.streamSource = null;
            state.watchingChat = null;
            state.loading = false;
            if (event.type === "error") deps.shell.showError(new ApiError(event.error));
            void finishWatch(chatId, viewToken);
          }
          return;
        }
        if (viewToken === state.chatViewToken && state.activeChat?.id === chatId) handleTurnEvent(event);
      };
      source.onerror = () => {
        source.close();
        if (viewToken === state.chatViewToken && state.activeChat?.id === chatId) {
          state.streamSource = null;
          state.watchingChat = null;
          startPolling(chatId, viewToken);
        }
      };
    } catch (cause) {
      const e = asError(cause);
      if (!isAbortError(e) && viewToken === state.chatViewToken && state.activeChat?.id === chatId) {
        state.watchingChat = null;
        deps.shell.showError(e);
      }
    }
  }
  async function finishWatch(chatId: string, viewToken: number = state.chatViewToken): Promise<void> {
    if (viewToken !== state.chatViewToken || state.activeChat?.id !== chatId) return;
    try {
      const data = await chatRead<{ messages: DTO.Message[] }>(
        `/api/chats/${chatId}/messages?mode=${deps.shell.state.mode}`,
      );
      if (viewToken !== state.chatViewToken || state.activeChat?.id !== chatId) return;
      setMessagesIfChanged(data.messages);
      const chat = await chatRead<DTO.Chat>(`/api/chats/${chatId}`);
      if (viewToken !== state.chatViewToken || state.activeChat?.id !== chatId) return;
      state.activeChat = chat;
      const found = state.chats.find((c) => c.id === chatId);
      if (found) Object.assign(found, chat);
      state.loading = false;
      await deps.artifacts.refreshOpenFiles(chatId);
    } catch (cause) {
      const e = asError(cause);
      if (!isAbortError(e) && viewToken === state.chatViewToken && state.activeChat?.id === chatId)
        deps.shell.showError(e);
    }
  }
  function startPolling(chatId: string, viewToken: number = state.chatViewToken): void {
    stopPolling();
    state.pollTimer = setInterval(async () => {
      if (viewToken !== state.chatViewToken || state.activeChat?.id !== chatId) {
        stopPolling();
        return;
      }
      try {
        const chat = await chatRead<DTO.Chat>(`/api/chats/${chatId}`);
        if (viewToken !== state.chatViewToken || state.activeChat?.id !== chatId) {
          stopPolling();
          return;
        }
        if (chat.status !== "running") {
          const data = await chatRead<{ messages: DTO.Message[] }>(
            `/api/chats/${chatId}/messages?mode=${deps.shell.state.mode}`,
          );
          if (viewToken !== state.chatViewToken || state.activeChat?.id !== chatId) return;
          setMessagesIfChanged(data.messages);
          state.activeChat = chat;
          const found = state.chats.find((c) => c.id === chatId);
          if (found) Object.assign(found, chat);
          state.loading = false;
          stopPolling();
          await deps.artifacts.refreshOpenFiles(chatId);
          return;
        }
        const data = await chatRead<{ messages: DTO.Message[] }>(
          `/api/chats/${chatId}/messages?mode=${deps.shell.state.mode}`,
        );
        if (viewToken !== state.chatViewToken || state.activeChat?.id !== chatId) return;
        const normalized = setMessagesIfChanged(data.messages);
        const last = normalized[normalized.length - 1];
        if (last?.role === "assistant" && !last._streaming) {
          state.loading = false;
          stopPolling();
          await deps.artifacts.refreshOpenFiles(chatId);
        }
      } catch {}
    }, 3000);
  }
  function stopPolling(): void {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      state.pollTimer = null;
    }
  }
  function stopWatching(): void {
    if (state.streamSource) {
      state.streamSource.close();
      state.streamSource = null;
    }
    state.watchingChat = null;
    stopPolling();
  }
  function setMessagesIfChanged(rawMessages: DTO.Message[]): DTO.Message[] {
    const normalized = deps.presentation.normalizeMessages(rawMessages);
    if (deps.presentation.messagesFingerprint(normalized) !== deps.presentation.messagesFingerprint(state.messages))
      state.messages = normalized;
    return normalized;
  }
  function isActionableAssistant(message: DTO.Message): boolean {
    if (deps.shares.state.sharedMode || state.loading) return false;
    if (message.role !== "assistant" || message._streaming) return false;
    if (!deps.presentation.partsText(message.content).trim()) return false;
    const candidates = state.messages.filter(
      (item) =>
        item.role === "assistant" &&
        !item._streaming &&
        deps.presentation.partsText(item.content).trim() &&
        deps.presentation.messageVisible(item),
    );
    return candidates.length > 0 && candidates[candidates.length - 1]?._key === message._key;
  }
  async function copyMessage(message: DTO.Message): Promise<void> {
    const text = deps.presentation.partsText(message.content);
    try {
      await writeClipboardText(text);
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
      return;
    }
    state.copiedKey = message._key || "";
    setTimeout(() => {
      if (state.copiedKey === message._key) state.copiedKey = "";
    }, 1500);
  }
  async function copyCodeBlock(button: HTMLElement & { _copyTimer?: ReturnType<typeof setTimeout> }): Promise<void> {
    const block = button?.closest?.(".code-block");
    const text = block?.querySelector("code")?.textContent || "";
    if (!text) return;
    try {
      await writeClipboardText(text);
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
      return;
    }
    if (button._copyTimer) clearTimeout(button._copyTimer);
    button.classList.add("copied");
    button._copyTimer = setTimeout(() => button.classList.remove("copied"), 1500);
  }
  async function abort(): Promise<void> {
    if (!state.activeChat) return;
    try {
      await deps.api.api(`/api/chats/${state.activeChat.id}/abort`, {
        method: "POST",
      });
      state.loading = false;
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    }
  }
  function deleteChat(chat: DTO.Chat): void {
    state.deleteChatTarget = chat;
  }
  async function confirmDeleteChat(): Promise<void> {
    const chat = state.deleteChatTarget;
    if (!chat) return;
    try {
      await deps.api.api(`/api/chats/${chat.id}`, { method: "DELETE" });
      state.chats = state.chats.filter((item) => item.id !== chat.id);
      state.deleteChatTarget = null;
      if (state.activeChat?.id === chat.id) newChat();
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    }
  }
  function chooseAgent(id: string): void {
    state.selectedAgentId = id;
    state.agentPickerOpen = false;
  }
  function chatCount(id: string): number {
    return state.chats.filter((c) => c.agent_id === id).length;
  }
  function clearAttachmentCommand(): void {
    state.draft = state.draft.replace(/(?:^|\s)@[^\s]*$/, (value) => (value.startsWith(" ") ? " " : ""));
  }
  function setSharedConversation(chat: DTO.Chat | null, messages: DTO.Message[]): void {
    state.activeChat = chat;
    state.messages = messages;
  }
  function setMessagesLoading(loading: boolean): void {
    state.messagesLoading = loading;
  }
  return {
    state,
    beginChatReads,
    abortChatReads,
    isAbortError,
    chatRead,
    startQuickstart,
    loadChats,
    startEditingChatTitle,
    cancelEditingChatTitle,
    saveChatTitle,
    openChatSearch,
    searchChatResults,
    selectChatSearchAgent,
    selectSearchChat,
    newChat,
    openChat,
    sendFirst,
    skillCommandMatch,
    skillCommandItems,
    skillCommandVisible,
    updateSkillCommandState,
    handleSkillCommandKeydown,
    chooseSkillCommand,
    skillCommandHighlightHtml,
    syncSkillCommandScroll,
    sendMessage,
    markStreamingAssistantMessageEnd,
    updateStreamingAssistant,
    updateStreamingThinking,
    handleTurnEvent,
    watchChat,
    finishWatch,
    startPolling,
    stopPolling,
    stopWatching,
    setMessagesIfChanged,
    isActionableAssistant,
    copyMessage,
    copyCodeBlock,
    abort,
    deleteChat,
    confirmDeleteChat,
    chooseAgent,
    chatCount,
    clearAttachmentCommand,
    setSharedConversation,
    setMessagesLoading,
  };
}
