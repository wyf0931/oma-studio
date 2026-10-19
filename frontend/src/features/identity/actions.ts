import { toRecord } from "../../shared/types";
import { ApiError, asError } from "../../shared/types";
import type { Workspace } from "../../app/workspace";

import type * as DTO from "../../shared/types";

// Explicit dependency contract for this feature; the composition root supplies it.
type Context = Pick<
  Workspace,
  | "abortChatReads"
  | "activeChat"
  | "agents"
  | "api"
  | "appReady"
  | "authChecked"
  | "authUser"
  | "chatViewToken"
  | "chats"
  | "files"
  | "initials"
  | "loadAgents"
  | "loadChats"
  | "loadHealth"
  | "loadResources"
  | "loadShareRecords"
  | "loadUsers"
  | "loading"
  | "loginError"
  | "loginLoading"
  | "loginPassword"
  | "loginUsername"
  | "logoutConfirmOpen"
  | "messages"
  | "messagesLoading"
  | "modeQuery"
  | "newUserEmail"
  | "newUserUsername"
  | "openSettings"
  | "openUsage"
  | "page"
  | "profileDisplayName"
  | "profileMenuOpen"
  | "renderIconsSoon"
  | "requestLogout"
  | "routeFromUrl"
  | "runError"
  | "selectedAgentId"
  | "sessionExpired"
  | "settingsOpen"
  | "shareRecordsOpen"
  | "sharedMode"
  | "showError"
  | "showToast"
  | "stopWatching"
  | "t"
  | "userAddOpen"
  | "userCreating"
  | "userDeleteTarget"
  | "users"
  | "usersLoading"
  | "usersOpen"
>;
export interface Actions {
  loadSession(): Promise<void>;
  login(): Promise<void>;
  requestLogout(): void;
  confirmLogout(): Promise<void>;
  profileAvatarInitials(): string;
  profileDisplayName(): string;
  profileRoleLabel(): string;
  openProfileSettings(): void;
  openProfileUsage(): Promise<void>;
  openProfileUsers(): Promise<void>;
  openProfileShares(): Promise<void>;
  openProfileLogout(): void;
  errorFromResponse(response: Response, requestId: string, data?: unknown): DTO.ApiError;
  handleUnauthorizedResponse(response: Response, path: string, error: DTO.ApiError): void;
  loadUsers(): Promise<void>;
  openAddUser(): void;
  createManagedUser(): Promise<void>;
  toggleManagedUser(user: DTO.User): Promise<void>;
  requestDeleteUser(user: DTO.User): void;
  confirmDeleteUser(): Promise<void>;
}
export const identityActions: Actions = {
  async loadSession(this: Context): Promise<void> {
    try {
      const data = await this.api<{ user: DTO.User | null }>("/api/auth/session");
      this.authUser = data.user;
    } catch (cause) {
      const error = asError(cause);
      this.authUser = null;
      this.settingsOpen = false;
      this.loginError = error.uiMessage || error.message;
    } finally {
      this.authChecked = true;
    }
  },
  async login(this: Context): Promise<void> {
    if (this.loginLoading) return;
    this.loginLoading = true;
    this.loginError = "";
    try {
      this.authUser = await this.api<DTO.User>("/api/auth/login", {
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
      if (this.agents.length) this.selectedAgentId = this.agents[0]!.id;
      this.appReady = true;
      await this.routeFromUrl();
      this.renderIconsSoon();
    } catch (cause) {
      const error = asError(cause);
      this.authUser = null;
      this.loginError = error.uiMessage || error.message;
    } finally {
      this.loginLoading = false;
    }
  },
  requestLogout(this: Context): void {
    this.logoutConfirmOpen = true;
  },
  async confirmLogout(this: Context): Promise<void> {
    try {
      await this.api("/api/auth/logout", { method: "POST" });
      this.logoutConfirmOpen = false;
      this.authUser = null;
      this.authChecked = true;
      this.appReady = true;
      this.page = "chat";
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    }
  },
  profileAvatarInitials(this: Context): string {
    return this.initials(this.profileDisplayName());
  },
  profileDisplayName(this: Context): string {
    return this.authUser?.nickname || this.authUser?.username || this.t("nav.user");
  },
  profileRoleLabel(this: Context): string {
    return this.authUser?.role === "admin" ? this.t("nav.administrator") : this.t("nav.member");
  },
  openProfileSettings(this: Context): void {
    this.profileMenuOpen = false;
    this.openSettings();
  },
  async openProfileUsage(this: Context): Promise<void> {
    this.profileMenuOpen = false;
    await this.openUsage();
  },
  async openProfileUsers(this: Context): Promise<void> {
    this.profileMenuOpen = false;
    this.usersOpen = true;
    await this.loadUsers();
  },
  async openProfileShares(this: Context): Promise<void> {
    this.profileMenuOpen = false;
    this.shareRecordsOpen = true;
    await this.loadShareRecords();
  },
  openProfileLogout(this: Context): void {
    this.profileMenuOpen = false;
    this.requestLogout();
  },
  errorFromResponse(this: Context, response: Response, requestId: string, data: unknown = null): DTO.ApiError {
    const payload = toRecord(data);
    const detail = typeof payload.detail === "string" ? payload.detail : `Server returned ${response.status}`;
    const code = typeof payload.code === "string" ? payload.code : "";
    const params = Object.fromEntries(
      Object.entries(toRecord(payload.params)).filter(
        (entry): entry is [string, string | number] => typeof entry[1] === "string" || typeof entry[1] === "number",
      ),
    );
    const message = code ? this.t(code, { ...params, defaultValue: detail }) : detail;
    const error = new ApiError(`${message} (request_id: ${requestId})`);
    error.uiMessage = message;
    error.requestId = requestId;
    error.status = response.status;
    error.code = code || "";
    error.params = params;
    return error;
  },
  handleUnauthorizedResponse(this: Context, response: Response, path: string, error: DTO.ApiError): void {
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
    this.settingsOpen = false;
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
  async loadUsers(this: Context): Promise<void> {
    this.usersLoading = true;
    try {
      this.users = (await this.api<{ users: DTO.User[] }>("/api/users")).users;
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    } finally {
      this.usersLoading = false;
    }
  },
  openAddUser(this: Context): void {
    this.newUserUsername = "";
    this.newUserEmail = "";
    this.userAddOpen = true;
  },
  async createManagedUser(this: Context): Promise<void> {
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
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    } finally {
      this.userCreating = false;
    }
  },
  async toggleManagedUser(this: Context, user: DTO.User): Promise<void> {
    const status = user.status === "active" ? "disabled" : "active";
    try {
      await this.api(`/api/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await this.loadUsers();
      this.showToast(`User ${user.username} ${status}`);
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    }
  },
  requestDeleteUser(this: Context, user: DTO.User): void {
    if (user.role !== "admin") this.userDeleteTarget = user;
  },
  async confirmDeleteUser(this: Context): Promise<void> {
    const user = this.userDeleteTarget;
    if (!user) return;
    try {
      await this.api(`/api/users/${user.id}`, { method: "DELETE" });
      await this.loadUsers();
      this.userDeleteTarget = null;
      this.showToast(`User ${user.username} deleted`);
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    }
  },
};
