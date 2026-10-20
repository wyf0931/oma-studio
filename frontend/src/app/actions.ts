import type { Actions as SettingsActions, State as SettingsState } from "../features/settings/actions";
import type { Actions as IdentityActions, State as IdentityState } from "../features/identity/actions";
import type { Actions as SharesActions, State as SharesState } from "../features/shares/actions";
import type { Actions as AgentsActions, State as AgentsState } from "../features/agents/actions";
import type { Actions as ChatActions, State as ChatState } from "../features/chat/actions";
import type { Actions as ArtifactsActions, State as ArtifactsState } from "../features/artifacts/actions";
import type { Actions as PresentationActions, State as PresentationState } from "../features/chat/presentation";
import type { Actions as DomActions } from "../shared/dom";
import type { Actions as I18nActions } from "../shared/i18n";
import type { Actions as ApiActions } from "../shared/api";
import type { Actions as AutopilotsActions } from "../features/autopilots/actions";
import type { Actions as MarketplaceActions } from "../features/marketplace/actions";
import { unwrap } from "../shared/api";
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
  startSession(): Promise<void>;
  stopSession(expired?: boolean): void;
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
  settings: Pick<SettingsActions, "initializeThemePreference" | "resetAccountPassword" | "closeSettings"> & {
    state: Readonly<Pick<SettingsState, "settingsOpen">>;
  };
  identity: Pick<IdentityActions, "loadSession" | "closeProfileMenu"> & {
    state: Readonly<
      Pick<IdentityState, "authChecked" | "authUser" | "loginError" | "profileMenuOpen" | "sessionExpired">
    >;
  };
  shares: Pick<SharesActions, "openSharedChat" | "setSharedMode"> & {
    state: Readonly<Pick<SharesState, "sharedMode">>;
  };
  agents: Pick<AgentsActions, "loadAgents" | "loadResources"> & {
    state: Readonly<Pick<AgentsState, "agents" | "resources">>;
  };
  chat: Pick<ChatActions, "leaveView" | "clearConversation" | "chooseAgent" | "loadChats" | "newChat" | "openChat"> & {
    state: Readonly<
      Pick<
        ChatState,
        | "activeChat"
        | "chatViewToken"
        | "chats"
        | "draft"
        | "loading"
        | "messages"
        | "messagesLoading"
        | "selectedAgentId"
      >
    >;
  };
  artifacts: Pick<ArtifactsActions, "loadFileViewer" | "loadLibrary" | "setUploadLimits" | "closeFiles"> & {
    state: Readonly<Pick<ArtifactsState, "files" | "filesOpen" | "uploadLimits">>;
  };
  presentation: Pick<PresentationActions, "closeLinkDrawer"> & {
    state: Readonly<Pick<PresentationState, "linkDrawerOpen">>;
  };
  dom: Pick<DomActions, "observeIcons" | "observeImageArtifacts" | "renderIconsSoon">;
  i18n: Pick<I18nActions, "initI18n" | "localizedMessage">;
  api: Pick<ApiActions, "client">;
  onSessionEnded(expired: boolean): void;
  autopilots: Pick<AutopilotsActions, "loadAutopilots">;
  marketplace: Pick<MarketplaceActions, "loadMarketAgents">;
}
export function createShell(deps: Dependencies): Feature {
  const state = reactive(createAppState());
  let sessionActive = false;
  let sessionVersion = 0;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  let errorTimer: ReturnType<typeof setTimeout> | undefined;
  function stopSession(expired = false): void {
    sessionActive = false;
    sessionVersion += 1;
    if (state.healthTimer) clearInterval(state.healthTimer);
    state.healthTimer = null;
    clearTimeout(toastTimer);
    clearTimeout(errorTimer);
    state.toastMessage = "";
    state.error = "";
    deps.onSessionEnded(expired);
    state.page = "chat";
    state.appReady = true;
  }
  async function startSession(): Promise<void> {
    if (sessionActive) return;
    sessionActive = true;
    const version = ++sessionVersion;
    state.appReady = false;
    try {
      await Promise.all([deps.agents.loadAgents(), deps.chat.loadChats(), loadHealth(), deps.agents.loadResources()]);
      if (version !== sessionVersion || !deps.identity.state.authUser) return;
      const agent = deps.agents.state.agents[0];
      if (agent) deps.chat.chooseAgent(agent.id);
      syncModeFromUrl();
      state.healthTimer = setInterval(() => {
        void loadHealth();
      }, 5000);
      await routeFromUrl();
    } catch (cause) {
      if (version === sessionVersion) showError(cause);
    } finally {
      if (version === sessionVersion) {
        state.appReady = true;
        deps.dom.renderIconsSoon();
      }
    }
  }
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
          if (!user) deps.settings.closeSettings();
        },
      ),
    );
    deps.dom.observeIcons();
    deps.dom.observeImageArtifacts();
    deps.shares.setSharedMode(
      window.location.pathname.startsWith("/share/") || new URLSearchParams(location.search).has("share"),
    );
    const onPopState = () => {
      void routeFromUrl().catch(showError);
    };
    window.addEventListener("popstate", onPopState);
    state.cleanups.push(() => window.removeEventListener("popstate", onPopState));
    deps.settings.initializeThemePreference();
    await deps.i18n.initI18n();
    await deps.identity.loadSession();
    if (!deps.shares.state.sharedMode && !deps.identity.state.authUser) {
      state.appReady = true;
      deps.dom.renderIconsSoon();
      return;
    }
    try {
      if (deps.shares.state.sharedMode) {
        // Public share view: the regular workspace APIs are auth-gated, so
        // only the token-gated share payload is fetched.
        await routeFromUrl();
        return;
      }
      await startSession();
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
      const health = unwrap(await deps.api.client.GET("/api/health"));
      state.activeProcesses = health.active_processes || 0;
      if (health.upload_limits) deps.artifacts.setUploadLimits(health.upload_limits);
    } catch {}
  }
  function showToast(message: string, kind: string = "success"): void {
    state.error = "";
    state.toastMessage = deps.i18n.localizedMessage(message);
    state.toastKind = kind;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
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
      deps.chat.leaveView();
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
    if (deps.identity.state.authChecked && !deps.identity.state.authUser && !deps.shares.state.sharedMode) return;
    syncModeFromUrl();
    if (!window.location.pathname.startsWith("/chat/")) deps.chat.leaveView();
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
        deps.chat.clearConversation();
        showError(new ApiError("Chat not found"));
      }
    } else {
      deps.chat.clearConversation();
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
    deps.artifacts.closeFiles();
    deps.presentation.closeLinkDrawer();
    deps.identity.closeProfileMenu();
  }
  function showError(cause: unknown): void {
    const error = asError(cause);
    if (error?.sessionExpired || error.name === "AbortError") return;
    state.toastMessage = "";
    state.error = error.uiMessage || deps.i18n.localizedMessage(error.message || String(error));

    clearTimeout(errorTimer);
    errorTimer = setTimeout(() => {
      state.error = "";
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
    stopSession(true);
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
    startSession,
    stopSession,
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
