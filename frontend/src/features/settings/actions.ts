import type { Actions as IdentityActions, State as IdentityState } from "../identity/actions";
import type { Actions as I18nActions, State as I18nState } from "../../shared/i18n";
import type { Actions as ApiActions } from "../../shared/api";
import type { Actions as ShellActions } from "../../app/actions";
import { unwrap } from "../../shared/api";
import { reactive, nextTick } from "vue";

import { asError } from "../../shared/types";

import { createSettingsState } from "./state";
export type State = ReturnType<typeof createSettingsState>;
export interface Actions {
  closeSettings(): void;
  initializeThemePreference(): void;
  applyThemePreference(value: string): void;
  syncFavicon(): void;
  syncHighlightTheme(): void;
  openSettings(): Promise<void>;
  openSettingsTab(tab: string): Promise<void>;
  accountProfileDirty(): boolean;
  saveAccountProfile(): Promise<void>;
  resetAccountPassword(): void;
  openAccountPassword(): void;
  saveAccountPassword(): Promise<void>;
  saveLanguage(): Promise<void>;
  loadSystemSettings(): Promise<void>;
  saveSystemTimezone(): Promise<void>;
}
export interface Feature extends Actions {
  state: State;
}
export interface Dependencies {
  identity: Pick<IdentityActions, "setCurrentUser"> & { state: Readonly<Pick<IdentityState, "authUser">> };
  i18n: Pick<I18nActions, "setLanguage" | "t"> & { state: Readonly<Pick<I18nState, "language">> };
  api: Pick<ApiActions, "client">;
  shell: Pick<ShellActions, "showError" | "showToast">;
  onCleanup(cleanup: () => void): void;
}
export function createSettings(deps: Dependencies): Feature {
  const state = reactive(createSettingsState());
  function initializeThemePreference(): void {
    const preference = localStorage.getItem("oma-theme-preference");
    applyThemePreference(preference || "system");
    state.systemThemeQuery = window.matchMedia?.("(prefers-color-scheme: dark)") || null;
    const onThemeChange = () => {
      if (state.themePreference === "system") applyThemePreference("system");
    };
    state.systemThemeQuery?.addEventListener("change", onThemeChange);
    deps.onCleanup(() => state.systemThemeQuery?.removeEventListener("change", onThemeChange));
  }
  function applyThemePreference(value: string): void {
    state.themePreference = ["system", "light", "dark"].includes(value || "") ? value : "system";
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    state.theme = state.themePreference === "system" ? (prefersDark ? "dark" : "light") : state.themePreference;
    document.documentElement.dataset.theme = state.theme;
    syncHighlightTheme();
    syncFavicon();
    localStorage.setItem("oma-theme-preference", state.themePreference);
  }
  function syncFavicon(): void {
    const favicon = document.querySelector<HTMLLinkElement>("#app-favicon");
    if (favicon)
      favicon.href = `/static/${state.theme === "dark" ? "favicon-dark-32.png" : "favicon-32.png"}?v=20260917-theme`;
  }
  function syncHighlightTheme(): void {
    const lightTheme = document.querySelector<HTMLStyleElement>("#highlightjs-light-theme");
    const darkTheme = document.querySelector<HTMLStyleElement>("#highlightjs-dark-theme");
    if (lightTheme?.sheet) lightTheme.sheet.disabled = state.theme === "dark";
    if (darkTheme?.sheet) darkTheme.sheet.disabled = state.theme !== "dark";
  }
  async function openSettings(): Promise<void> {
    state.settingsTab = "general";
    state.accountProfile = {
      nickname: deps.identity.state.authUser?.nickname || "",
      email: deps.identity.state.authUser?.email || "",
    };
    state.accountProfileError = "";
    state.accountProfileSaved = false;
    resetAccountPassword();
    state.settingsOpen = true;
    if (deps.identity.state.authUser?.role === "admin") await loadSystemSettings();
  }
  async function openSettingsTab(tab: string): Promise<void> {
    if (tab !== "account") resetAccountPassword();
    state.settingsTab = tab;
  }
  function accountProfileDirty(): boolean {
    return (
      state.accountProfile.nickname.trim() !== (deps.identity.state.authUser?.nickname || "") ||
      state.accountProfile.email.trim() !== (deps.identity.state.authUser?.email || "")
    );
  }
  async function saveAccountProfile(): Promise<void> {
    if (state.accountProfileSaving || !accountProfileDirty()) return;
    state.accountProfileSaving = true;
    state.accountProfileError = "";
    state.accountProfileSaved = false;
    try {
      const user = unwrap(
        await deps.api.client.PATCH("/api/users/me", {
          body: {
            nickname: state.accountProfile.nickname.trim() || null,
            email: state.accountProfile.email.trim() || null,
          },
        }),
      );
      deps.identity.setCurrentUser(user);
      state.accountProfile = { nickname: user.nickname || "", email: user.email || "" };
      state.accountProfileSaved = true;
    } catch (cause) {
      const error = asError(cause);
      state.accountProfileError =
        error.status === 422 ? deps.i18n.t("account.profileInvalid") : error.uiMessage || error.message;
    } finally {
      state.accountProfileSaving = false;
    }
  }
  function resetAccountPassword(): void {
    state.accountPasswordOpen = false;
    state.accountCurrentPassword = "";
    state.accountNewPassword = "";
    state.accountShowCurrentPassword = false;
    state.accountShowNewPassword = false;
    state.accountPasswordErrors = { current: "", new: "", form: "" };
    state.accountPasswordSaved = false;
  }
  function openAccountPassword(): void {
    resetAccountPassword();
    state.accountPasswordOpen = true;
    nextTick(() => document.querySelector<HTMLInputElement>('[data-ref="accountCurrentPassword"]')?.focus());
  }
  async function saveAccountPassword(): Promise<void> {
    if (state.accountPasswordSaving) return;
    state.accountPasswordErrors = { current: "", new: "", form: "" };
    state.accountPasswordSaved = false;
    if (!state.accountCurrentPassword)
      state.accountPasswordErrors.current = deps.i18n.t("account.currentPasswordRequired");
    const passwordLength = Array.from(state.accountNewPassword).length;
    if (passwordLength < 15 || passwordLength > 200)
      state.accountPasswordErrors.new = deps.i18n.t("account.passwordLength");
    if (state.accountPasswordErrors.current || state.accountPasswordErrors.new) return;
    state.accountPasswordSaving = true;
    state.accountShowCurrentPassword = false;
    state.accountShowNewPassword = false;
    try {
      unwrap(
        await deps.api.client.POST("/api/users/me/password", {
          body: {
            current_password: state.accountCurrentPassword,
            new_password: state.accountNewPassword,
          },
        }),
      );
      resetAccountPassword();
      state.accountPasswordSaved = true;
    } catch (cause) {
      const error = asError(cause);
      if (error.code === "account.currentPasswordIncorrect") {
        state.accountPasswordErrors.current = error.uiMessage;
        state.accountCurrentPassword = "";
        nextTick(() => document.querySelector<HTMLInputElement>('[data-ref="accountCurrentPassword"]')?.focus());
      } else {
        state.accountPasswordErrors.form =
          error.status === 422 ? deps.i18n.t("account.passwordLength") : error.uiMessage || error.message;
      }
    } finally {
      state.accountPasswordSaving = false;
    }
  }
  async function saveLanguage(): Promise<void> {
    await deps.i18n.setLanguage(deps.i18n.state.language);
  }
  async function loadSystemSettings(): Promise<void> {
    try {
      state.systemTimezone = unwrap(await deps.api.client.GET("/api/settings")).timezone;
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    }
  }
  async function saveSystemTimezone(): Promise<void> {
    try {
      state.systemTimezone = unwrap(
        await deps.api.client.PATCH("/api/settings/timezone", { body: { timezone: state.systemTimezone } }),
      ).timezone;
      deps.shell.showToast("System timezone updated");
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    }
  }
  function closeSettings(): void {
    state.settingsOpen = false;
  }
  return {
    state,
    initializeThemePreference,
    applyThemePreference,
    syncFavicon,
    syncHighlightTheme,
    openSettings,
    openSettingsTab,
    accountProfileDirty,
    saveAccountProfile,
    resetAccountPassword,
    openAccountPassword,
    saveAccountPassword,
    saveLanguage,
    loadSystemSettings,
    saveSystemTimezone,
    closeSettings,
  };
}
