import type * as DTO from "../shared/types";
import { ApiError, asError } from "../shared/types";
import type { Workspace } from "./workspace";
import { watch, nextTick } from "vue";

import { createIcons, icons } from "lucide";

// Explicit dependency contract for this feature; the composition root supplies it.
type Context = Pick<
  Workspace,
  | "abortChatReads"
  | "activeChat"
  | "activeProcesses"
  | "agents"
  | "api"
  | "appReady"
  | "applyThemePreference"
  | "authChecked"
  | "authUser"
  | "chatViewToken"
  | "chats"
  | "cleanups"
  | "draft"
  | "error"
  | "filesOpen"
  | "healthTimer"
  | "initI18n"
  | "initializeThemePreference"
  | "linkDrawerOpen"
  | "loadAgents"
  | "loadAutopilots"
  | "loadChats"
  | "loadFileViewer"
  | "loadHealth"
  | "loadLibrary"
  | "loadMarketAgents"
  | "loadResources"
  | "loadSession"
  | "loading"
  | "localizedMessage"
  | "messages"
  | "mobileSidebarOpen"
  | "mode"
  | "modeQuery"
  | "newChat"
  | "observeIcons"
  | "observeImageArtifacts"
  | "openChat"
  | "openSharedChat"
  | "page"
  | "profileMenuOpen"
  | "renderIcons"
  | "renderIconsSoon"
  | "resetAccountPassword"
  | "resources"
  | "routeFromUrl"
  | "runError"
  | "selectedAgentId"
  | "settingsOpen"
  | "sharedMode"
  | "showError"
  | "sidebarCollapsed"
  | "stopWatching"
  | "syncFavicon"
  | "syncHighlightTheme"
  | "syncModeFromUrl"
  | "systemThemeQuery"
  | "theme"
  | "themePreference"
  | "toastKind"
  | "toastMessage"
  | "uploadLimits"
