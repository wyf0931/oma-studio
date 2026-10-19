import type { Actions as SettingsActions, State as SettingsState } from "../features/settings/actions";
import type { Actions as IdentityActions, State as IdentityState } from "../features/identity/actions";
import type { Actions as SharesActions, State as SharesState } from "../features/shares/actions";
import type { Actions as AgentsActions, State as AgentsState } from "../features/agents/actions";
import type { Actions as ChatActions, State as ChatState } from "../features/chat/actions";
import type { Actions as ArtifactsActions, State as ArtifactsState } from "../features/artifacts/actions";
import type { State as PresentationState } from "../features/chat/presentation";
import type { Actions as DomActions } from "../shared/dom";
import type { Actions as I18nActions } from "../shared/i18n";
import type { Actions as ApiActions } from "../shared/api";
import type { Actions as AutopilotsActions } from "../features/autopilots/actions";
import type { Actions as MarketplaceActions } from "../features/marketplace/actions";
import { reactive, watch } from "vue";
import type * as DTO from "../shared/types";
import { ApiError, asError } from "../shared/types";

import { createAppState } from "./shell-state";
export type State = ReturnType<typeof createAppState>;
export interface Actions {
  showPage(page: DTO.Page): void;
  setBootReady(ready: boolean): void;
  clearError(): void;
  init(): Promise<void>;
  loadHealth(): Promise<void>;
  showToast(message: string, kind?: string): void;
  modeQuery(): string;
  syncModeFromUrl(): void;
  go(page: DTO.Page): void;
  brandClick(): void;
  toggleMobileSidebar(): void;
  comingSoon(name: string): void;
  routeFromUrl(): Promise<void>;
  closeDrawersOutside(event: Event): void;
  showError(cause: unknown): void;
  handleUnauthorizedResponse(response: Response, path: string, error: DTO.ApiError): void;
}
export interface Feature extends Actions {
  state: State;
}
export interface Dependencies {
  settings: Pick<SettingsActions, "initializeThemePreference" | "resetAccountPassword"> & {
    state: Pick<SettingsState, "settingsOpen">;
  };
  identity: Pick<IdentityActions, "loadSession"> & {
    state: Pick<IdentityState, "authChecked" | "authUser" | "loginError" | "profileMenuOpen" | "sessionExpired">;
  };
  shares: Pick<SharesActions, "openSharedChat"> & { state: Pick<SharesState, "sharedMode"> };
  agents: Pick<AgentsActions, "loadAgents" | "loadResources"> & { state: Pick<AgentsState, "agents" | "resources"> };
  chat: Pick<ChatActions, "abortChatReads" | "loadChats" | "newChat" | "openChat" | "stopWatching"> & {
    state: Pick<
      ChatState,
      | "activeChat"
      | "chatViewToken"
      | "chats"
      | "draft"
      | "loading"
      | "messages"
      | "messagesLoading"
      | "selectedAgentId"
    >;
  };
  artifacts: Pick<ArtifactsActions, "loadFileViewer" | "loadLibrary"> & {
    state: Pick<ArtifactsState, "files" | "filesOpen" | "uploadLimits">;
  };
  presentation: { state: Pick<PresentationState, "linkDrawerOpen"> };
  dom: Pick<DomActions, "observeIcons" | "observeImageArtifacts" | "renderIconsSoon">;
  i18n: Pick<I18nActions, "initI18n" | "localizedMessage">;
  api: Pick<ApiActions, "api">;
  autopilots: Pick<AutopilotsActions, "loadAutopilots">;
  marketplace: Pick<MarketplaceActions, "loadMarketAgents">;
}
export function createShell(deps: Dependencies): Feature {
  const state = reactive(createAppState());
  async function init(): Promise<void> {
    state.cleanups.push(
      watch(
        () => deps.settings.state.settingsOpen,
        (open) => {
          if (!open) deps.settings.resetAccountPassword();
        },
      ),
    );
    state.cleanups.push(
      watch(
        () => deps.identity.state.authUser,
        (user) => {
          if (!user) deps.settings.state.settingsOpen = false;
        },
      ),
    );
    deps.dom.observeIcons();
    deps.dom.observeImageArtifacts();
    deps.shares.state.sharedMode =
      window.location.pathname.startsWith("/share/") || new URLSearchParams(location.search).has("share");
    if (deps.shares.state.sharedMode) deps.identity.state.authChecked = true;
    deps.settings.initializeThemePreference();
    await deps.i18n.initI18n();
    if (!deps.shares.state.sharedMode) {
      await deps.identity.loadSession();
      if (!deps.identity.state.authUser) {
        state.appReady = true;
        deps.dom.renderIconsSoon();
        return;
      }
    } else {
      // Public share views stay anonymous, but a dead link must know whether a
      // session exists before deciding what to render (see openSharedChat).
      await deps.identity.loadSession();
    }
    const onPopState = () => {
      void routeFromUrl();
    };
    window.addEventListener("popstate", onPopState);
    state.cleanups.push(() => window.removeEventListener("popstate", onPopState));
    try {
      if (deps.shares.state.sharedMode) {
        // Public share view: the regular workspace APIs are auth-gated, so
        // only the token-gated share payload is fetched.
        await routeFromUrl();
        return;
      }
      await Promise.all([deps.agents.loadAgents(), deps.chat.loadChats(), loadHealth(), deps.agents.loadResources()]);
      if (deps.agents.state.agents.length) deps.chat.state.selectedAgentId = deps.agents.state.agents[0]!.id;
      if (!new URLSearchParams(location.search).has("mode"))
        state.mode = deps.agents.state.resources.mode || "production";
      state.healthTimer = setInterval(() => loadHealth(), 5000);
      await routeFromUrl();
    } catch (cause) {
      const e = asError(cause);
      showError(e);
    } finally {
      state.appReady = true;
      deps.dom.renderIconsSoon();
    }
  }
  async function loadHealth(): Promise<void> {
    try {
      const health = await deps.api.api<{
        active_processes: number;
        upload_limits?: { max_files: number; max_bytes: number };
      }>("/api/health");
      state.activeProcesses = health.active_processes || 0;
      if (health.upload_limits) deps.artifacts.state.uploadLimits = health.upload_limits;
    } catch {}
  }
  function showToast(message: string, kind: string = "success"): void {
    state.error = "";
    state.toastMessage = deps.i18n.localizedMessage(message);
    state.toastKind = kind;
    setTimeout(() => {
      state.toastMessage = "";
    }, 5000);
  }
  function modeQuery(): string {
    const value = new URLSearchParams(location.search).get("mode");
    return ["development", "production"].includes(value || "") ? `?mode=${value}` : "";
  }
  function syncModeFromUrl(): void {
    const value = new URLSearchParams(location.search).get("mode");
    state.mode = ["development", "production"].includes(value || "")
      ? value!
      : deps.agents.state.resources.mode || "production";
  }
  function go(page: DTO.Page): void {
    if (page !== "chat") {
      deps.chat.stopWatching();
      deps.chat.abortChatReads();
      deps.chat.state.chatViewToken += 1;
    }
    state.page = page;
    const path =
      page === "agents"
        ? "/agents"
        : page === "market"
          ? "/market"
          : page === "library"
            ? "/library"
            : page === "autopilots"
              ? "/autopilots"
              : deps.chat.state.activeChat
                ? `/chat/${deps.chat.state.activeChat.id}`
                : "/chat";
    history.pushState({}, "", path + modeQuery());
    if (page === "library") deps.artifacts.loadLibrary(1);
    if (page === "autopilots") deps.autopilots.loadAutopilots();
    if (page === "market") deps.marketplace.loadMarketAgents();
  }
  function brandClick(): void {
    if (state.sidebarCollapsed) state.sidebarCollapsed = false;
    else deps.chat.newChat();
  }
  function toggleMobileSidebar(): void {
    state.mobileSidebarOpen = !state.mobileSidebarOpen;
  }
  function comingSoon(name: string): void {
    showError(new ApiError(`${name} is reserved for the next iteration.`));
  }
  async function routeFromUrl(): Promise<void> {
    syncModeFromUrl();
    if (window.location.pathname === "/file-view") {
      state.page = "file";
      await deps.artifacts.loadFileViewer();
      return;
    }
    if (window.location.pathname === "/library") {
      state.page = "library";
      await deps.artifacts.loadLibrary(1);
      return;
    }
    if (window.location.pathname === "/market") {
      state.page = "market";
      await deps.marketplace.loadMarketAgents();
      return;
    }
    if (window.location.pathname === "/autopilots") {
      state.page = "autopilots";
      await deps.autopilots.loadAutopilots();
      return;
    }
    const shareMatch = window.location.pathname.match(/^\/share\/([^/]+)$/);
    if (shareMatch) {
      await deps.shares.openSharedChat(decodeURIComponent(shareMatch[1]!));
      return;
    }
    if (window.location.pathname === "/agents") {
      state.page = "agents";
      return;
    }
    const match = window.location.pathname.match(/^\/chat\/([^/]+)$/);
    state.page = "chat";
    if (match) {
      const chat = deps.chat.state.chats.find((item) => item.id === decodeURIComponent(match[1]!));
      if (chat) await deps.chat.openChat(chat, false);
      else {
        deps.chat.state.activeChat = null;
        deps.chat.state.messages = [];
        showError(new ApiError("Chat not found"));
      }
    } else {
      deps.chat.state.activeChat = null;
      deps.chat.state.messages = [];
      deps.chat.state.draft = "";
      deps.chat.state.loading = false;
    }
  }
  function closeDrawersOutside(event: Event): void {
    if (!(event.target instanceof Element)) return;
    if (
      !deps.artifacts.state.filesOpen &&
      !deps.presentation.state.linkDrawerOpen &&
      !deps.identity.state.profileMenuOpen
    )
      return;
    if (
      event.target.closest?.(".files-drawer") ||
      event.target.closest?.(".files-toggle") ||
      event.target.closest?.(".web-activity") ||
      event.target.closest?.(".sidebar-profile")
    )
      return;
    deps.artifacts.state.filesOpen = false;
    deps.presentation.state.linkDrawerOpen = false;
    deps.identity.state.profileMenuOpen = false;
  }
  function showError(cause: unknown): void {
    const error = asError(cause);
    if (error?.sessionExpired) return;
    state.toastMessage = "";
    state.error = error.uiMessage || deps.i18n.localizedMessage(error.message || String(error));
    state.runError = state.error;
    const current = deps.chat.state.messages[deps.chat.state.messages.length - 1];
    if (current?.role === "assistant") {
      current._streaming = false;
      current.content = [];
    }
    setTimeout(() => {
      state.error = "";
      state.runError = "";
    }, 5000);
  }
  function handleUnauthorizedResponse(response: Response, path: string, error: DTO.ApiError): void {
    if (
      response.status !== 401 ||
      deps.shares.state.sharedMode ||
      path === "/api/auth/login" ||
      path === "/api/auth/session"
    )
      return;
    error.sessionExpired = true;
    if (deps.identity.state.sessionExpired) return;
    deps.identity.state.sessionExpired = true;
    deps.chat.stopWatching();
    deps.chat.abortChatReads();
    deps.chat.state.chatViewToken += 1;
    deps.identity.state.authUser = null;
    deps.identity.state.authChecked = true;
    deps.settings.state.settingsOpen = false;
    deps.chat.state.activeChat = null;
    deps.agents.state.agents = [];
    deps.chat.state.chats = [];
    deps.chat.state.messages = [];
    deps.artifacts.state.files = [];
    deps.chat.state.loading = false;
    deps.chat.state.messagesLoading = false;
    state.page = "chat";
    state.runError = "";
    deps.identity.state.loginError = "";
    state.appReady = true;
    history.replaceState({}, "", "/chat" + modeQuery());
    showToast("Your login session has expired. Please sign in again.", "warning");
  }
  function showPage(page: DTO.Page): void {
    state.page = page;
  }
  function setBootReady(ready: boolean): void {
    state.appReady = ready;
  }
  function clearError(): void {
    state.error = "";
  }
  return {
    state,
    init,
    loadHealth,
    showToast,
    modeQuery,
    syncModeFromUrl,
    go,
    brandClick,
    toggleMobileSidebar,
    comingSoon,
    routeFromUrl,
    closeDrawersOutside,
    showError,
    handleUnauthorizedResponse,
    showPage,
    setBootReady,
    clearError,
  };
}
