function platform() {
  return {
    settingsOpen: false,
    settingsTab: "general",
    usageOpen: false,
    usersOpen: false,
    shareRecordsOpen: false,
    shareRecordsLoading: false,
    shareRecords: [],
    shareRevokeTarget: null,
    shareRevoking: false,
    usageTab: "overview",
    usageRange: "7",
    usageLoading: false,
    usageError: "",
    usageData: {
      summary: { sessions: 0, input: 0, output: 0, cacheRead: 0, cost: 0, search: 0, fetch: 0 },
      daily: [],
      sessions: [],
      users: [],
      agents: [],
    },
    language: ["en", "zh-CN"].includes(localStorage.getItem("oma-language"))
      ? localStorage.getItem("oma-language")
      : "en",
    i18nReady: false,
    i18nMessages: {},
    systemTimezone: "",
    themePreference: "system",
    runError: "",
    mobileSidebarOpen: false,
    linkDrawerOpen: false,
    linkDrawerTitle: "",
    linkDrawerItems: [],
    webActivities: Object.create(null),
    autopilots: [],
    autopilotSearch: "",
    autopilotAgentFilter: "",
    autopilotAgentPickerOpen: false,
    autopilotEditAgentPickerOpen: false,
    autopilotDialog: null,
    autopilotRuns: [],
    autopilotRunsOpen: false,
    autopilotRunsItem: null,
    autopilotLoading: false,
    autopilotSaving: false,
    autopilotEditing: null,
    autopilotName: "",
    autopilotInstruction: "",
    autopilotAgentId: "",
    autopilotCron: "0 * * * *",
    autopilotStartsAt: "",
    autopilotEndsAt: "",
    autopilotDeleteTarget: null,
    cronBuilderOpen: false,
    cronFrequency: "hourly",
    cronDay: ["1"],
    cronHour: "9",
    cronMinute: "0",
    cronMonth: "1",
    cronDayOfMonth: "1",
    page: "chat",
    agents: [],
    chats: [],
    activeChat: null,
    editingChatTitle: false,
    chatTitleDraft: "",
    chatTitleSaving: false,
    messages: [],
    selectedAgentId: "",
    skillCommandIndex: 0,
    skillCommandDismissed: false,
    sidebarCollapsed: false,
    agentPickerOpen: false,
    activeProcesses: 0,
    draft: "",
    loading: false,
    chatViewToken: 0,
    chatReadController: null,
    watchingChat: null,
    streamSource: null,
    pollTimer: null,
    sharedMode: false,
    sharedToken: "",
    sharedCanManage: false,
    shareMode: false,
    shareStep: null,
    shareUrl: "",
    shareTarget: "session",
    creatingShare: false,
    copiedShare: false,
    copiedKey: "",
    messagesLoading: false,
    sessionUsage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cost: 0,
      search: 0,
      fetch: 0,
    },
    reasoningOpen: Object.create(null),
    filesOpen: false,
    filesLoading: false,
    files: [],
    inputFiles: [],
    filesTab: "outputs",
    pendingUploads: [],
    pendingArtifacts: [],
    uploadingFiles: false,
    uploadDragActive: false,
    uploadDragDepth: 0,
    uploadSelection: [],
    attachmentCommandIndex: 0,
    attachmentCommandDismissed: false,
    uploadLimits: { max_files: 100, max_bytes: 100 * 1024 * 1024 },
    fileViewer: null,
    fileViewerExpired: false,
    sharingViewedFile: false,
    libraryFiles: [],
    libraryLoading: false,
    librarySearch: "",
    libraryAgentFilter: "",
    libraryAgentPickerOpen: false,
    libraryPage: 1,
    libraryPages: 1,
    libraryTotal: 0,
    agentSearch: "",
    marketTab: "skills",
    marketAgents: [],
    marketAgentsLoading: false,
    marketPublishTarget: null,
    marketPublishVersion: "v1.0.0",
    marketPublishing: false,
    marketDeleteAgentTarget: null,
    marketDeletingAgent: false,
    marketInstallAgentTarget: null,
    marketInstallingAgent: false,
    marketUpdateAgentTarget: null,
    marketUpdatingAgent: false,
    marketCatalogSearch: "",
    marketInstallOpen: false,
    marketMcpAddOpen: false,
    marketMcpConfig:
      '{\n  "mcpServers": {\n    "server-name": {\n      "type": "http",\n      "url": "https://example.com/mcp"\n    }\n  }\n}',
    marketMcpAction: false,
    marketSearch: "",
    marketOwner: "",
    marketSearchResults: [],
    marketSearchLoading: false,
    marketSearchError: "",
    marketInstallingSkills: [],
    marketExtensionPackage: "",
    marketExtensionAction: false,
    marketUninstallTarget: null,
    toastMessage: "",
    toastKind: "success",
    authChecked: false,
    authUser: null,
    loginUsername: "",
    loginPassword: "",
    loginLoading: false,
    loginError: "",
    users: [],
    usersLoading: false,
    userAddOpen: false,
    userCreating: false,
    userDeleteTarget: null,
    logoutConfirmOpen: false,
    profileMenuOpen: false,
    newUserUsername: "",
    newUserEmail: "",
    searchOpen: false,
    chatSearchQuery: "",
    chatSearchAgentFilter: "",
    chatSearchAgentPickerOpen: false,
    error: "",
    dialog: null,
    confirmTarget: null,
    deleteChatTarget: null,
    editingAgent: null,
    createDialog: false,
    creating: false,
    generatingInstruction: false,
    newAgentName: "",
    newAgentDescription: "",
    newAgentTags: "",
    newAgentQuickstarts: "",
    newAgentInstruction: "",
    newAgentAvatarFile: null,
    newAgentAvatarPreview: "",
    newAgentProvider: "",
    newAgentModel: "",
    newAgentThinkingLevel: "",
    newAgentTools: [],
    newAgentExtensions: [],
    newAgentSkills: [],
    newAgentMcpServers: [],
    agentWizardStep: 1,
    agentSkillSearch: "",
    mode: ["development", "production"].includes(new URLSearchParams(location.search).get("mode"))
      ? new URLSearchParams(location.search).get("mode")
      : "production",
    resources: {
      extensions: [],
      skills: [],
      mcp_servers: [],
      providers: [],
      default_tools: [],
      default_extensions: [],
      default_skills: [],
      default_mcp_servers: [],
      mode: "production",
      default_thinking_level: "low",
    },
    toolCatalog: [
      { name: "read", description: "Read file contents" },
      { name: "write", description: "Create or overwrite files" },
      { name: "edit", description: "Patch files with find/replace" },
      { name: "bash", description: "Run shell commands" },
      { name: "grep", description: "Search file contents" },
      { name: "find", description: "Find files by glob" },
      { name: "ls", description: "List directory contents" },
    ],
    toolGroups: [
      {
        id: "read_only",
        label: "Read only",
        description: "Inspect files and search the workspace without changing it.",
        tools: ["ls", "read", "grep", "find"],
      },
      {
        id: "write_files",
        label: "Write files",
        description: "Create, update, and publish files for the user.",
        tools: ["write", "edit", "publish_artifact"],
      },
      {
        id: "web_access",
        label: "Web access",
        description: "Search the web and fetch pages as readable content.",
        tools: ["web_fetch", "web_search"],
      },
      {
        id: "run_scripts",
        label: "Run scripts",
        description: "Execute shell commands in the workspace.",
        tools: ["bash"],
      },
      {
        id: "image_creation",
        label: "Image creation",
        description: "Generate and edit images with the configured automatic image provider.",
        tools: ["generate_image", "edit_image"],
      },
    ],
    theme: "light",
    systemThemeQuery: null,
    appReady: false,
    sessionExpired: false,
    async init() {
      window.omaPlatform = this;
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
      window.addEventListener("popstate", () => this.routeFromUrl());
      try {
        if (this.sharedMode) {
          // Public share view: the regular workspace APIs are auth-gated, so
          // only the token-gated share payload is fetched.
          await this.routeFromUrl();
          return;
        }
        await Promise.all([this.loadAgents(), this.loadChats(), this.loadHealth(), this.loadResources()]);
        if (this.agents.length) this.selectedAgentId = this.agents[0].id;
        if (!new URLSearchParams(location.search).has("mode")) this.mode = this.resources.mode || "production";
        setInterval(() => this.loadHealth(), 5000);
        await this.routeFromUrl();
      } catch (e) {
        this.showError(e);
      } finally {
        this.appReady = true;
        this.renderIconsSoon();
      }
    },
    renderIcons() {
      if (window.lucide?.createIcons) window.lucide.createIcons();
    },
    renderIconsSoon() {
      this.$nextTick(() => requestAnimationFrame(() => this.renderIcons()));
    },
    async initI18n() {
      try {
        const resources = await Promise.all(
          ["en", "zh-CN"].map(async (locale) => {
            const response = await fetch(`/static/locales/${locale}.json`, { cache: "no-store" });
            if (!response.ok) throw new Error(`Unable to load ${locale} translations`);
            return [locale, await response.json()];
          }),
        );
        this.i18nMessages = Object.fromEntries(resources);
        const resourceMap = Object.fromEntries(
          resources.map(([locale, messages]) => [locale, { translation: messages }]),
        );
        if (window.i18next) {
          await window.i18next.init({
            lng: this.language,
            fallbackLng: "en",
            resources: resourceMap,
            interpolation: { escapeValue: false },
            returnNull: false,
          });
        }
      } catch (error) {
        console.warn("OMA i18n initialization failed; using English fallback", error);
      }
      this.syncDocumentLanguage();
      this.i18nReady = true;
    },
    t(key, options = {}) {
      this.i18nReady;
      const fallback = options.defaultValue || key;
      const lookup = (messages) =>
        String(key)
          .split(".")
          .reduce((value, part) => value?.[part], messages);
      const localMessage = lookup(this.i18nMessages[this.language]) ?? lookup(this.i18nMessages.en);
      if (typeof localMessage === "string") {
        return localMessage.replace(/{{\s*(\w+)\s*}}/g, (_, name) => String(options[name] ?? ""));
      }
      return window.i18next?.isInitialized ? window.i18next.t(key, { ...options, defaultValue: fallback }) : fallback;
    },
    localizedMessage(message) {
      const exactKey = {
        "Your login session has expired. Please sign in again.": "auth.sessionExpired",
        "Unable to load usage statistics.": "errors.loadUsage",
        "Enter an npm package id": "errors.enterNpm",
        "Avatar must be an image file": "errors.avatarImage",
        "Avatar must be 5 MB or smaller": "errors.avatarSize",
        "Chat title cannot be empty": "chat.titleEmpty",
        "File reference is incomplete": "chat.fileIncomplete",
        "System timezone updated": "toasts.timezoneUpdated",
        "Agent profile optimized": "toasts.agentOptimized",
        "Failed to fetch": "errors.network",
        "NetworkError when attempting to fetch resource.": "errors.network",
        "Agent updated": "agents.updated",
        "Agent created": "agents.created",
      }[message];
      if (exactKey) return this.t(exactKey, { defaultValue: message });
      const dynamic = [
        [/^User (.+) added$/, "toasts.userAdded", ["username"]],
        [/^User (.+) (enabled|disabled)$/, "toasts.userStatus", ["username", "status"]],
        [/^User (.+) deleted$/, "toasts.userDeleted", ["username"]],
        [/^Skill (.+) installed$/, "toasts.skillInstalled", ["skill"]],
        [/^Extension (.+) installed$/, "toasts.extensionInstalled", ["name"]],
        [/^MCP server (.+) deleted$/, "toasts.mcpDeleted", ["name"]],
        [/^(Extension|Skill) (.+) uninstalled$/, "toasts.resourceUninstalled", ["kind", "name"]],
        [/^Agent (.+) removed from Marketplace$/, "toasts.agentRemoved", ["name"]],
        [/^Agent (.+) deleted$/, "toasts.agentDeleted", ["name"]],
      ];
      for (const [pattern, key, names] of dynamic) {
        const match = pattern.exec(message);
        if (match) {
          const values = Object.fromEntries(names.map((name, index) => [name, match[index + 1]]));
          if (key === "toasts.userStatus" && this.language === "zh-CN") {
            values.status = values.status === "enabled" ? "启用" : "停用";
          }
          return this.t(key, values);
        }
      }
      return message;
    },
    locale() {
      return this.language === "zh-CN" ? "zh-CN" : "en-US";
    },
    syncDocumentLanguage() {
      document.documentElement.lang = this.language;
    },
    async setLanguage(value) {
      const locale = ["en", "zh-CN"].includes(value) ? value : "en";
      this.language = locale;
      localStorage.setItem("oma-language", locale);
      this.syncDocumentLanguage();
      if (window.i18next?.isInitialized) await window.i18next.changeLanguage(locale);
    },
    observeIcons() {
      if (!window.MutationObserver) return;
      if (this._iconObserver) return;
      const observer = new MutationObserver((mutations) => {
        const hasIcons = mutations.some((mutation) =>
          [...mutation.addedNodes].some(
            (node) =>
              node.nodeType === Node.ELEMENT_NODE &&
              node.tagName?.toLowerCase() !== "svg" &&
              (node.matches?.("[data-lucide]") || node.querySelector?.("[data-lucide]")),
          ),
        );
        if (hasIcons) this.renderIcons();
      });
      // Keep a reference: an unreferenced MutationObserver is garbage-collected
      // even while observing, which silently killed icon conversion after init.
      this._iconObserver = observer;
      observer.observe(document.body, { childList: true, subtree: true });
    },
    observeImageArtifacts() {
      const artifactFor = (target) =>
        target instanceof HTMLImageElement && target.matches(".chat-image-artifact img")
          ? target.closest(".chat-image-artifact")
          : null;
      document.addEventListener(
        "load",
        (event) => {
          const artifact = artifactFor(event.target);
          if (!artifact) return;
          artifact.classList.remove("skeleton");
          artifact.classList.add("is-loaded");
        },
        true,
      );
      document.addEventListener(
        "error",
        (event) => {
          const artifact = artifactFor(event.target);
          if (!artifact) return;
          artifact.classList.remove("skeleton");
          artifact.classList.add("is-error");
        },
        true,
      );
    },
    async request(path, options = {}) {
      const requestId = crypto.randomUUID();
      const headers = new Headers(options.headers || {});
      headers.set("X-Request-ID", requestId);
      const response = await fetch(path, {
        ...options,
        cache: "no-store",
        headers,
      });
      return { response, requestId };
    },
    async responseData(response, requestId, requestPath) {
      const responseId = response.headers.get("X-Request-ID") || requestId;
      const contentType = response.headers.get("content-type") || "";
      let data = null;
      if (contentType.includes("json")) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        await response.text();
      }
      if (!response.ok) {
        const error = this.errorFromResponse(response, responseId, data);
        this.handleUnauthorizedResponse(response, requestPath, error);
        throw error;
      }
      return { data, responseId };
    },
    async api(path, options = {}) {
      const requestPath = path.includes("/messages") && !path.includes("?") ? `${path}?mode=${this.mode}` : path;
      const headers = new Headers(options.headers || {});
      if (options.body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      const { response, requestId } = await this.request(requestPath, { ...options, headers });
      const { data, responseId } = await this.responseData(response, requestId, requestPath);
      if (data === null) {
        const error = new Error(`Server returned a non-JSON response (request_id: ${responseId})`);
        error.requestId = responseId;
        throw error;
      }
      return data;
    },
    beginChatReads() {
      this.abortChatReads();
      this.chatReadController = new AbortController();
    },
    abortChatReads() {
      this.chatReadController?.abort();
      this.chatReadController = null;
    },
    isAbortError(error) {
      return error?.name === "AbortError";
    },
    chatRead(path) {
      return this.api(path, { signal: this.chatReadController?.signal });
    },
    async loadSession() {
      try {
        const data = await this.api("/api/auth/session");
        this.authUser = data.user;
      } catch (error) {
        this.authUser = null;
        this.loginError = error.uiMessage || error.message;
      } finally {
        this.authChecked = true;
      }
    },
    async login() {
      if (this.loginLoading) return;
      this.loginLoading = true;
      this.loginError = "";
      try {
        this.authUser = await this.api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            username: this.loginUsername,
            password: this.loginPassword,
          }),
        });
        this.sessionExpired = false;
        this.loginPassword = "";
        this.appReady = false;
        await Promise.all([this.loadAgents(), this.loadChats(), this.loadHealth(), this.loadResources()]);
        if (this.agents.length) this.selectedAgentId = this.agents[0].id;
        this.appReady = true;
        await this.routeFromUrl();
        this.renderIconsSoon();
      } catch (error) {
        this.authUser = null;
        this.loginError = error.message;
      } finally {
        this.loginLoading = false;
      }
    },
    requestLogout() {
      this.logoutConfirmOpen = true;
    },
    async confirmLogout() {
      try {
        await this.api("/api/auth/logout", { method: "POST" });
        this.logoutConfirmOpen = false;
        this.authUser = null;
        this.authChecked = true;
        this.appReady = true;
        this.page = "chat";
      } catch (error) {
        this.showError(error);
      }
    },
    profileAvatarInitials() {
      return this.initials(this.authUser?.username || "User");
    },
    profileRoleLabel() {
      return this.authUser?.role === "admin" ? this.t("nav.administrator") : this.t("nav.member");
    },
    openProfileSettings() {
      this.profileMenuOpen = false;
      this.openSettings();
    },
    async openProfileUsage() {
      this.profileMenuOpen = false;
      await this.openUsage();
    },
    async openProfileUsers() {
      this.profileMenuOpen = false;
      this.usersOpen = true;
      await this.loadUsers();
    },
    async openProfileShares() {
      this.profileMenuOpen = false;
      this.shareRecordsOpen = true;
      await this.loadShareRecords();
    },
    openProfileLogout() {
      this.profileMenuOpen = false;
      this.requestLogout();
    },
    errorFromResponse(response, requestId, data = null) {
      const detail = data?.detail || `Server returned ${response.status}`;
      const params = data?.params || {};
      const message = data?.code ? this.t(data.code, { ...params, defaultValue: detail }) : detail;
      const error = new Error(`${message} (request_id: ${requestId})`);
      error.uiMessage = message;
      error.requestId = requestId;
      error.status = response.status;
      error.code = data?.code || "";
      error.params = params;
      return error;
    },
    handleUnauthorizedResponse(response, path, error) {
      if (response.status !== 401 || this.sharedMode || path === "/api/auth/login" || path === "/api/auth/session")
        return;
      error.sessionExpired = true;
      if (this.sessionExpired) return;
      this.sessionExpired = true;
      this.stopWatching();
      this.abortChatReads();
      this.chatViewToken += 1;
      this.authUser = null;
      this.authChecked = true;
      this.activeChat = null;
      this.agents = [];
      this.chats = [];
      this.messages = [];
      this.files = [];
      this.loading = false;
      this.messagesLoading = false;
      this.page = "chat";
      this.runError = "";
      this.loginError = "";
      this.appReady = true;
      history.replaceState({}, "", "/chat" + this.modeQuery());
      this.showToast("Your login session has expired. Please sign in again.", "warning");
    },
    async loadAgents() {
      try {
        await this.refreshAgents();
      } catch (e) {
        this.showError(e);
      }
    },
    async refreshAgents() {
      const data = await this.api("/api/agents");
      this.agents = data.agents || [];
      return this.agents;
    },
    agentItems() {
      const query = this.agentSearch.trim().toLowerCase();
      if (!query) return this.agents;
      return this.agents.filter((item) =>
        `${item.name || ""} ${item.description || ""} ${(item.tags || []).join(" ")}`.toLowerCase().includes(query),
      );
    },
    async loadUsers() {
      this.usersLoading = true;
      try {
        this.users = (await this.api("/api/users")).users;
      } catch (error) {
        this.showError(error);
      } finally {
        this.usersLoading = false;
      }
    },
    async loadShareRecords() {
      this.shareRecordsLoading = true;
      try {
        this.shareRecords = (await this.api("/api/shares")).shares || [];
      } catch (error) {
        this.showError(error);
      } finally {
        this.shareRecordsLoading = false;
      }
    },
    shareRecordTitle(share) {
      if (share.kind === "artifact") return String(share.path || "");
      const title = String(share.title || "");
      return [...title].length > 20 ? `${[...title].slice(0, 20).join("")}…` : title;
    },
    shareRecordUrl(share) {
      return share.url || `/share/${encodeURIComponent(share.token || "")}`;
    },
    requestRevokeShare(share) {
      this.shareRevokeTarget = share;
    },
    async confirmRevokeShare() {
      const share = this.shareRevokeTarget;
      if (!share || this.shareRevoking) return;
      const viewingRevokedShare = this.sharedMode && share.token === this.sharedToken;
      this.shareRevoking = true;
      try {
        await this.api(`/api/shares/${encodeURIComponent(share.token)}`, { method: "DELETE" });
        this.shareRecords = this.shareRecords.filter((item) => item.token !== share.token);
        if (this.fileViewer?.artifactShare?.token === share.token) this.fileViewer.artifactShare = null;
        if (this.shareUrl.endsWith(`/share/${share.token}`) || this.shareUrl.includes(`share=${share.token}&`)) {
          this.resetShare();
        }
        this.shareRevokeTarget = null;
        this.showToast(this.t("share.revoked"));
        // The page the owner is looking at no longer has a public link.
        if (viewingRevokedShare) location.assign("/");
      } catch (error) {
        this.showError(error);
      } finally {
        this.shareRevoking = false;
      }
    },
    openAddUser() {
      this.newUserUsername = "";
      this.newUserEmail = "";
      this.userAddOpen = true;
    },
    async createManagedUser() {
      if (this.userCreating) return;
      this.userCreating = true;
      try {
        await this.api("/api/users", {
          method: "POST",
          body: JSON.stringify({
            username: this.newUserUsername,
            email: this.newUserEmail || null,
          }),
        });
        await this.loadUsers();
        this.userAddOpen = false;
        this.showToast(`User ${this.newUserUsername} added`);
      } catch (error) {
        this.showError(error);
      } finally {
        this.userCreating = false;
      }
    },
    async toggleManagedUser(user) {
      const status = user.status === "active" ? "disabled" : "active";
      try {
        await this.api(`/api/users/${user.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        await this.loadUsers();
        this.showToast(`User ${user.username} ${status}`);
      } catch (error) {
        this.showError(error);
      }
    },
    requestDeleteUser(user) {
      if (user.role !== "admin") this.userDeleteTarget = user;
    },
    async confirmDeleteUser() {
      const user = this.userDeleteTarget;
      if (!user) return;
      try {
        await this.api(`/api/users/${user.id}`, { method: "DELETE" });
        await this.loadUsers();
        this.userDeleteTarget = null;
        this.showToast(`User ${user.username} deleted`);
      } catch (error) {
        this.showError(error);
      }
    },
    async loadChats() {
      try {
        this.chats = (await this.api("/api/chats")).chats;
      } catch (e) {
        this.showError(e);
      }
    },
    startEditingChatTitle() {
      if (this.sharedMode || !this.activeChat) return;
      this.chatTitleDraft = this.activeChat.title || "";
      this.editingChatTitle = true;
      this.$nextTick(() => {
        document.getElementById("chat-title-input")?.focus();
      });
    },
    cancelEditingChatTitle() {
      this.editingChatTitle = false;
      this.chatTitleDraft = "";
    },
    async saveChatTitle() {
      if (!this.editingChatTitle || this.chatTitleSaving) return;
      const chatId = this.activeChat?.id;
      if (!chatId) return;
      const title = this.chatTitleDraft.trim();
      if (!title) {
        this.showError(new Error("Chat title cannot be empty"));
        this.chatTitleDraft = this.activeChat?.title || "";
        return;
      }
      this.chatTitleSaving = true;
      try {
        const updated = await this.api(`/api/chats/${chatId}`, {
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
      } catch (error) {
        this.showError(error);
      } finally {
        this.chatTitleSaving = false;
      }
    },
    openChatSearch() {
      this.chatSearchQuery = "";
      this.chatSearchAgentFilter = "";
      this.chatSearchAgentPickerOpen = false;
      this.searchOpen = true;
    },
    searchChatResults() {
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
    selectChatSearchAgent(agentId) {
      this.chatSearchAgentFilter = agentId;
      this.chatSearchAgentPickerOpen = false;
    },
    selectSearchChat(chat) {
      this.searchOpen = false;
      this.openChat(chat);
    },
    async loadHealth() {
      try {
        const health = await this.api("/api/health");
        this.activeProcesses = health.active_processes || 0;
        if (health.upload_limits) this.uploadLimits = health.upload_limits;
      } catch {}
    },
    async loadResources() {
      try {
        await this.refreshResources();
      } catch (e) {
        this.showError(e);
      }
    },
    async refreshResources() {
      this.resources = await this.api("/api/resources");
      if (this.resources.tools?.length) this.toolCatalog = this.resources.tools;
      return this.resources;
    },
    async loadMarketAgents() {
      this.marketAgentsLoading = true;
      try {
        this.marketAgents = (await this.api("/api/market/agents")).agents || [];
      } catch (error) {
        this.showError(error);
      } finally {
        this.marketAgentsLoading = false;
      }
    },
    marketAgentItems() {
      const query = this.marketCatalogSearch.trim().toLowerCase();
      if (!query) return this.marketAgents;
      return this.marketAgents.filter((item) =>
        `${item.name || ""} ${item.description || ""} ${item.instruction || ""} ${item.author || ""} ${(item.tags || []).join(" ")}`
          .toLowerCase()
          .includes(query),
      );
    },
    marketCatalogItems(kind) {
      const items = this.resources[kind] || [];
      const query = this.marketCatalogSearch.trim().toLowerCase();
      if (!query) return items;
      return items.filter((item) => `${item.name || ""} ${item.description || ""}`.toLowerCase().includes(query));
    },
    async searchMarketSkills() {
      const query = this.marketSearch.trim();
      if (!query) {
        this.marketSearchResults = [];
        this.marketSearchError = "Enter a skill or topic to search.";
        return;
      }
      this.marketSearchLoading = true;
      this.marketSearchError = "";
      try {
        const githubSource = this.marketSkillGitHubSource(query);
        const data = await this.api(githubSource ? "/api/market/skills/preview" : "/api/market/skills/search", {
          method: "POST",
          body: JSON.stringify(
            githubSource ? { source: githubSource } : { query, owner: this.marketOwner.trim() || null },
          ),
        });
        this.marketSearchResults = data.results || [];
      } catch (error) {
        this.marketSearchResults = [];
        this.marketSearchError = error.message;
      } finally {
        this.marketSearchLoading = false;
      }
    },
    marketSkillGitHubSource(value) {
      const source = value.trim().replace(/\/$/, "");
      return /^(?:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?(?:\/tree\/[^/]+(?:\/.*)?)?|git@github\.com:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?|ssh:\/\/git@github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?)$/i.test(
        source,
      )
        ? source
        : "";
    },
    openMarketInstall() {
      this.marketSearch = "";
      this.marketOwner = "";
      this.marketSearchResults = [];
      this.marketSearchError = "";
      this.marketExtensionPackage = "";
      this.marketInstallOpen = true;
    },
    closeMarketInstall() {
      if (this.marketInstallingSkills.length || this.marketExtensionAction) return;
      this.marketInstallOpen = false;
      this.marketSearchError = "";
    },
    openMarketMcpAdd() {
      this.marketMcpConfig =
        '{\n  "mcpServers": {\n    "server-name": {\n      "type": "http",\n      "url": "https://example.com/mcp"\n    }\n  }\n}';
      this.marketMcpAddOpen = true;
    },
    closeMarketMcpAdd() {
      if (!this.marketMcpAction) this.marketMcpAddOpen = false;
    },
    marketMcpNames() {
      try {
        const servers = JSON.parse(this.marketMcpConfig)?.mcpServers;
        return servers && typeof servers === "object" && !Array.isArray(servers) ? Object.keys(servers) : [];
      } catch {
        return [];
      }
    },
    async addMarketMcpServers() {
      this.marketMcpAction = true;
      try {
        const data = await this.api("/api/market/mcp-servers", {
          method: "POST",
          body: JSON.stringify({ config: this.marketMcpConfig }),
        });
        this.resources = data.resources;
        this.marketMcpAddOpen = false;
        this.showToast(`MCP server${data.servers.length === 1 ? "" : "s"} added`);
      } catch (error) {
        this.showError(error);
      } finally {
        this.marketMcpAction = false;
      }
    },
    marketSkillInstalled(result) {
      const sourceKey = this.marketSkillSourceKey(result.repo);
      return this.resources.skills.some(
        (item) =>
          item.name === result.skill &&
          (!sourceKey || !item.source || this.marketSkillSourceKey(item.source) === sourceKey),
      );
    },
    marketSkillSourceKey(source) {
      return String(source || "")
        .trim()
        .replace(/^https:\/\/github\.com\//i, "")
        .replace(/\.git\/?$/i, "")
        .replace(/\/$/, "")
        .toLowerCase();
    },
    marketSkillResultKey(result) {
      return `${result.repo || ""}:${result.skill}`;
    },
    async installMarketSkill(result) {
      const resultKey = this.marketSkillResultKey(result);
      if (this.marketInstallingSkills.includes(resultKey) || this.marketSkillInstalled(result)) return;
      this.marketInstallingSkills.push(resultKey);
      this.marketSearchError = "";
      try {
        await this.api("/api/market/skills/install", {
          method: "POST",
          body: JSON.stringify({ source: result.repo, skill: result.skill }),
        });
        await this.refreshResources();
        this.showToast(`Skill ${result.skill} installed`);
      } catch (error) {
        this.showError(error);
      } finally {
        this.marketInstallingSkills = this.marketInstallingSkills.filter((key) => key !== resultKey);
      }
    },
    async installMarketExtension() {
      const packageInput = this.marketExtensionPackage.trim();
      if (!packageInput) {
        this.showError(new Error("Enter an npm package id"));
        return;
      }
      this.marketExtensionAction = true;
      try {
        const data = await this.api("/api/market/extensions/install", {
          method: "POST",
          body: JSON.stringify({ package: packageInput }),
        });
        await this.refreshResources();
        const installed = data.package?.replace(/^npm:/, "") || packageInput;
        this.marketInstallOpen = false;
        this.marketExtensionPackage = "";
        this.showToast(`Extension ${installed} installed`);
      } catch (error) {
        this.showError(error);
      } finally {
        this.marketExtensionAction = false;
      }
    },
    marketResourceSource(kind, item) {
      if (item?.source) return item.source;
      if (kind === "extensions" && item?.path?.includes("/npm/node_modules/")) return `npm:${item.name}`;
      if (kind === "extensions" && item?.path) return item.path;
      if (kind === "skills" && item?.name) return item.name;
      return "";
    },
    marketResourceAuthor(kind, item) {
      const author = typeof item?.author === "string" ? item.author.trim() : "";
      const sourceAuthor = kind === "skills" && item?.source ? item.source.split("/", 1)[0].trim() : "";
      return (author || sourceAuthor || "admin").slice(0, 10);
    },
    marketSearchPlaceholder() {
      const key = {
        skills: "marketplace.searchSkills",
        extensions: "marketplace.searchExtensions",
        mcp_servers: "marketplace.searchMcpServers",
        agents: "marketplace.searchAgents",
        agent_teams: "marketplace.searchAgentTeams",
      }[this.marketTab];
      return this.t(key || "marketplace.searchResources");
    },
    openMarketUninstall(kind, item) {
      if (!this.marketResourceSource(kind, item)) return;
      this.marketUninstallTarget = { kind, item };
    },
    async confirmMarketUninstall() {
      const target = this.marketUninstallTarget;
      if (!target) return;
      const { kind, item } = target;
      if (kind === "mcp_servers") {
        try {
          const data = await this.api(`/api/market/mcp-servers/${encodeURIComponent(item.name)}`, { method: "DELETE" });
          this.resources = data.resources;
          this.marketUninstallTarget = null;
          this.showToast(`MCP server ${item.name} deleted`);
        } catch (error) {
          this.showError(error);
        }
        return;
      }
      const path = kind === "extensions" ? "/api/market/extensions/uninstall" : "/api/market/skills/uninstall";
      const packageSource = this.marketResourceSource(kind, item);
      const payload =
        kind === "extensions"
          ? packageSource.startsWith("npm:")
            ? { package: packageSource }
            : { path: packageSource }
          : {
              source: item.source || null,
              skill: item.name,
            };
      try {
        await this.api(path, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        await this.refreshResources();
        this.marketUninstallTarget = null;
        this.showToast(`${kind === "extensions" ? "Extension" : "Skill"} ${item.name} uninstalled`);
      } catch (error) {
        this.showError(error);
      }
    },
    showToast(message, kind = "success") {
      this.error = "";
      this.toastMessage = this.localizedMessage(message);
      this.toastKind = kind;
      setTimeout(() => {
        this.toastMessage = "";
      }, 5000);
    },
    async toggleFiles() {
      this.filesOpen = !this.filesOpen;
      if (this.filesOpen) this.linkDrawerOpen = false;
      if (this.filesOpen && this.activeChat) {
        if (this.sharedMode) await this.loadSharedFiles();
        else await this.loadChatFiles();
      }
    },
    async refreshOpenFiles(chatId = this.activeChat?.id) {
      if (!this.filesOpen || !chatId || this.activeChat?.id !== chatId) return;
      if (this.sharedMode) await this.loadSharedFiles();
      else await this.loadChatFiles();
    },
    async loadSharedFiles() {
      this.filesLoading = true;
      try {
        this.files = (await this.api(`/api/share/${this.sharedToken}/files`)).files;
        this.inputFiles = [];
      } catch (e) {
        this.showError(e);
      } finally {
        this.filesLoading = false;
      }
    },
    async loadChatFiles() {
      this.filesLoading = true;
      try {
        const [outputs, inputs] = await Promise.all([
          this.chatRead(`/api/chats/${this.activeChat.id}/files`),
          this.chatRead(`/api/chats/${this.activeChat.id}/inputs`),
        ]);
        this.files = outputs.files;
        this.inputFiles = inputs.files;
      } catch (e) {
        if (!this.isAbortError(e)) this.showError(e);
      } finally {
        this.filesLoading = false;
      }
    },
    async loadLibrary(page = this.libraryPage) {
      this.libraryLoading = true;
      this.libraryPage = Math.max(1, page);
      try {
        const params = new URLSearchParams({
          page: String(this.libraryPage),
          page_size: "20",
        });
        if (this.librarySearch.trim()) params.set("search", this.librarySearch.trim());
        if (this.libraryAgentFilter) params.set("agent_id", this.libraryAgentFilter);
        const data = await this.api(`/api/library/files?${params}`);
        this.libraryFiles = data.files;
        this.libraryPages = data.pages;
        this.libraryTotal = data.total;
      } catch (e) {
        this.showError(e);
      } finally {
        this.libraryLoading = false;
      }
    },
    selectLibraryAgent(agentId) {
      this.libraryAgentFilter = agentId;
      this.libraryAgentPickerOpen = false;
      this.loadLibrary(1);
    },
    selectAutopilotAgent(agentId) {
      this.autopilotAgentFilter = agentId;
      this.autopilotAgentPickerOpen = false;
      this.loadAutopilots();
    },
    selectAutopilotEditAgent(agentId) {
      this.autopilotAgentId = agentId;
      this.autopilotEditAgentPickerOpen = false;
    },
    statusLabel(status) {
      const key = {
        active: "status.active",
        disabled: "status.disabled",
        enabled: "status.enabled",
        running: "status.running",
        paused: "status.paused",
        success: "status.success",
        error: "status.error",
        cancelled: "status.cancelled",
      }[
        String(status || "")
          .trim()
          .toLowerCase()
      ];
      return key ? this.t(key) : status;
    },
    openFile(file) {
      if (!this.activeChat) return;
      const input = file.kind === "input";
      if (this.opensInNativeBrowser(file)) {
        const url = this.sharedMode
          ? `/api/share/${encodeURIComponent(this.sharedToken)}/files/view?path=${encodeURIComponent(file.path)}`
          : input
            ? this.inputBrowserViewUrl(this.activeChat.id, file.path)
            : this.browserViewUrl(this.activeChat.id, file.path);
        this.openInternalTab(url);
        return;
      }
      const query = this.sharedMode
        ? new URLSearchParams({ share: this.sharedToken, path: file.path, from: "chat" })
        : new URLSearchParams({
            chat_id: this.activeChat.id,
            path: file.path,
            from: "chat",
            ...(input ? { kind: "input" } : {}),
          });
      this.openInternalTab(`/file-view?${query.toString()}`);
    },
    displayedFiles() {
      return this.filesTab === "inputs" ? this.inputFiles : this.files;
    },
    pendingAttachments() {
      return [
        ...this.pendingUploads,
        ...this.uploadSelection.map((file) => ({
          _localFile: file,
          id: `local:${file.name}:${file.lastModified}:${file.size}`,
          filename: file.name,
          media_type: file.type || "application/octet-stream",
          size: file.size,
        })),
        ...this.pendingArtifacts,
      ];
    },
    attachmentCommandMatch() {
      if (!this.activeChat || this.sharedMode) return null;
      const match = this.draft.match(/(?:^|\s)@([^\s]*)$/);
      return match ? { query: match[1].toLowerCase() } : null;
    },
    attachmentCommandItems() {
      const match = this.attachmentCommandMatch();
      if (!match) return [];
      const selectedOutputs = new Set(this.pendingArtifacts.map((file) => file.path));
      const selectedInputs = new Set(this.pendingUploads.map((file) => file.id));
      const candidates = [
        ...this.files.map((file) => ({ ...file, kind: "output" })),
        ...this.inputFiles.map((file) => ({ ...file, kind: "input" })),
      ];
      return candidates
        .filter((file) => (file.kind === "input" ? !selectedInputs.has(file.id) : !selectedOutputs.has(file.path)))
        .filter((file) => file.name.toLowerCase().includes(match.query))
        .slice(0, 8);
    },
    attachmentCommandVisible() {
      return (
        Boolean(this.attachmentCommandMatch()) &&
        !this.attachmentCommandDismissed &&
        this.attachmentCommandItems().length > 0
      );
    },
    updateAttachmentCommandState() {
      this.attachmentCommandIndex = 0;
      this.attachmentCommandDismissed = false;
      if (this.attachmentCommandMatch() && !this.filesLoading && !this.files.length && !this.inputFiles.length)
        void this.loadChatFiles();
    },
    handleAttachmentKeydown(event) {
      if (!this.attachmentCommandVisible()) return;
      const items = this.attachmentCommandItems();
      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.attachmentCommandIndex = (this.attachmentCommandIndex + 1) % items.length;
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        this.attachmentCommandIndex = (this.attachmentCommandIndex - 1 + items.length) % items.length;
      } else if (event.key === "Tab") {
        event.preventDefault();
        this.chooseFileAttachment(items[this.attachmentCommandIndex]);
      } else if (event.key === "Escape") {
        event.preventDefault();
        this.attachmentCommandDismissed = true;
      }
    },
    chooseFileAttachment(file) {
      if (file.kind === "input") {
        this.pendingUploads.push({
          ...file,
          filename: file.name,
        });
      } else {
        this.pendingArtifacts.push(file);
      }
      this.draft = this.draft.replace(/(?:^|\s)@[^\s]*$/, (value) => (value.startsWith(" ") ? " " : ""));
      this.attachmentCommandIndex = 0;
      this.attachmentCommandDismissed = false;
      this.$nextTick(() => document.getElementById("conversation-message")?.focus());
    },
    openUploadPicker() {
      if (!this.uploadingFiles) this.$refs.uploadInput?.click();
    },
    async handleUploadSelection(event) {
      const selected = [...(event.target.files || [])];
      event.target.value = "";
      this.addUploadSelection(selected);
    },
    handlePaste(event) {
      if (this.uploadingFiles) return;
      const items = [...(event.clipboardData?.items || [])];
      const images = items
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter(Boolean);
      if (!images.length) return;
      event.preventDefault();
      this.addUploadSelection(images);
    },
    async handleUploadDrop(event) {
      this.resetUploadDragState();
      if (this.uploadingFiles) return;
      this.addUploadSelection([...(event.dataTransfer?.files || [])]);
    },
    handleContentDragEnter(event) {
      if (this.uploadingFiles || !event.dataTransfer?.types?.includes("Files")) return;
      this.uploadDragDepth += 1;
      this.uploadDragActive = true;
    },
    handleContentDragOver(event) {
      if (!this.uploadingFiles && event.dataTransfer?.types?.includes("Files")) this.uploadDragActive = true;
    },
    handleContentDragLeave(event) {
      if (!event.currentTarget.contains(event.relatedTarget)) this.resetUploadDragState();
    },
    resetUploadDragState() {
      this.uploadDragDepth = 0;
      this.uploadDragActive = false;
    },
    addUploadSelection(selected) {
      if (!selected.length || this.uploadingFiles) return;
      const maxFiles = Number(this.uploadLimits.max_files) || 100;
      const maxBytes = Number(this.uploadLimits.max_bytes) || 100 * 1024 * 1024;
      const currentFiles = this.pendingUploads.length + this.pendingArtifacts.length + this.uploadSelection.length;
      const availableFiles = maxFiles - currentFiles;
      if (selected.length > availableFiles) {
        this.showError(new Error(`You can attach at most ${maxFiles} files to one message`));
      }
      let availableBytes =
        maxBytes - this.pendingAttachments().reduce((total, file) => total + (Number(file.size) || 0), 0);
      const files = [];
      for (const file of selected.slice(0, Math.max(0, availableFiles))) {
        if (file.size > availableBytes) {
          this.showError(new Error(`Selected files exceed the ${Math.ceil(maxBytes / 1024 / 1024)} MiB upload limit`));
          break;
        }
        files.push(file);
        availableBytes -= file.size;
      }
      this.uploadSelection.push(...files);
    },
    uploadSelectionTotalBytes() {
      return this.uploadSelection.reduce((total, file) => total + (Number(file.size) || 0), 0);
    },
    removeUploadSelection(file, force = false) {
      if (force || !this.uploadingFiles) {
        this.uploadSelection = this.uploadSelection.filter((item) => item !== file);
      }
    },
    formatFileSize(bytes) {
      const size = Number(bytes) || 0;
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    },
    async uploadFiles(chat) {
      if (!this.uploadSelection.length) return [];
      if (this.uploadingFiles) return [];
      this.uploadingFiles = true;
      const uploaded = [];
      try {
        for (const file of [...this.uploadSelection]) {
          const requestPath = `/api/chats/${chat.id}/uploads`;
          const { response, requestId } = await this.request(requestPath, {
            method: "POST",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
              "X-Upload-Filename": encodeURIComponent(file.name),
            },
            body: file,
          });
          const { data } = await this.responseData(response, requestId, requestPath);
          this.pendingUploads.push(data);
          uploaded.push(data);
          this.removeUploadSelection(file, true);
        }
        return uploaded;
      } catch (error) {
        this.showError(error);
        throw error;
      } finally {
        this.uploadingFiles = false;
      }
    },
    removePendingAttachment(file) {
      if (file._localFile) return this.removeUploadSelection(file._localFile);
      if (file.filename) return void this.removePendingUpload(file);
      this.removePendingArtifact(file);
    },
    async removePendingUpload(upload) {
      const chat = this.activeChat;
      if (!chat) return;
      try {
        await this.api(`/api/chats/${chat.id}/uploads/${upload.id}`, { method: "DELETE" });
        this.pendingUploads = this.pendingUploads.filter((item) => item.id !== upload.id);
      } catch (error) {
        this.showError(error);
      }
    },
    removePendingArtifact(artifact) {
      this.pendingArtifacts = this.pendingArtifacts.filter((item) => item.path !== artifact.path);
    },
    openLibraryFile(file) {
      if (this.opensInNativeBrowser(file)) {
        this.openInternalTab(this.browserViewUrl(file.chat_id, file.path));
        return;
      }
      const query = new URLSearchParams({
        chat_id: file.chat_id,
        path: file.path,
        from: "library",
      });
      this.openInternalTab(`/file-view?${query.toString()}`);
    },
    openLibraryChat(file) {
      this.openInternalTab(`/chat/${encodeURIComponent(file.chat_id)}`);
    },
    openInternalTab(url) {
      if (typeof url !== "string" || !url.startsWith("/")) return;
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    },
    opensInNativeBrowser(file) {
      return ["avif", "bmp", "gif", "htm", "html", "ico", "jpeg", "jpg", "pdf", "png", "svg", "webp"].includes(
        String(file?.extension || "").toLowerCase(),
      );
    },
    browserViewUrl(chatId, path) {
      return `/api/chats/${encodeURIComponent(chatId)}/files/view?path=${encodeURIComponent(path)}`;
    },
    inputBrowserViewUrl(chatId, path) {
      return `/api/chats/${encodeURIComponent(chatId)}/inputs/view?path=${encodeURIComponent(path)}`;
    },
    leaveFileViewer() {
      const params = new URLSearchParams(location.search);
      if (document.referrer.startsWith(location.origin) && history.length > 1) {
        history.back();
      } else if (params.get("from") === "chat" && params.get("chat_id")) {
        location.assign(`/chat/${encodeURIComponent(params.get("chat_id"))}`);
      } else {
        location.assign("/library");
      }
    },
    downloadUrl(file) {
      const resource = file.kind === "input" ? "inputs" : "files";
      return `/api/chats/${encodeURIComponent(file.chat_id)}/${resource}/download?path=${encodeURIComponent(file.path)}`;
    },
    // The preview page reuses the drawer/library download endpoint; shared
    // (token-gated) previews stay read-only because that endpoint needs a session.
    fileViewerDownloadUrl() {
      const viewer = this.fileViewer;
      if (!viewer || viewer.isShared) return "";
      return this.downloadUrl({
        chat_id: viewer.chatId,
        kind: viewer.kind,
        path: viewer.path,
      });
    },
    fileViewerDownloadName() {
      return (
        String(this.fileViewer?.path || "")
          .split("/")
          .pop() || "file"
      );
    },
    async loadFileViewer() {
      const params = new URLSearchParams(location.search);
      const share = params.get("share");
      const chatId = params.get("chat_id");
      const path = params.get("path");
      this.fileViewer = null;
      this.fileViewerExpired = false;
      if ((!chatId && !share) || !path) {
        if (share) {
          this.fileViewerExpired = true;
          document.title = this.t("share.linkExpiredTitle");
          return;
        }
        this.showError(new Error("File reference is incomplete"));
        return;
      }
      try {
        const data = share
          ? await this.api(`/api/share/${encodeURIComponent(share)}/files/content?path=${encodeURIComponent(path)}`)
          : await this.api(
              `/api/chats/${encodeURIComponent(chatId)}/${params.get("kind") === "input" ? "inputs" : "files"}/content?path=${encodeURIComponent(path)}`,
            );
        this.fileViewer = {
          chatId: chatId || `share:${share}`,
          kind: params.get("kind") === "input" ? "input" : "file",
          isShared: Boolean(share),
          canManageShare: Boolean(
            chatId &&
            !share &&
            params.get("kind") !== "input" &&
            ["md", "markdown"].includes(path.split(".").pop()?.toLowerCase() || ""),
          ),
          artifactShare: null,
          path,
          content: data.content,
        };
        if (this.fileViewer.canManageShare) await this.loadArtifactShare(chatId, path);
        document.title = path.split("/").pop() || "File";
        setTimeout(() => this.renderMermaidDiagrams(), 0);
      } catch (error) {
        if (share && error.status === 404) {
          this.fileViewer = null;
          this.fileViewerExpired = true;
          document.title = this.t("share.linkExpiredTitle");
        } else {
          this.showError(error);
        }
      }
    },
    async loadArtifactShare(chatId, path) {
      try {
        this.fileViewer.artifactShare = await this.api(
          `/api/chats/${encodeURIComponent(chatId)}/artifact-shares?path=${encodeURIComponent(path)}`,
        );
        this.fileViewer.artifactShare.kind = "artifact";
      } catch (error) {
        if (error.status !== 404) this.showError(error);
      }
    },
    async shareViewedFile() {
      const params = new URLSearchParams(location.search);
      const chatId = params.get("chat_id");
      const path = this.fileViewer?.path;
      if (!chatId || !path || this.sharingViewedFile) return;
      this.sharingViewedFile = true;
      try {
        const data = await this.api(
          `/api/chats/${encodeURIComponent(chatId)}/artifact-shares?path=${encodeURIComponent(path)}`,
          {
            method: "POST",
          },
        );
        this.fileViewer.artifactShare = {
          ...data,
          kind: "artifact",
          title: this.activeChat?.title || "",
        };
        this.shareTarget = "artifact";
        this.shareUrl = `${location.origin}${data.url}`;
        this.shareStep = "created";
        this.copiedShare = false;
      } catch (error) {
        this.showError(error);
      } finally {
        this.sharingViewedFile = false;
      }
    },
    renderMermaidDiagrams() {
      if (!window.mermaid) return;
      try {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: this.theme === "dark" ? "dark" : "default",
        });
        window.mermaid.run({
          nodes: [...document.querySelectorAll(".file-markdown .mermaid")],
        });
      } catch {}
    },
    formatBytes(bytes) {
      if (!Number.isFinite(bytes)) return "";
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    },
    formatDateTime(value) {
      return value
        ? new Date(value).toLocaleString(undefined, {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—";
    },
    resizeStartInput(event) {
      const input = event.target;
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 320)}px`;
    },
    resizeConversationInput(event) {
      const input = event.target;
      const styles = window.getComputedStyle(input);
      const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
      const verticalPadding = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
      const maxHeight = lineHeight * 7 + verticalPadding;
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`;
      input.style.overflowY = input.scrollHeight > maxHeight ? "auto" : "hidden";
    },
    resetConversationInput() {
      this.$nextTick(() => {
        const input = this.$refs.conversationInput;
        if (!input) return;
        input.style.height = "";
        input.style.overflowY = "hidden";
      });
    },
    resizeAgentTextarea(target) {
      const textarea = target?.target || target;
      if (!textarea) return;
      const styles = window.getComputedStyle(textarea);
      const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
      const verticalPadding =
        (Number.parseFloat(styles.paddingTop) || 0) + (Number.parseFloat(styles.paddingBottom) || 0);
      const maxHeight = lineHeight * 5 + verticalPadding;
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
    },
    resizeAgentTextareas() {
      ["new-agent-description", "new-agent-quickstarts", "new-agent-instruction"].forEach((id) => {
        const textarea = document.getElementById(id);
        if (textarea) this.resizeAgentTextarea(textarea);
      });
    },
    scrollMessagesToLatest() {
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const chatContent = this.$refs.chatContent;
            if (chatContent) chatContent.scrollTop = chatContent.scrollHeight;
          });
        });
      });
    },
    modeQuery() {
      const value = new URLSearchParams(location.search).get("mode");
      return ["development", "production"].includes(value) ? `?mode=${value}` : "";
    },
    syncModeFromUrl() {
      const value = new URLSearchParams(location.search).get("mode");
      this.mode = ["development", "production"].includes(value) ? value : this.resources.mode || "production";
    },
    go(page) {
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
    openCronBuilder() {
      this.syncCronBuilder();
      this.cronBuilderOpen = true;
    },
    syncCronBuilder() {
      const parts = this.autopilotCron.trim().split(/\s+/);
      if (parts.length !== 5) return;
      const [minute, hour, dom, month, dow] = parts;
      this.cronMinute = minute === "*" ? "0" : minute;
      this.cronHour = hour === "*" ? "9" : hour;
      this.cronDay = dow === "*" ? ["1"] : dow.split(",");
      this.cronDayOfMonth = dom === "*" ? "1" : dom;
      this.cronMonth = month === "*" ? "1" : month;
      if (minute !== "*" && hour === "*") this.cronFrequency = "hourly";
      else if (dow !== "*") this.cronFrequency = "weekly";
      else if (dom !== "*" && month === "*") this.cronFrequency = "monthly";
      else if (dom !== "*" && month !== "*") this.cronFrequency = "yearly";
      else this.cronFrequency = "daily";
    },
    setCronFrequency(value) {
      this.cronFrequency = value;
      this.autopilotCron = this.buildCron();
    },
    toggleCronDay(day) {
      this.cronDay = this.cronDay.includes(day)
        ? this.cronDay.length > 1
          ? this.cronDay.filter((item) => item !== day)
          : this.cronDay
        : [...this.cronDay, day];
      this.autopilotCron = this.buildCron();
    },
    cronHours() {
      return Array.from({ length: 24 }, (_, index) => String(index));
    },
    cronDaysOfMonth() {
      return Array.from({ length: 31 }, (_, index) => String(index + 1));
    },
    cronMonths() {
      return Array.from({ length: 12 }, (_, index) => String(index + 1));
    },
    buildCron() {
      const m = this.cronMinute,
        h = this.cronHour;
      if (this.cronFrequency === "hourly") return `${m} * * * *`;
      if (this.cronFrequency === "weekly")
        return `${m} ${h} * * ${this.cronDay
          .slice()
          .sort((a, b) => Number(a) - Number(b))
          .join(",")}`;
      if (this.cronFrequency === "monthly") return `${m} ${h} ${this.cronDayOfMonth} * *`;
      if (this.cronFrequency === "yearly") return `${m} ${h} ${this.cronDayOfMonth} ${this.cronMonth} *`;
      return `${m} ${h} * * *`;
    },
    applyCronBuilder() {
      this.autopilotCron = this.buildCron();
      this.cronBuilderOpen = false;
    },
    async loadAutopilots() {
      this.autopilotLoading = true;
      try {
        const params = new URLSearchParams();
        if (this.autopilotSearch.trim()) params.set("search", this.autopilotSearch.trim());
        if (this.autopilotAgentFilter) params.set("agent_id", this.autopilotAgentFilter);
        this.autopilots = (await this.api(`/api/autopilots?${params}`)).autopilots;
      } catch (e) {
        this.showError(e);
      } finally {
        this.autopilotLoading = false;
      }
    },
    newAutopilot() {
      this.autopilotEditing = null;
      this.autopilotName = "";
      this.autopilotInstruction = "";
      this.autopilotAgentId = this.agents[0]?.id || "";
      this.autopilotCron = "0 * * * *";
      this.autopilotStartsAt = "";
      this.autopilotEndsAt = "";
      this.autopilotDialog = true;
    },
    editAutopilot(item) {
      this.autopilotEditing = item;
      this.autopilotName = item.name;
      this.autopilotInstruction = item.instruction;
      this.autopilotAgentId = item.agent_id;
      this.autopilotCron = item.cron;
      this.autopilotStartsAt = item.starts_at || "";
      this.autopilotEndsAt = item.ends_at || "";
      this.autopilotDialog = true;
    },
    async saveAutopilot() {
      if (!this.autopilotName.trim() || !this.autopilotInstruction.trim() || !this.autopilotAgentId) return;
      this.autopilotSaving = true;
      try {
        const payload = {
          name: this.autopilotName,
          instruction: this.autopilotInstruction,
          agent_id: this.autopilotAgentId,
          cron: this.autopilotCron,
          starts_at: this.autopilotStartsAt || null,
          ends_at: this.autopilotEndsAt || null,
        };
        const item = this.autopilotEditing
          ? await this.api(`/api/autopilots/${this.autopilotEditing.id}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            })
          : await this.api("/api/autopilots", {
              method: "POST",
              body: JSON.stringify(payload),
            });
        const index = this.autopilots.findIndex((row) => row.id === item.id);
        if (index >= 0) this.autopilots[index] = item;
        else this.autopilots.unshift(item);
        this.autopilotDialog = false;
      } catch (e) {
        this.showError(e);
      } finally {
        this.autopilotSaving = false;
      }
    },
    async toggleAutopilot(item) {
      try {
        const updated = await this.api(`/api/autopilots/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify({ enabled: !item.enabled }),
        });
        Object.assign(item, updated);
      } catch (e) {
        this.showError(e);
      }
    },
    deleteAutopilot(item) {
      this.autopilotDeleteTarget = item;
    },
    async confirmDeleteAutopilot() {
      const item = this.autopilotDeleteTarget;
      if (!item) return;
      try {
        await this.api(`/api/autopilots/${item.id}`, { method: "DELETE" });
        this.autopilots = this.autopilots.filter((row) => row.id !== item.id);
        this.autopilotDeleteTarget = null;
      } catch (e) {
        this.showError(e);
      }
    },
    async runAutopilot(item) {
      try {
        await this.api(`/api/autopilots/${item.id}/run`, { method: "POST" });
        this.loadAutopilotRuns(item);
      } catch (e) {
        this.showError(e);
      }
    },
    async loadAutopilotRuns(item) {
      this.autopilotRunsOpen = true;
      this.autopilotRuns = [];
      this.autopilotRunsItem = item;
      try {
        this.autopilotRuns = (await this.api(`/api/autopilots/${item.id}/runs`)).runs;
      } catch (e) {
        this.showError(e);
      }
    },
    brandClick() {
      if (this.sidebarCollapsed) this.sidebarCollapsed = false;
      else this.newChat();
    },
    toggleMobileSidebar() {
      this.mobileSidebarOpen = !this.mobileSidebarOpen;
    },
    comingSoon(name) {
      this.showError(new Error(`${name} is reserved for the next iteration.`));
    },
    initializeThemePreference() {
      const preference = localStorage.getItem("oma-theme-preference");
      this.applyThemePreference(preference);
      this.systemThemeQuery = window.matchMedia?.("(prefers-color-scheme: dark)") || null;
      this.systemThemeQuery?.addEventListener("change", () => {
        if (this.themePreference === "system") this.applyThemePreference("system");
      });
    },
    applyThemePreference(value) {
      this.themePreference = ["system", "light", "dark"].includes(value) ? value : "system";
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      this.theme = this.themePreference === "system" ? (prefersDark ? "dark" : "light") : this.themePreference;
      document.documentElement.dataset.theme = this.theme;
      this.syncHighlightTheme();
      this.syncFavicon();
      localStorage.setItem("oma-theme-preference", this.themePreference);
    },
    syncFavicon() {
      const favicon = document.getElementById("app-favicon");
      if (favicon)
        favicon.href = `/static/${this.theme === "dark" ? "favicon-dark-32.png" : "favicon-32.png"}?v=20260917-theme`;
    },
    syncHighlightTheme() {
      const lightTheme = document.getElementById("highlightjs-light-theme");
      const darkTheme = document.getElementById("highlightjs-dark-theme");
      if (lightTheme) lightTheme.disabled = this.theme === "dark";
      if (darkTheme) darkTheme.disabled = this.theme !== "dark";
    },
    async openSettings() {
      this.settingsTab = "general";
      this.settingsOpen = true;
      if (this.authUser?.role === "admin") await this.loadSystemSettings();
    },
    async openUsage() {
      this.usageOpen = true;
      this.usageTab = "overview";
      await this.loadUsage();
    },
    async setUsageRange(range) {
      if (!["1", "7", "30"].includes(range) || range === this.usageRange) return;
      this.usageRange = range;
      await this.loadUsage();
    },
    async loadUsage() {
      if (this.usageLoading) return;
      this.usageLoading = true;
      this.usageError = "";
      try {
        const payload = await this.api(`/api/usage?days=${encodeURIComponent(this.usageRange)}`);
        this.usageData = this.normalizeUsageData(payload);
      } catch (error) {
        this.usageError = error.message || "Unable to load usage statistics.";
      } finally {
        this.usageLoading = false;
      }
    },
    usageNumber(value) {
      const number = Number(value);
      return Number.isFinite(number) ? number : 0;
    },
    usagePick(item, keys) {
      for (const key of keys) {
        if (item && item[key] !== undefined && item[key] !== null) return item[key];
      }
      return 0;
    },
    normalizeUsageSummary(value = {}) {
      const source = value || {};
      return {
        sessions: this.usageNumber(this.usagePick(source, ["sessions", "session_count", "sessionCount"])),
        input: this.usageNumber(this.usagePick(source, ["input", "input_tokens", "inputTokens"])),
        output: this.usageNumber(this.usagePick(source, ["output", "output_tokens", "outputTokens"])),
        cacheRead: this.usageNumber(
          this.usagePick(source, ["cacheRead", "cache_read", "cache_read_tokens", "cached_tokens", "cachedTokens"]),
        ),
        cost: this.usageNumber(this.usagePick(source, ["cost", "total_cost", "totalCost"])),
        search: this.usageNumber(this.usagePick(source, ["search", "web_search", "webSearch"])),
        fetch: this.usageNumber(this.usagePick(source, ["fetch", "web_fetch", "webFetch"])),
        tools: this.usageNumber(this.usagePick(source, ["tool_calls", "toolCalls", "tools"])),
      };
    },
    normalizeUsageRow(row = {}) {
      return {
        ...row,
        id:
          row.id ||
          row.session_id ||
          row.sessionId ||
          row.chat_id ||
          row.chatId ||
          row.user_id ||
          row.userId ||
          row.agent_id ||
          row.agentId ||
          row.name,
        title: row.title || row.session_name || row.sessionName || row.name || "Untitled session",
        username: row.username || row.user_name || row.userName || row.user || "—",
        agent:
          (typeof row.agent === "string" ? row.agent : row.agent?.name) ||
          row.agent_name ||
          row.agentName ||
          row.name ||
          "—",
        createdAt: row.createdAt || row.created_at || row.created || row.date,
        sessions: this.usageNumber(this.usagePick(row, ["sessions", "session_count", "sessionCount"])),
        input: this.usageNumber(this.usagePick(row, ["input", "input_tokens", "inputTokens"])),
        output: this.usageNumber(this.usagePick(row, ["output", "output_tokens", "outputTokens"])),
        cacheRead: this.usageNumber(
          this.usagePick(row, ["cacheRead", "cache_read", "cache_read_tokens", "cached_tokens", "cachedTokens"]),
        ),
        cost: this.usageNumber(this.usagePick(row, ["cost", "total_cost", "totalCost"])),
        search: this.usageNumber(this.usagePick(row, ["search", "web_search", "webSearch"])),
        fetch: this.usageNumber(this.usagePick(row, ["fetch", "web_fetch", "webFetch"])),
        tools: this.usageNumber(this.usagePick(row, ["tool_calls", "toolCalls", "tools"])),
      };
    },
    normalizeUsageData(payload = {}) {
      const source = payload || {};
      const daily = source.daily || source.series || source.daily_series || source.dailySeries || [];
      const sessions = source.sessions || source.details || source.session_details || source.sessionDetails || [];
      return {
        ...source,
        summary: this.normalizeUsageSummary(source.summary || source.totals || source.overview),
        daily: Array.isArray(daily) ? daily.map((row) => this.normalizeUsageRow(row)) : [],
        sessions: Array.isArray(sessions) ? sessions.map((row) => this.normalizeUsageRow(row)) : [],
        users: Array.isArray(source.users || source.by_user || source.byUser)
          ? (source.users || source.by_user || source.byUser).map((row) => this.normalizeUsageRow(row))
          : [],
        agents: Array.isArray(source.agents || source.by_agent || source.byAgent)
          ? (source.agents || source.by_agent || source.byAgent).map((row) => this.normalizeUsageRow(row))
          : [],
      };
    },
    usageMetricValue(row, metric = "cost") {
      if (metric === "tokens") return row.input + row.output + row.cacheRead;
      if (metric === "sessions") return row.sessions;
      return row.cost;
    },
    usageChartPoints(metric = "cost") {
      const rows = this.usageData.daily || [];
      if (!rows.length) return "24,188 736,188";
      const values = rows.map((row) => this.usageMetricValue(row, metric));
      const max = Math.max(...values, 1);
      const left = 24;
      const right = 736;
      const baseline = 188;
      const top = 18;
      const span = Math.max(1, values.length - 1);
      return values
        .map((value, index) => {
          const x = left + ((right - left) * index) / span;
          const y = baseline - ((baseline - top) * value) / max;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    },
    usageChartAreaPoints(metric = "cost") {
      const points = this.usageChartPoints(metric);
      return `24,188 ${points} 736,188`;
    },
    usageChartLabels() {
      return (this.usageData.daily || []).map((row) => ({
        id: row.id || row.createdAt || row.date,
        label: this.usageDateLabel(row.createdAt || row.date),
      }));
    },
    usageDateLabel(value) {
      if (!value) return "—";
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    },
    usageCost(value) {
      return `¥${this.usageNumber(value).toFixed(4)}`;
    },
    async openSettingsTab(tab) {
      this.settingsTab = tab;
    },
    async saveLanguage() {
      await this.setLanguage(this.language);
    },
    async loadSystemSettings() {
      try {
        this.systemTimezone = (await this.api("/api/settings")).timezone;
      } catch (error) {
        this.showError(error);
      }
    },
    async saveSystemTimezone() {
      try {
        this.systemTimezone = (
          await this.api("/api/settings/timezone", {
            method: "PATCH",
            body: JSON.stringify({ timezone: this.systemTimezone }),
          })
        ).timezone;
        this.showToast("System timezone updated");
      } catch (error) {
        this.showError(error);
      }
    },
    newChat() {
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
      if (this.agents.length) this.selectedAgentId = this.agents[0].id;
    },
    async openChat(chat, updateUrl = true) {
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
          this.chatRead(`/api/chats/${chat.id}/messages?mode=${this.mode}`),
          chat.status === "created" ? Promise.resolve(chat) : this.chatRead(`/api/chats/${chat.id}`),
        ]);
        if (viewToken !== this.chatViewToken || this.activeChat?.id !== chat.id) return;
        this.activeChat = currentChat;
        const sidebarChat = this.chats.find((item) => item.id === chat.id);
        if (sidebarChat) Object.assign(sidebarChat, currentChat);
        this.loading = currentChat.status === "running";
        this.messages = this.normalizeMessages(data.messages);
        if (currentChat.status === "created") {
          this.pendingUploads = (await this.chatRead(`/api/chats/${chat.id}/uploads`)).uploads || [];
        }
        this.scrollMessagesToLatest();
      } catch (e) {
        if (!this.isAbortError(e) && viewToken === this.chatViewToken && this.activeChat?.id === chat.id)
          this.showError(e);
      } finally {
        if (viewToken === this.chatViewToken && this.activeChat?.id === chat.id) this.messagesLoading = false;
      }
      if (this.activeChat?.status === "running") void this.watchChat(chat.id);
    },
    async sendFirst() {
      if (!this.draft.trim() || !this.selectedAgentId) return;
      try {
        const chat = await this.api("/api/chats", {
          method: "POST",
          body: JSON.stringify({ agent_id: this.selectedAgentId }),
        });
        this.selectedAgentId = chat.agent_id;
        this.activeChat = chat;
        this.chats.unshift(chat);
        history.pushState({}, "", `/chat/${chat.id}`);
        await this.sendMessage();
        if (this.activeChat?.title === "New conversation") {
          this.chats = this.chats.filter((item) => item.id !== this.activeChat.id);
          this.activeChat = null;
          this.messages = [];
          history.pushState({}, "", "/chat" + this.modeQuery());
        }
      } catch (e) {
        this.showError(e);
      }
    },
    skillCommandMatch() {
      const match = this.draft.match(/^\/(?:skill:)?([^\s]*)$/i);
      if (!match) return null;
      const typed = match[1] || "";
      return {
        query: typed.toLowerCase(),
        hasPrefix: /^\/skill:/i.test(this.draft),
      };
    },
    skillCommandItems() {
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
    skillCommandVisible() {
      return Boolean(this.skillCommandMatch()) && !this.skillCommandDismissed;
    },
    updateSkillCommandState() {
      if (this.skillCommandMatch()) this.skillCommandDismissed = false;
      this.skillCommandIndex = 0;
    },
    handleSkillCommandKeydown(event) {
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
        this.chooseSkillCommand(items[this.skillCommandIndex]);
      }
    },
    chooseSkillCommand(skill) {
      this.draft = `/skill:${skill.name} `;
      this.skillCommandDismissed = true;
      this.skillCommandIndex = 0;
      this.$nextTick(() => document.getElementById("new-chat-message")?.focus());
    },
    skillCommandHighlightHtml() {
      const command = this.draft.match(/^\/skill:([^\s]+)/i);
      if (!command) return this.escape(this.draft);
      const agent = this.agents.find((item) => item.id === this.selectedAgentId);
      const enabled = agent?.skills || [];
      const skill = this.resources.skills.find(
        (item) =>
          item.name.toLowerCase() === command[1].toLowerCase() &&
          enabled.some((path) => this.normalizeResourcePath(path) === this.normalizeResourcePath(item.path)),
      );
      if (!skill) return this.escape(this.draft);
      return `<span class="skill-command-highlight-token">${this.escape(command[0])}</span>${this.escape(this.draft.slice(command[0].length))}`;
    },
    syncSkillCommandScroll(event) {
      const mirror = this.$refs.skillCommandHighlight;
      if (!mirror) return;
      mirror.scrollTop = event.target.scrollTop;
      mirror.scrollLeft = event.target.scrollLeft;
    },
    async sendMessage() {
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
          _key: crypto.randomUUID(),
          role: "user",
          content: [{ type: "text", text: content }],
          _attachments: messageAttachments,
        });
        this.messages.push({
          _key: crypto.randomUUID(),
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
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop();
          for (const frame of frames) {
            const line = frame.split("\n").find((value) => value.startsWith("data: "));
            if (!line) continue;
            const event = JSON.parse(line.slice(6));
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
                    _key: crypto.randomUUID(),
                    role: "assistant",
                    content: [{ type: "text", text: event.assistant }],
                    _reasoningParts: [],
                    _streaming: false,
                  });
                this.messages.splice(i, 1, ...normalized);
                void this.refreshOpenFiles(chatId);
              }
            } else if (event.type === "error") {
              throw new Error(event.error);
            } else if (isCurrentView()) {
              this.handleTurnEvent(event);
            }
          }
        }
      } catch (e) {
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
    markStreamingAssistantMessageEnd() {
      const i = this.messages.length - 1;
      const current = this.messages[i];
      if (current?.role === "assistant") this.messages[i] = { ...current, _thinkingBoundary: true };
    },
    updateStreamingAssistant(value, append) {
      const i = this.messages.length - 1;
      const current = this.messages[i];
      const text = append ? this.partsText(current.content) + value : value;
      this.messages[i] = {
        ...current,
        content: [{ type: "text", text }],
        _thinkingBoundary: false,
      };
    },
    updateStreamingThinking(value) {
      const i = this.messages.length - 1;
      const current = this.messages[i];
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
    handleTurnEvent(event) {
      if (event.type === "delta") this.updateStreamingAssistant(event.delta, true);
      else if (event.type === "thinking_delta") this.updateStreamingThinking(event.delta);
      else if (event.type === "assistant_message_end") this.markStreamingAssistantMessageEnd();
      else if (event.type === "final") this.updateStreamingAssistant(event.text, false);
      else if (event.type === "tool") {
        const i = this.messages.length - 1;
        this.messages[i] = {
          ...this.messages[i],
          _tools: [...(this.messages[i]._tools || []), event],
        };
      }
    },
    async watchChat(chatId) {
      if (!chatId || this.watchingChat === chatId) return;
      const viewToken = this.chatViewToken;
      this.watchingChat = chatId;
      try {
        const chat = await this.chatRead(`/api/chats/${chatId}`);
        if (viewToken !== this.chatViewToken || this.activeChat?.id !== chatId) return;
        if (this.activeChat?.id === chatId) this.activeChat = chat;
        const data = await this.chatRead(`/api/chats/${chatId}/messages?mode=${this.mode}`);
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
            _key: crypto.randomUUID(),
            role: "assistant",
            content: [{ type: "text", text: "" }],
            _reasoningParts: [{ type: "thinking", thinking: "" }],
            _tools: [],
            _streaming: true,
          });
        const source = new EventSource(`/api/chats/${chatId}/stream`);
        this.streamSource = source;
        source.onmessage = (m) => {
          let event;
          try {
            event = JSON.parse(m.data);
          } catch {
            return;
          }
          if (event.type === "complete" || event.type === "error") {
            source.close();
            if (viewToken === this.chatViewToken && this.activeChat?.id === chatId) {
              this.streamSource = null;
              this.watchingChat = null;
              this.loading = false;
              if (event.type === "error") this.showError(new Error(event.error));
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
      } catch (e) {
        if (!this.isAbortError(e) && viewToken === this.chatViewToken && this.activeChat?.id === chatId) {
          this.watchingChat = null;
          this.showError(e);
        }
      }
    },
    async finishWatch(chatId, viewToken = this.chatViewToken) {
      if (viewToken !== this.chatViewToken || this.activeChat?.id !== chatId) return;
      try {
        const data = await this.chatRead(`/api/chats/${chatId}/messages?mode=${this.mode}`);
        if (viewToken !== this.chatViewToken || this.activeChat?.id !== chatId) return;
        this.setMessagesIfChanged(data.messages);
        const chat = await this.chatRead(`/api/chats/${chatId}`);
        if (viewToken !== this.chatViewToken || this.activeChat?.id !== chatId) return;
        this.activeChat = chat;
        const found = this.chats.find((c) => c.id === chatId);
        if (found) Object.assign(found, chat);
        this.loading = false;
        await this.refreshOpenFiles(chatId);
      } catch (e) {
        if (!this.isAbortError(e) && viewToken === this.chatViewToken && this.activeChat?.id === chatId)
          this.showError(e);
      }
    },
    startPolling(chatId, viewToken = this.chatViewToken) {
      this.stopPolling();
      this.pollTimer = setInterval(async () => {
        if (viewToken !== this.chatViewToken || this.activeChat?.id !== chatId) {
          this.stopPolling();
          return;
        }
        try {
          const chat = await this.chatRead(`/api/chats/${chatId}`);
          if (viewToken !== this.chatViewToken || this.activeChat?.id !== chatId) {
            this.stopPolling();
            return;
          }
          if (chat.status !== "running") {
            const data = await this.chatRead(`/api/chats/${chatId}/messages?mode=${this.mode}`);
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
          const data = await this.chatRead(`/api/chats/${chatId}/messages?mode=${this.mode}`);
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
    stopPolling() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    },
    stopWatching() {
      if (this.streamSource) {
        this.streamSource.close();
        this.streamSource = null;
      }
      this.watchingChat = null;
      this.stopPolling();
    },
    setReasoningOpen(input) {
      const key = input.dataset.reasoningKey;
      if (key) this.reasoningOpen[key] = input.checked;
    },
    stableMessageKey(message, index) {
      return message.id || `${message.role || "message"}:${message.timestamp || ""}:${index}`;
    },
    messagesFingerprint(messages) {
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
    setMessagesIfChanged(rawMessages) {
      const normalized = this.normalizeMessages(rawMessages);
      if (this.messagesFingerprint(normalized) !== this.messagesFingerprint(this.messages)) this.messages = normalized;
      return normalized;
    },
    isActionableAssistant(message) {
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
      return candidates.length > 0 && candidates[candidates.length - 1]._key === message._key;
    },
    copyMessage(message) {
      const text = this.partsText(message.content);
      navigator.clipboard?.writeText(text);
      this.copiedKey = message._key;
      setTimeout(() => {
        if (this.copiedKey === message._key) this.copiedKey = "";
      }, 1500);
    },
    // Injected code-block markup cannot use Alpine directives, so the button
    // calls back through the window bridge and toggles its own copied state.
    copyCodeBlock(button) {
      const block = button?.closest?.(".code-block");
      const text = block?.querySelector("code")?.textContent || "";
      if (!text) return;
      navigator.clipboard?.writeText(text);
      if (button._copyTimer) clearTimeout(button._copyTimer);
      button.classList.add("copied");
      button._copyTimer = setTimeout(() => button.classList.remove("copied"), 1500);
    },
    async startShare() {
      if (!this.activeChat || this.sharedMode) return;
      try {
        this.shareTarget = "session";
        const data = await this.api(`/api/chats/${this.activeChat.id}/share`);
        this.shareUrl = `${location.origin}${data.url}`;
        this.shareStep = "created";
      } catch (error) {
        if (error.status === 404) this.shareMode = true;
        else this.showError(error);
      }
    },
    async openSharedChat(token) {
      this.sharedToken = token;
      this.sharedMode = true;
      this.sharedCanManage = false;
      this.page = "chat";
      this.messagesLoading = true;
      try {
        const data = await this.api(`/api/share/${encodeURIComponent(token)}`);
        // Only the account that owns the link may revoke it from this page.
        this.sharedCanManage = Boolean(data.can_manage);
        this.activeChat = {
          ...(data.chat || {}),
          id: `share:${token}`,
          status: "ready",
        };
        this.messages = this.normalizeMessages(data.messages || []);
        this.scrollMessagesToLatest();
        document.title = `${this.activeChat.title || "Shared conversation"} · OMA studio`;
      } catch (e) {
        this.activeChat = null;
        this.messages = [];
        if (e.status === 404) {
          // Revoked or unknown link: there is no public content to show, so an
          // anonymous visitor belongs on the sign-in screen instead of an empty
          // workspace, and a signed-in visitor goes back to their own chats.
          if (this.authUser) {
            this.showToast(this.t("share.linkExpiredTitle"));
            location.assign("/");
          } else {
            this.sharedMode = false;
            history.replaceState({}, "", "/");
          }
        } else {
          this.showError(e);
        }
      } finally {
        this.messagesLoading = false;
      }
    },
    cancelShare() {
      this.shareMode = false;
    },
    closeShareDialog() {
      this.shareStep = null;
      this.copiedShare = false;
    },
    resetShare() {
      this.shareMode = false;
      this.shareStep = null;
      this.shareUrl = "";
      this.copiedShare = false;
      this.shareTarget = "session";
      this.sharedCanManage = false;
    },
    async createShare() {
      if (!this.activeChat || this.creatingShare) return;
      this.creatingShare = true;
      try {
        this.shareTarget = "session";
        const data = await this.api(`/api/chats/${this.activeChat.id}/share`, {
          method: "POST",
        });
        this.shareUrl = `${location.origin}/share/${data.token}`;
        this.shareStep = "created";
        try {
          await navigator.clipboard?.writeText(this.shareUrl);
        } catch {}
      } catch (e) {
        this.showError(e);
      } finally {
        this.creatingShare = false;
      }
    },
    copyShareLink() {
      if (!this.shareUrl) return;
      navigator.clipboard?.writeText(this.shareUrl);
      this.copiedShare = true;
      setTimeout(() => {
        this.copiedShare = false;
      }, 1500);
    },
    async abort() {
      if (!this.activeChat) return;
      try {
        await this.api(`/api/chats/${this.activeChat.id}/abort`, {
          method: "POST",
        });
        this.loading = false;
      } catch (e) {
        this.showError(e);
      }
    },
    normalizeMessages(messages) {
      const archived = [];
      const sessionUsage = {
        input: 0,
        output: 0,
        cacheRead: 0,
        cost: 0,
        search: 0,
        fetch: 0,
      };
      let assistantGroup = null;
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
            ["stop", "length", "aborted", "error"].includes(message.stopReason) &&
            (message.content || []).some((part) => part.type === "text");
          for (const part of message.content || []) {
            if (part.type === "thinking" || !isFinal || part.type !== "text") assistantGroup._reasoningParts.push(part);
            else assistantGroup.content.push(part);
          }
          assistantGroup._streaming = assistantGroup._streaming || message._streaming;
          continue;
        }
        flushAssistant();
        archived.push({ ...message, _key: this.stableMessageKey(message, index) });
      }
      flushAssistant();
      this.sessionUsage = sessionUsage;
      return archived;
    },
    renderMessage(message) {
      const role = message.role || "message";
      const parts = message.content || [];
      if (role === "user") return this.renderUserMessage(message, parts);
      if (role === "toolResult") return this.mode === "development" ? this.renderToolResult(message) : "";
      if (role === "assistant") {
        const text = this.partsText(parts);
        const reasoning = this.renderReasoning(message._reasoningParts || [], message._key, message._streaming);
        const artifacts = (message._imageArtifacts || [])
          .map((artifact) => this.renderImageArtifact(artifact))
          .join("");
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
    renderUserMessage(message, parts) {
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
    imageArtifactMessage(message, index) {
      if (!["generate_image", "edit_image"].includes(message.toolName)) return null;
      const path = message.details?.path;
      if (typeof path !== "string" || !this.opensInNativeBrowser({ extension: this.fileExtension(path) })) return null;
      return { path };
    },
    imageArtifactUrl(path) {
      return this.sharedMode
        ? `/api/share/${encodeURIComponent(this.sharedToken)}/files/view?path=${encodeURIComponent(path)}`
        : this.browserViewUrl(this.activeChat?.id || "", path);
    },
    renderImageArtifact(message) {
      const url = this.imageArtifactUrl(message.path);
      return `<a class="chat-image-artifact skeleton" href="${this.escape(url)}" target="_blank" rel="noopener"><img src="${this.escape(url)}" alt="Generated image" loading="lazy" decoding="async" /></a>`;
    },
    renderReasoningPart(part) {
      if (part.type === "thinking")
        return `<div class="reasoning-text markdown-part">${this.renderMarkdown(part.thinking || "")}</div>`;
      if (part.type === "text")
        return `<div class="reasoning-text markdown-part">${this.renderMarkdown(part.text || "")}</div>`;
      return this.renderPart(part);
    },
    messageVisible(message) {
      if (message.role === "toolResult") return this.mode === "development";
      if (this.mode !== "production" || message.role !== "assistant") return true;
      if (message._streaming) return true;
      return [...(message._reasoningParts || []), ...(message.content || [])].some(
        (part) => part.type === "text" || part.type === "thinking" || this.productionToolAllowlist.includes(part.name),
      );
    },
    partsText(parts) {
      return parts
        .filter((part) => part.type === "text")
        .map((part) => part.text || "")
        .join("");
    },
    renderPart(part) {
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
    renderFinalMarkdown(part) {
      const invert = this.theme === "dark" ? " prose-invert" : "";
      return `<div class="markdown-part prose${invert} max-w-none">${this.renderMarkdown(part.text || "")}</div>`;
    },
    processLine(label, value) {
      const fullValue = String(value).replace(/\s+/g, " ").trim();
      return `<div class="process-line"><span class="process-label">${this.escape(label)}</span><span class="process-preview" title="${this.escape(fullValue)}">${this.escape(fullValue)}</span></div>`;
    },
    processFileName(path) {
      const normalized = String(path || "")
        .trim()
        .replaceAll("\\", "/");
      return normalized.split("/").filter(Boolean).pop() || normalized;
    },
    processDisclosure(label, value, detail, kind = "", showPreview = false) {
      return `<details class="process-disclosure ${kind ? `${kind}-disclosure` : ""}"><summary><i class="process-chevron" data-lucide="chevron-right" aria-hidden="true"></i><span class="process-label">${this.escape(label)}</span>${showPreview ? `<span class="process-preview">${this.escape(String(value).replace(/\s+/g, " ").trim())}</span>` : ""}</summary><pre class="process-detail-code ${kind ? `${kind}-code` : ""}">${detail}</pre></details>`;
    },
    highlightCode(source, language) {
      try {
        const normalized = this.normalizeCodeLanguage(language);
        if (window.hljs?.getLanguage(normalized))
          return DOMPurify.sanitize(window.hljs.highlight(source, { language: normalized }).value);
      } catch {}
      return this.escape(source);
    },
    normalizeCodeLanguage(language) {
      const aliases = {
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
    renderMarkdown(source) {
      try {
        const doc = new DOMParser().parseFromString(DOMPurify.sanitize(marked.parse(source)), "text/html");
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
        root
          .querySelectorAll("blockquote")
          .forEach((el) => (el.className = "border-l-4 border-primary pl-4 opacity-80"));
        root.querySelectorAll("pre").forEach((el) => {
          const code = el.querySelector("code");
          const languageClass = [...(code?.classList || [])].find((name) => name.startsWith("language-"));
          const language = languageClass?.slice("language-".length) || "";
          if (this.normalizeCodeLanguage(language) === "mermaid") {
            const diagram = doc.createElement("div");
            diagram.className = "mermaid";
            diagram.textContent = code.textContent || "";
            el.replaceWith(diagram);
          } else {
            el.className = "bg-base-200 text-base-content rounded-box p-4 w-full overflow-x-auto my-3";
            if (code) {
              const source = code.textContent || "";
              let highlighted = this.highlightCode(source, language);
              if (!language && window.hljs?.highlightAuto) {
                const detected = window.hljs.highlightAuto(source, [
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
    parseCsv(source) {
      const text = String(source || "").replace(/^\uFEFF/, "");
      const rows = [];
      let row = [];
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
    fileExtension(path) {
      return (
        String(path || "")
          .split("?")[0]
          .split(".")
          .pop()
          ?.toLowerCase() || ""
      );
    },
    isCsvFile(path) {
      return this.fileExtension(path) === "csv";
    },
    isCodeFile(path) {
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
    renderCsv(source) {
      const rows = this.parseCsv(source);
      if (!rows.length) return '<p class="opacity-60">Empty CSV file</p>';
      const columnCount = Math.max(...rows.map((row) => row.length));
      const cells = (row, tag) =>
        Array.from({ length: columnCount }, (_, index) => `<${tag}>${this.escape(row[index] ?? "")}</${tag}>`).join("");
      const header = `<thead><tr>${cells(rows[0], "th")}</tr></thead>`;
      const body = rows
        .slice(1)
        .map((row) => `<tr>${cells(row, "td")}</tr>`)
        .join("");
      return `<div class="overflow-x-auto w-full"><table class="table table-zebra csv-table">${header}<tbody>${body}</tbody></table></div>`;
    },
    renderCodeFile(source, extension) {
      const language = this.normalizeCodeLanguage(extension);
      const highlighted = this.highlightCode(String(source || ""), language);
      const label = this.escape(this.t("files.copyCode"));
      return `<div class="code-block"><button type="button" class="code-copy-btn" onclick="window.omaPlatform.copyCodeBlock(this)" aria-label="${label}" title="${label}"><span class="code-copy-glyph code-copy-glyph-copy"><i data-lucide="copy" aria-hidden="true"></i></span><span class="code-copy-glyph code-copy-glyph-done"><i data-lucide="check" aria-hidden="true"></i></span></button><div class="mockup-code overflow-x-auto w-full"><pre><code class="hljs language-${this.escape(language)}">${highlighted}</code></pre></div></div>`;
    },
    renderFilePreview() {
      const path = this.fileViewer?.path || "";
      const content = this.fileViewer?.content || "";
      if (this.isCsvFile(path)) return this.renderCsv(content);
      if (this.isCodeFile(path)) return this.renderCodeFile(content, this.fileExtension(path));
      return this.renderMarkdown(content);
    },
    toolArgs(part) {
      if (part.arguments && typeof part.arguments === "object") return part.arguments;
      try {
        return JSON.parse(part.arguments || "{}");
      } catch {
        return { arguments: part.arguments || "" };
      }
    },
    renderToolResult(message) {
      const content = this.partsText(message.content || []);
      const label = message.toolName || "Tool result";
      return `<details class="tool-result"><summary><i class="process-chevron" data-lucide="chevron-right" aria-hidden="true"></i><span class="tool-kicker">Tool result</span><b>${this.escape(label)}</b><span class="tool-id">${this.escape(message.toolCallId || "")}</span></summary><pre>${this.escape(content)}</pre></details>`;
    },
    escape(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    },
    agentAvatarMarkup(agent, size = "", market = false) {
      const name = String(agent?.name || "Agent");
      const url = market ? (agent?.avatar_available ? this.marketAgentAvatarUrl(agent) : "") : this.avatarUrl(agent);
      const classes = ["agent-mark", size, "agent-avatar-image"].filter(Boolean).join(" ");
      return url
        ? `<img class="${classes}" src="${this.escape(url)}" alt="${this.escape(name)} avatar" />`
        : `<span class="${classes}" aria-hidden="true">${this.escape(this.initials(name))}</span>`;
    },
    agentTagsMarkup(tags, limit = 4) {
      if (!Array.isArray(tags)) return "";
      return tags
        .slice(0, limit)
        .map((tag) => `<span class="badge badge-ghost">${this.escape(String(tag))}</span>`)
        .join("");
    },
    agentName(id) {
      return this.agents.find((a) => a.id === id)?.name || "unknown agent";
    },
    normalizeResourcePath(path) {
      const normalized = String(path || "").replaceAll("\\", "/");
      const marker = "/.pi/agent";
      const index = normalized.indexOf(marker);
      return index >= 0 ? normalized.slice(index) : normalized;
    },
    resourcePath(kind, path) {
      const catalog = kind === "extensions" ? this.resources.extensions : this.resources.skills;
      const normalized = this.normalizeResourcePath(path);
      return catalog.find((item) => this.normalizeResourcePath(item.path) === normalized)?.path || "";
    },
    resourceNames(paths, kind) {
      if (!paths?.length) return "None";
      const catalog = kind === "extensions" ? this.resources.extensions : this.resources.skills;
      return paths
        .map(
          (path) =>
            catalog.find((item) => this.normalizeResourcePath(item.path) === this.normalizeResourcePath(path))?.name ||
            path.split(/[\\/]/).pop(),
        )
        .join(", ");
    },
    profileTags(value) {
      return value
        .split(/[\n,]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 5);
    },
    profileQuickstarts(value) {
      return value
        .split("\n")
        .map((prompt) => prompt.trim())
        .filter(Boolean)
        .slice(0, 5);
    },
    agentSkills(agent) {
      const enabled = agent?.skills || [];
      return this.resources.skills.filter((skill) =>
        enabled.some((path) => this.normalizeResourcePath(path) === this.normalizeResourcePath(skill.path)),
      );
    },
    startQuickstart(agent, prompt) {
      this.newChat();
      this.selectedAgentId = agent.id;
      this.draft = prompt;
      this.$nextTick(() => document.getElementById("new-chat-message")?.focus());
    },
    providerName(id) {
      return this.resources.providers.find((item) => item.id === id)?.name || id || "";
    },
    modelName(providerId, modelId) {
      return this.modelsFor(providerId).find((item) => item.id === modelId)?.name || modelId || "";
    },
    chooseAgent(id) {
      this.selectedAgentId = id;
      this.agentPickerOpen = false;
    },
    chatCount(id) {
      return this.chats.filter((c) => c.agent_id === id).length;
    },
    initials(name) {
      return name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    },
    relativeTime(value) {
      if (!value) return "";
      const diff = Date.now() - Date.parse(value);
      if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
      return new Date(value).toLocaleDateString(this.locale(), {
        month: "short",
        day: "numeric",
      });
    },
    formatDate(value) {
      return value
        ? new Date(value).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "—";
    },
    defaultResources(kind) {
      const configKey = {
        extensions: "default_extensions",
        skills: "default_skills",
        mcp_servers: "default_mcp_servers",
      }[kind];
      const valueKey = kind === "mcp_servers" ? "id" : "path";
      const configured = this.resources[configKey] || [];
      return configured
        .map((value) =>
          kind === "mcp_servers"
            ? this.resources[kind].find((item) => [item.id, item.name, item.path].includes(value))?.[valueKey]
            : this.resourcePath(kind, value),
        )
        .filter(Boolean);
    },
    newAgent() {
      this.editingAgent = null;
      this.newAgentName = "";
      this.newAgentDescription = "";
      this.newAgentTags = "";
      this.newAgentQuickstarts = "";
      this.newAgentInstruction = "";
      this.newAgentAvatarFile = null;
      this.newAgentAvatarPreview = "";
      this.newAgentProvider = "";
      this.newAgentModel = "";
      this.newAgentThinkingLevel = "";
      this.newAgentTools = this.defaultAgentTools();
      this.newAgentExtensions = this.defaultResources("extensions");
      this.newAgentSkills = this.defaultResources("skills");
      this.newAgentMcpServers = this.defaultResources("mcp_servers");
      this.agentWizardStep = 1;
      this.agentSkillSearch = "";
      this.createDialog = true;
    },
    hasAgentDraft() {
      return Boolean(
        this.newAgentName.trim() ||
        this.newAgentDescription.trim() ||
        this.newAgentTags.trim() ||
        this.newAgentQuickstarts.trim() ||
        this.newAgentInstruction.trim() ||
        this.newAgentAvatarFile,
      );
    },
    dismissAgentDialogFromBackdrop() {
      if (!this.hasAgentDraft()) this.createDialog = false;
    },
    closeAgentDialog() {
      if (this.newAgentAvatarPreview) URL.revokeObjectURL(this.newAgentAvatarPreview);
      this.createDialog = false;
      this.editingAgent = null;
      this.newAgentAvatarFile = null;
      this.newAgentAvatarPreview = "";
      this.agentWizardStep = 1;
      this.agentSkillSearch = "";
    },
    setAgentWizardStep(step) {
      if (![1, 2, 3].includes(step)) return;
      this.agentWizardStep = step;
      this.$nextTick(() => this.resizeAgentTextareas());
    },
    nextAgentWizardStep() {
      this.setAgentWizardStep(Math.min(3, this.agentWizardStep + 1));
    },
    previousAgentWizardStep() {
      this.setAgentWizardStep(Math.max(1, this.agentWizardStep - 1));
    },
    agentSkillItems() {
      const query = this.agentSkillSearch.trim().toLowerCase();
      if (!query) return this.resources.skills;
      return this.resources.skills.filter((item) =>
        `${item.name || ""} ${item.description || ""}`.toLowerCase().includes(query),
      );
    },
    async generateAgentInstruction() {
      if (this.generatingInstruction) return;
      this.generatingInstruction = true;
      try {
        const data = await this.api("/api/agents/instruction-draft", {
          method: "POST",
          body: JSON.stringify({
            name: this.newAgentName,
            instruction: this.newAgentInstruction,
            description: this.newAgentDescription,
            tags: this.profileTags(this.newAgentTags),
            quickstarts: this.profileQuickstarts(this.newAgentQuickstarts),
            ...this.agentModelConfigPayload(),
            tools: this.newAgentTools,
            extensions: this.newAgentExtensions,
            skills: this.newAgentSkills,
            mcp_servers: this.newAgentMcpServers,
          }),
        });
        this.newAgentInstruction = data.instruction || this.newAgentInstruction;
        this.newAgentDescription = data.description || this.newAgentDescription;
        if (Array.isArray(data.tags) && data.tags.length) this.newAgentTags = data.tags.join(", ");
        if (Array.isArray(data.quickstarts) && data.quickstarts.length)
          this.newAgentQuickstarts = data.quickstarts.join("\n");
        this.$nextTick(() => this.resizeAgentTextareas());
        this.showToast("Agent profile optimized");
      } catch (error) {
        this.showError(error);
      } finally {
        this.generatingInstruction = false;
      }
    },
    modelsFor(providerId = this.newAgentProvider) {
      return this.resources.providers.find((item) => item.id === providerId)?.models || [];
    },
    thinkingLevelsFor() {
      if (!this.newAgentProvider || !this.newAgentModel) return [];
      const levels = this.modelsFor().find((item) => item.id === this.newAgentModel)?.thinking_levels || [];
      return levels.length ? levels : ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
    },
    defaultThinkingLevel() {
      const levels = this.thinkingLevelsFor();
      return levels.includes(this.resources.default_thinking_level)
        ? this.resources.default_thinking_level
        : levels.includes("low")
          ? "low"
          : levels[0] || "off";
    },
    defaultAgentTools() {
      const preferred = this.toolGroups.filter((group) => group.id !== "run_scripts").flatMap((group) => group.tools);
      return preferred.filter((name) => this.toolCatalog.some((tool) => tool.name === name));
    },
    defaultModelFor(providerId) {
      const models = this.modelsFor(providerId);
      if (
        providerId === this.resources.default_provider &&
        models.some((item) => item.id === this.resources.default_model)
      )
        return this.resources.default_model;
      return models[0]?.id || "";
    },
    changeAgentProvider() {
      if (!this.newAgentProvider) {
        this.newAgentModel = "";
        this.newAgentThinkingLevel = "";
        return;
      }
      this.newAgentModel = this.defaultModelFor(this.newAgentProvider);
      this.newAgentThinkingLevel = this.defaultThinkingLevel();
    },
    changeAgentModel() {
      if (!this.newAgentModel) {
        this.newAgentThinkingLevel = "";
        return;
      }
      if (!this.thinkingLevelsFor().includes(this.newAgentThinkingLevel))
        this.newAgentThinkingLevel = this.defaultThinkingLevel();
    },
    agentModelConfigPayload() {
      return {
        provider: this.newAgentProvider || null,
        model: this.newAgentModel || null,
        thinking_level: this.newAgentThinkingLevel || null,
      };
    },
    usesAutoModelConfig() {
      return !this.newAgentProvider && !this.newAgentModel && !this.newAgentThinkingLevel;
    },
    autoModelConfigLabel() {
      const provider = this.resources.default_provider || "not configured";
      const model = this.resources.default_model || "not configured";
      const thinking = this.resources.default_thinking_level || "not configured";
      return `${this.providerName(provider) || provider} / ${this.modelName(provider, model) || model} / ${thinking}`;
    },
    async submitAgent() {
      const validModelConfig =
        this.usesAutoModelConfig() || (this.newAgentProvider && this.newAgentModel && this.newAgentThinkingLevel);
      if (!this.newAgentName.trim() || !this.newAgentInstruction.trim() || !validModelConfig) return;
      this.creating = true;
      try {
        const editing = Boolean(this.editingAgent);
        const avatarFile = this.newAgentAvatarFile;
        const payload = {
          name: this.newAgentName,
          description: this.newAgentDescription.trim() || null,
          tags: this.profileTags(this.newAgentTags),
          quickstarts: this.profileQuickstarts(this.newAgentQuickstarts),
          instruction: this.newAgentInstruction,
          ...this.agentModelConfigPayload(),
          tools: this.newAgentTools,
          extensions: this.newAgentExtensions,
          skills: this.newAgentSkills,
          mcp_servers: this.newAgentMcpServers,
        };
        const agent = this.editingAgent
          ? await this.api(`/api/agents/${this.editingAgent.id}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            })
          : await this.api("/api/agents", {
              method: "POST",
              body: JSON.stringify(payload),
            });
        if (!editing && avatarFile) await this.uploadAvatarFile(agent.id, avatarFile);
        await this.refreshAgents();
        this.createDialog = false;
        this.dialog = null;
        this.editingAgent = null;
        this.page = "agents";
        this.showToast(editing ? "Agent updated" : "Agent created");
      } catch (e) {
        this.showError(e);
      } finally {
        this.creating = false;
      }
    },
    toggleAgentTool(name) {
      this.newAgentTools = this.newAgentTools.includes(name)
        ? this.newAgentTools.filter((tool) => tool !== name)
        : [...this.newAgentTools, name];
    },
    toolGroupTools(group) {
      return group.tools.filter((name) => this.toolCatalog.some((tool) => tool.name === name));
    },
    toolGroupState(group) {
      return this.toolGroupStateFor(group, this.newAgentTools);
    },
    toolGroupStateFor(group, selectedTools = []) {
      const tools = this.toolGroupTools(group);
      const selected = tools.filter((name) => selectedTools.includes(name)).length;
      return selected === 0 ? "none" : selected === tools.length ? "all" : "partial";
    },
    dialogToolGroupState(group) {
      return this.toolGroupStateFor(group, this.dialog?.tools || []);
    },
    toggleToolGroup(group) {
      const tools = this.toolGroupTools(group);
      if (this.toolGroupState(group) === "all") {
        this.newAgentTools = this.newAgentTools.filter((name) => !tools.includes(name));
      } else {
        this.newAgentTools = [...new Set([...this.newAgentTools, ...tools])];
      }
    },
    avatarUrl(agent) {
      if (!agent?.avatar_path || !agent.id) return "";
      return `/api/agents/${encodeURIComponent(agent.id)}/avatar?v=${encodeURIComponent(agent.updated_at || agent.avatar_path)}`;
    },
    marketAgentAvatarUrl(agent) {
      return agent?.id ? `/api/market/agents/${encodeURIComponent(agent.id)}/avatar` : "";
    },
    async uploadAvatarFile(agentId, file) {
      const requestPath = `/api/agents/${encodeURIComponent(agentId)}/avatar`;
      const { response, requestId } = await this.request(requestPath, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });
      const { data } = await this.responseData(response, requestId, requestPath);
      return data;
    },
    async uploadAgentAvatar(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        this.showError(new Error("Avatar must be an image file"));
        event.target.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.showError(new Error("Avatar must be 5 MB or smaller"));
        event.target.value = "";
        return;
      }
      if (this.newAgentAvatarPreview) URL.revokeObjectURL(this.newAgentAvatarPreview);
      this.newAgentAvatarFile = file;
      this.newAgentAvatarPreview = URL.createObjectURL(file);
      if (!this.editingAgent) return;
      this.creating = true;
      try {
        const updated = await this.uploadAvatarFile(this.editingAgent.id, file);
        Object.assign(this.editingAgent, updated);
        this.dialog = updated;
        this.newAgentAvatarFile = null;
        this.newAgentAvatarPreview = "";
      } catch (error) {
        this.showError(error);
      } finally {
        this.creating = false;
      }
    },
    toggleResource(kind, path) {
      const key =
        kind === "extensions" ? "newAgentExtensions" : kind === "skills" ? "newAgentSkills" : "newAgentMcpServers";
      this[key] = this[key].includes(path) ? this[key].filter((item) => item !== path) : [...this[key], path];
    },
    deleteAgent(agent) {
      if (!agent.protected) this.confirmTarget = agent;
    },
    publishAgent(agent) {
      this.marketPublishTarget = agent;
      this.marketPublishVersion = "v1.0.0";
    },
    async confirmPublishAgent() {
      const agent = this.marketPublishTarget;
      if (!agent || this.marketPublishing) return;
      this.marketPublishing = true;
      try {
        const data = await this.api(`/api/agents/${agent.id}/publish`, {
          method: "POST",
          body: JSON.stringify({ version: this.marketPublishVersion }),
        });
        this.marketPublishTarget = null;
        await this.loadMarketAgents();
        this.showToast(`Agent ${data.agent.name} ${data.agent.version} published`);
      } catch (error) {
        this.showError(error);
      } finally {
        this.marketPublishing = false;
      }
    },
    installMarketAgent(agent) {
      this.marketInstallAgentTarget = agent;
    },
    requestMarketplaceAgentUpdate(agent) {
      if (!agent?.marketplace_update_available) return;
      this.marketUpdateAgentTarget = agent;
    },
    requestMarketListingUpdate(item) {
      const agent = this.agents.find(
        (candidate) => candidate.marketplace_update_available && item.installed_agent_ids?.includes(candidate.id),
      );
      if (agent) this.requestMarketplaceAgentUpdate(agent);
    },
    deleteMarketAgent(agent) {
      if (this.authUser?.role === "admin") this.marketDeleteAgentTarget = agent;
    },
    async confirmDeleteMarketAgent() {
      const agent = this.marketDeleteAgentTarget;
      if (!agent || this.marketDeletingAgent) return;
      this.marketDeletingAgent = true;
      try {
        await this.api(`/api/market/agents/${agent.id}`, { method: "DELETE" });
        this.marketAgents = this.marketAgents.filter((item) => item.id !== agent.id);
        this.marketDeleteAgentTarget = null;
        this.showToast(`Agent ${agent.name} removed from Marketplace`);
      } catch (error) {
        this.showError(error);
      } finally {
        this.marketDeletingAgent = false;
      }
    },
    async confirmInstallMarketAgent() {
      const agent = this.marketInstallAgentTarget;
      if (!agent || this.marketInstallingAgent) return;
      this.marketInstallingAgent = true;
      try {
        const data = await this.api(`/api/market/agents/${agent.id}/install`, {
          method: "POST",
          body: JSON.stringify({ version: agent.version }),
        });
        await this.refreshAgents();
        this.marketInstallAgentTarget = null;
        this.showToast(`Agent ${data.agent.name} installed`);
      } catch (error) {
        this.showError(error);
      } finally {
        this.marketInstallingAgent = false;
      }
    },
    async confirmMarketplaceAgentUpdate() {
      const agent = this.marketUpdateAgentTarget;
      if (!agent || this.marketUpdatingAgent) return;
      this.marketUpdatingAgent = true;
      try {
        const updated = await this.api(`/api/agents/${agent.id}/market-update`, {
          method: "POST",
        });
        await Promise.all([this.refreshAgents(), this.loadMarketAgents()]);
        this.marketUpdateAgentTarget = null;
        this.showToast(`Agent ${updated.name} updated`);
      } catch (error) {
        this.showError(error);
      } finally {
        this.marketUpdatingAgent = false;
      }
    },
    deleteChat(chat) {
      this.deleteChatTarget = chat;
    },
    async confirmDeleteChat() {
      const chat = this.deleteChatTarget;
      if (!chat) return;
      try {
        await this.api(`/api/chats/${chat.id}`, { method: "DELETE" });
        this.chats = this.chats.filter((item) => item.id !== chat.id);
        this.deleteChatTarget = null;
        if (this.activeChat?.id === chat.id) this.newChat();
      } catch (e) {
        this.showError(e);
      }
    },
    async confirmDelete() {
      const agent = this.confirmTarget;
      if (!agent) return;
      try {
        await this.api(`/api/agents/${agent.id}`, { method: "DELETE" });
        await this.refreshAgents();
        if (this.dialog?.id === agent.id) this.dialog = null;
        this.confirmTarget = null;
        this.showToast(`Agent ${agent.name} deleted`);
      } catch (e) {
        this.showError(e);
      }
    },
    editAgent(agent) {
      this.editingAgent = agent;
      this.newAgentName = agent.name;
      this.newAgentDescription = agent.description || "";
      this.newAgentTags = (agent.tags || []).join(", ");
      this.newAgentQuickstarts = (agent.quickstarts || []).join("\n");
      this.newAgentInstruction = agent.instruction;
      this.newAgentAvatarFile = null;
      this.newAgentAvatarPreview = "";
      this.newAgentProvider = agent.provider || "";
      this.newAgentModel = agent.model || "";
      this.newAgentThinkingLevel = agent.thinking_level || "";
      this.newAgentTools = [...(agent.tools || [])];
      this.newAgentExtensions = (agent.extensions || [])
        .map((path) => this.resourcePath("extensions", path))
        .filter(Boolean);
      this.newAgentSkills = (agent.skills || []).map((path) => this.resourcePath("skills", path)).filter(Boolean);
      this.newAgentMcpServers = [...(agent.mcp_servers || [])];
      this.agentWizardStep = 1;
      this.agentSkillSearch = "";
      this.dialog = null;
      this.createDialog = true;
      this.$nextTick(() => this.resizeAgentTextareas());
    },
    async routeFromUrl() {
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
        await this.openSharedChat(decodeURIComponent(shareMatch[1]));
        return;
      }
      if (window.location.pathname === "/agents") {
        this.page = "agents";
        return;
      }
      const match = window.location.pathname.match(/^\/chat\/([^/]+)$/);
      this.page = "chat";
      if (match) {
        const chat = this.chats.find((item) => item.id === decodeURIComponent(match[1]));
        if (chat) await this.openChat(chat, false);
        else {
          this.activeChat = null;
          this.messages = [];
          this.showError(new Error("Chat not found"));
        }
      } else {
        this.activeChat = null;
        this.messages = [];
        this.draft = "";
        this.loading = false;
      }
    },
    renderWebActivity(name, args) {
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
    renderWebActivityItems(name, items) {
      window.omaPlatform = this;
      const key = crypto.randomUUID();
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
                  `<a href="${this.escape(item.url)}" title="${this.escape(item.title)}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><span class="web-activity-page-title">${this.escape(this.truncateLabel(item.title))}</span><i data-lucide="external-link"></i></a>`,
              )
              .join("")}</span>`
          : "";
      const sites =
        name === "web_search"
          ? `<span class="web-activity-sites">${items
              .slice(0, 5)
              .map((item) =>
                item.favicon
                  ? `<img src="${this.escape(item.favicon)}" alt="" loading="lazy" onerror="this.hidden=true">`
                  : "",
              )
              .join("")}</span>`
          : "";
      return `<div role="button" tabindex="0" class="web-activity web-activity-${name}" data-web-activity-id="${key}" onclick="event.stopPropagation();window.omaPlatform.openWebActivity(this)" onkeydown="if(event.key === 'Enter' || event.key === ' ') window.omaPlatform.openWebActivity(this)"><span class="web-activity-label">${label}</span>${sites}${pages}${viewAll}<span class="web-activity-arrow"><i data-lucide="chevron-right" aria-hidden="true"></i></span></div>`;
    },
    parseSearchResults(text) {
      const items = [];
      const pattern = /(?:^|\n)\s*\d+\.\s+\*\*(.+?)\*\*\s*\n([\s\S]*?)\n(https?:\/\/\S+)/g;
      let match;
      while ((match = pattern.exec(text))) {
        const url = match[3].replace(/[)>.,]+$/, "");
        items.push({
          title: match[1].trim(),
          snippet: match[2].trim(),
          url,
          favicon: this.faviconFor(url),
        });
      }
      return items;
    },
    parseFetchResult(text, result, args) {
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
    truncateLabel(value, limit = 20) {
      const characters = [...String(value || "")];
      return characters.length > limit ? `${characters.slice(0, limit).join("")}…` : characters.join("");
    },
    formatCompactNumber(value) {
      const number = Number(value) || 0;
      if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
      if (number >= 1000) return `${(number / 1000).toFixed(1)}k`;
      return String(Math.round(number));
    },
    sessionUsageMarkup() {
      const usage = this.sessionUsage || {};
      const stat = (icon, label, value) =>
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
    faviconFor(url) {
      try {
        return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(url).hostname)}&sz=32`;
      } catch {
        return "";
      }
    },
    openWebActivity(button) {
      const activity = this.webActivities[button.dataset.webActivityId];
      if (!activity) return;
      this.linkDrawerTitle = this.t(activity.kind === "web_search" ? "chat.searchResults" : "chat.readPagesTitle");
      this.linkDrawerItems = activity.items || [];
      this.filesOpen = false;
      this.linkDrawerOpen = true;
    },
    resourceCountLabel(count) {
      return this.t("chat.resourceCount", { count });
    },
    fileCountLabel(count) {
      return this.t("chat.fileCount", { count });
    },
    closeDrawersOutside(event) {
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
    renderReasoning(parts, messageKey, isStreaming = false) {
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
            : this.renderReasoningPart(entry.part);
          const toolName = entry.kind || entry.part?.name;
          return html
            ? {
                html,
                marker: toolName === "web_search" ? "globe" : toolName === "web_fetch" ? "globe" : "dot",
              }
            : null;
        })
        .filter(Boolean);
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
      const seconds =
        times.length > 1 ? Math.max(1, Math.round((Math.max(...times) - Math.min(...times)) / 1000)) : null;
      const label = isStreaming ? "Thinking" : seconds === null ? "Thought" : `Thought for ${seconds}s`;
      const reasoningKey = `${messageKey || "message"}:reasoning`;
      const hasPreference = Object.prototype.hasOwnProperty.call(this.reasoningOpen, reasoningKey);
      // The block follows its turn: open while the turn is in flight (there is no
      // answer to read yet), closed once the turn lands. An explicit user toggle in
      // either direction outranks that default and is recorded by setReasoningOpen().
      const checked = (hasPreference ? this.reasoningOpen[reasoningKey] : isStreaming) ? " checked" : "";
      return `<div class="collapse reasoning-collapse"><input type="checkbox" data-reasoning-key="${this.escape(reasoningKey)}" onchange="window.omaPlatform.setReasoningOpen(this)"${checked} /><div class="collapse-title process-label"><i data-lucide="sparkle" aria-hidden="true"></i><span>${label}</span><i class="reasoning-chevron" data-lucide="chevron-down" aria-hidden="true"></i></div><div class="collapse-content"><ul class="timeline timeline-compact timeline-snap-icon timeline-vertical reasoning-timeline">${content}</ul></div></div>`;
    },
    renderProcessToolCall(name, args) {
      if (name === "web_search" || name === "web_fetch") return this.renderWebActivity(name, args);
      const renderers = {
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
    productionToolAllowlist: ["read", "write", "edit", "web_search", "web_fetch"],
    showError(error) {
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
}

// Exposed for the Alpine x-data binding in index.html.
window.platform = platform;