>;
export interface Actions {
  init(): Promise<void>;
  renderIcons(): void;
  renderIconsSoon(): void;
  loadHealth(): Promise<void>;
  showToast(message: string, kind?: string): void;
  modeQuery(): string;
  syncModeFromUrl(): void;
  go(page: DTO.Page): void;
  brandClick(): void;
  toggleMobileSidebar(): void;
  comingSoon(name: string): void;
  initializeThemePreference(): void;
  applyThemePreference(value: string): void;
  syncFavicon(): void;
  syncHighlightTheme(): void;
  routeFromUrl(): Promise<void>;
  closeDrawersOutside(event: Event): void;
  showError(cause: unknown): void;
}
export const appActions: Actions = {
  async init(this: Context): Promise<void> {
    this.cleanups.push(
      watch(
        () => this.settingsOpen,
        (open) => {
          if (!open) this.resetAccountPassword();
        },
      ),
    );
    this.cleanups.push(
      watch(
        () => this.authUser,
        (user) => {
          if (!user) this.settingsOpen = false;
        },
      ),
    );
    this.observeIcons();
    this.observeImageArtifacts();
    this.sharedMode =
      window.location.pathname.startsWith("/share/") || new URLSearchParams(location.search).has("share");
    if (this.sharedMode) this.authChecked = true;
    this.initializeThemePreference();
    await this.initI18n();
    if (!this.sharedMode) {
      await this.loadSession();
      if (!this.authUser) {
        this.appReady = true;
        this.renderIconsSoon();
        return;
      }
    } else {
      // Public share views stay anonymous, but a dead link must know whether a
      // session exists before deciding what to render (see openSharedChat).
      await this.loadSession();
    }
    const onPopState = () => {
      void this.routeFromUrl();
    };
    window.addEventListener("popstate", onPopState);
    this.cleanups.push(() => window.removeEventListener("popstate", onPopState));
    try {
      if (this.sharedMode) {
        // Public share view: the regular workspace APIs are auth-gated, so
        // only the token-gated share payload is fetched.
        await this.routeFromUrl();
        return;
      }
      await Promise.all([this.loadAgents(), this.loadChats(), this.loadHealth(), this.loadResources()]);
      if (this.agents.length) this.selectedAgentId = this.agents[0]!.id;
      if (!new URLSearchParams(location.search).has("mode")) this.mode = this.resources.mode || "production";
      this.healthTimer = setInterval(() => this.loadHealth(), 5000);
      await this.routeFromUrl();
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    } finally {
      this.appReady = true;
      this.renderIconsSoon();
    }
  },
  renderIcons(this: Context): void {
    document.querySelectorAll<HTMLElement>("[data-rendered-content]").forEach((root) => createIcons({ icons, root }));
  },
  renderIconsSoon(this: Context): void {
    nextTick(() => requestAnimationFrame(() => this.renderIcons()));
  },
  async loadHealth(this: Context): Promise<void> {
    try {
      const health = await this.api<{
        active_processes: number;
        upload_limits?: { max_files: number; max_bytes: number };
      }>("/api/health");
      this.activeProcesses = health.active_processes || 0;
      if (health.upload_limits) this.uploadLimits = health.upload_limits;
    } catch {}
  },
  showToast(this: Context, message: string, kind: string = "success"): void {
    this.error = "";
    this.toastMessage = this.localizedMessage(message);
    this.toastKind = kind;
    setTimeout(() => {
      this.toastMessage = "";
    }, 5000);
  },
  modeQuery(this: Context): string {
    const value = new URLSearchParams(location.search).get("mode");
    return ["development", "production"].includes(value || "") ? `?mode=${value}` : "";
  },
  syncModeFromUrl(this: Context): void {
    const value = new URLSearchParams(location.search).get("mode");
    this.mode = ["development", "production"].includes(value || "") ? value! : this.resources.mode || "production";
  },
  go(this: Context, page: DTO.Page): void {
    if (page !== "chat") {
      this.stopWatching();
      this.abortChatReads();
      this.chatViewToken += 1;
    }
    this.page = page;
    const path =
      page === "agents"
        ? "/agents"
        : page === "market"
          ? "/market"
          : page === "library"
            ? "/library"
            : page === "autopilots"
              ? "/autopilots"
              : this.activeChat
                ? `/chat/${this.activeChat.id}`
                : "/chat";
    history.pushState({}, "", path + this.modeQuery());
    if (page === "library") this.loadLibrary(1);
    if (page === "autopilots") this.loadAutopilots();
    if (page === "market") this.loadMarketAgents();
  },
  brandClick(this: Context): void {
    if (this.sidebarCollapsed) this.sidebarCollapsed = false;
    else this.newChat();
  },
  toggleMobileSidebar(this: Context): void {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  },
  comingSoon(this: Context, name: string): void {
    this.showError(new ApiError(`${name} is reserved for the next iteration.`));
  },
  initializeThemePreference(this: Context): void {
    const preference = localStorage.getItem("oma-theme-preference");
    this.applyThemePreference(preference || "system");
    this.systemThemeQuery = window.matchMedia?.("(prefers-color-scheme: dark)") || null;
    const onThemeChange = () => {
      if (this.themePreference === "system") this.applyThemePreference("system");
    };
    this.systemThemeQuery?.addEventListener("change", onThemeChange);
    this.cleanups.push(() => this.systemThemeQuery?.removeEventListener("change", onThemeChange));
  },
  applyThemePreference(this: Context, value: string): void {
    this.themePreference = ["system", "light", "dark"].includes(value || "") ? value : "system";
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    this.theme = this.themePreference === "system" ? (prefersDark ? "dark" : "light") : this.themePreference;
    document.documentElement.dataset.theme = this.theme;
    this.syncHighlightTheme();
    this.syncFavicon();
    localStorage.setItem("oma-theme-preference", this.themePreference);
  },
  syncFavicon(this: Context): void {
    const favicon = document.querySelector<HTMLLinkElement>("#app-favicon");
    if (favicon)
      favicon.href = `/static/${this.theme === "dark" ? "favicon-dark-32.png" : "favicon-32.png"}?v=20260917-theme`;
  },
  syncHighlightTheme(this: Context): void {
    const lightTheme = document.querySelector<HTMLStyleElement>("#highlightjs-light-theme");
    const darkTheme = document.querySelector<HTMLStyleElement>("#highlightjs-dark-theme");
    if (lightTheme?.sheet) lightTheme.sheet.disabled = this.theme === "dark";
    if (darkTheme?.sheet) darkTheme.sheet.disabled = this.theme !== "dark";
  },
  async routeFromUrl(this: Context): Promise<void> {
    this.syncModeFromUrl();
    if (window.location.pathname === "/file-view") {
      this.page = "file";
      await this.loadFileViewer();
      return;
    }
    if (window.location.pathname === "/library") {
      this.page = "library";
      await this.loadLibrary(1);
      return;
    }
    if (window.location.pathname === "/market") {
      this.page = "market";
      await this.loadMarketAgents();
      return;
    }
    if (window.location.pathname === "/autopilots") {
      this.page = "autopilots";
      await this.loadAutopilots();
      return;
    }
    const shareMatch = window.location.pathname.match(/^\/share\/([^/]+)$/);
    if (shareMatch) {
      await this.openSharedChat(decodeURIComponent(shareMatch[1]!));
      return;
    }
    if (window.location.pathname === "/agents") {
      this.page = "agents";
      return;
    }
    const match = window.location.pathname.match(/^\/chat\/([^/]+)$/);
    this.page = "chat";
    if (match) {
      const chat = this.chats.find((item) => item.id === decodeURIComponent(match[1]!));
      if (chat) await this.openChat(chat, false);
      else {
        this.activeChat = null;
        this.messages = [];
        this.showError(new ApiError("Chat not found"));
      }
    } else {
      this.activeChat = null;
      this.messages = [];
      this.draft = "";
      this.loading = false;
    }
  },
  closeDrawersOutside(this: Context, event: Event): void {
    if (!(event.target instanceof Element)) return;
    if (!this.filesOpen && !this.linkDrawerOpen && !this.profileMenuOpen) return;
    if (
      event.target.closest?.(".files-drawer") ||
      event.target.closest?.(".files-toggle") ||
      event.target.closest?.(".web-activity") ||
      event.target.closest?.(".sidebar-profile")
    )
      return;
    this.filesOpen = false;
    this.linkDrawerOpen = false;
    this.profileMenuOpen = false;
  },
  showError(this: Context, cause: unknown): void {
    const error = asError(cause);
    if (error?.sessionExpired) return;
    this.toastMessage = "";
    this.error = error.uiMessage || this.localizedMessage(error.message || String(error));
    this.runError = this.error;
    const current = this.messages[this.messages.length - 1];
    if (current?.role === "assistant") {
      current._streaming = false;
      current.content = [];
    }
    setTimeout(() => {
      this.error = "";
      this.runError = "";
    }, 5000);
  },
};
