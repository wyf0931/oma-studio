import type { Actions as ApiActions } from "../../shared/api";
import type { Actions as SettingsActions } from "../settings/actions";
import type { Actions as ShellActions } from "../../app/actions";
import type { Actions as FormatActions } from "../../shared/format";
import type { Actions as I18nActions } from "../../shared/i18n";
import type { Actions as UsageActions } from "../usage/actions";
import type { Actions as SharesActions } from "../shares/actions";
import { unwrap } from "../../shared/api";
import { reactive } from "vue";
import type * as DTO from "../../shared/types";
import { asError } from "../../shared/types";

import { createIdentityState } from "./state";
export type State = ReturnType<typeof createIdentityState>;
export interface Actions {
  setCurrentUser(user: DTO.User | null): void;
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
  loadUsers(): Promise<void>;
  openAddUser(): void;
  createManagedUser(): Promise<void>;
  toggleManagedUser(user: DTO.User): Promise<void>;
  requestDeleteUser(user: DTO.User): void;
  confirmDeleteUser(): Promise<void>;
}
export interface Feature extends Actions {
  state: State;
}
export interface Dependencies {
  api: Pick<ApiActions, "client">;
  settings: Pick<SettingsActions, "closeSettings" | "openSettings">;
  shell: Pick<ShellActions, "showError" | "showToast">;
  format: Pick<FormatActions, "initials">;
  i18n: Pick<I18nActions, "t">;
  usage: Pick<UsageActions, "openUsage">;
  shares: Pick<SharesActions, "openShareRecords">;
  onAuthenticated(): Promise<void>;
  onLoggedOut(): void;
}
export function createIdentity(deps: Dependencies): Feature {
  const state = reactive(createIdentityState());
  async function loadSession(): Promise<void> {
    try {
      const data = unwrap(await deps.api.client.GET("/api/auth/session"));
      state.authUser = data.user;
    } catch (cause) {
      const error = asError(cause);
      state.authUser = null;
      deps.settings.closeSettings();
      state.loginError = error.uiMessage || error.message;
    } finally {
      state.authChecked = true;
    }
  }
  async function login(): Promise<void> {
    if (state.loginLoading) return;
    state.loginLoading = true;
    state.loginError = "";
    try {
      state.authUser = unwrap(
        await deps.api.client.POST("/api/auth/login", {
          body: {
            username: state.loginUsername,
            password: state.loginPassword,
          },
        }),
      );
      state.sessionExpired = false;
      state.loginPassword = "";
      await deps.onAuthenticated();
    } catch (cause) {
      const error = asError(cause);
      state.authUser = null;
      state.loginError = error.uiMessage || error.message;
    } finally {
      state.loginLoading = false;
    }
  }
  function requestLogout(): void {
    state.logoutConfirmOpen = true;
  }
  async function confirmLogout(): Promise<void> {
    try {
      unwrap(await deps.api.client.POST("/api/auth/logout"));
      state.logoutConfirmOpen = false;
      state.authUser = null;
      state.authChecked = true;
      deps.onLoggedOut();
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    }
  }
  function profileAvatarInitials(): string {
    return deps.format.initials(profileDisplayName());
  }
  function profileDisplayName(): string {
    return state.authUser?.nickname || state.authUser?.username || deps.i18n.t("nav.user");
  }
  function profileRoleLabel(): string {
    return state.authUser?.role === "admin" ? deps.i18n.t("nav.administrator") : deps.i18n.t("nav.member");
  }
  function openProfileSettings(): void {
    state.profileMenuOpen = false;
    deps.settings.openSettings();
  }
  async function openProfileUsage(): Promise<void> {
    state.profileMenuOpen = false;
    await deps.usage.openUsage();
  }
  async function openProfileUsers(): Promise<void> {
    state.profileMenuOpen = false;
    state.usersOpen = true;
    await loadUsers();
  }
  async function openProfileShares(): Promise<void> {
    state.profileMenuOpen = false;
    await deps.shares.openShareRecords();
  }
  function openProfileLogout(): void {
    state.profileMenuOpen = false;
    requestLogout();
  }
  async function loadUsers(): Promise<void> {
    state.usersLoading = true;
    try {
      state.users = unwrap(await deps.api.client.GET("/api/users")).users;
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    } finally {
      state.usersLoading = false;
    }
  }
  function openAddUser(): void {
    state.newUserUsername = "";
    state.newUserEmail = "";
    state.userAddOpen = true;
  }
  async function createManagedUser(): Promise<void> {
    if (state.userCreating) return;
    state.userCreating = true;
    try {
      unwrap(
        await deps.api.client.POST("/api/users", {
          body: {
            username: state.newUserUsername,
            email: state.newUserEmail || null,
          },
        }),
      );
      await loadUsers();
      state.userAddOpen = false;
      deps.shell.showToast(`User ${state.newUserUsername} added`);
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    } finally {
      state.userCreating = false;
    }
  }
  async function toggleManagedUser(user: DTO.User): Promise<void> {
    const status = user.status === "active" ? "disabled" : "active";
    try {
      unwrap(
        await deps.api.client.PATCH("/api/users/{user_id}/status", {
          params: { path: { user_id: user.id } },
          body: { status },
        }),
      );
      await loadUsers();
      deps.shell.showToast(`User ${user.username} ${status}`);
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    }
  }
  function requestDeleteUser(user: DTO.User): void {
    if (user.role !== "admin") state.userDeleteTarget = user;
  }
  async function confirmDeleteUser(): Promise<void> {
    const user = state.userDeleteTarget;
    if (!user) return;
    try {
      unwrap(await deps.api.client.DELETE("/api/users/{user_id}", { params: { path: { user_id: user.id } } }));
      await loadUsers();
      state.userDeleteTarget = null;
      deps.shell.showToast(`User ${user.username} deleted`);
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    }
  }
  function setCurrentUser(user: DTO.User | null): void {
    state.authUser = user;
  }
  return {
    state,
    loadSession,
    login,
    requestLogout,
    confirmLogout,
    profileAvatarInitials,
    profileDisplayName,
    profileRoleLabel,
    openProfileSettings,
    openProfileUsage,
    openProfileUsers,
    openProfileShares,
    openProfileLogout,
    loadUsers,
    openAddUser,
    createManagedUser,
    toggleManagedUser,
    requestDeleteUser,
    confirmDeleteUser,
    setCurrentUser,
  };
}
