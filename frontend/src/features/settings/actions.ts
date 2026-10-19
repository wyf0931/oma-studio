import { asError } from "../../shared/types";
import type { Workspace } from "../../app/workspace";
import { nextTick } from "vue";

import type * as DTO from "../../shared/types";

// Explicit dependency contract for this feature; the composition root supplies it.
type Context = Pick<
  Workspace,
  | "accountCurrentPassword"
  | "accountNewPassword"
  | "accountPasswordErrors"
  | "accountPasswordOpen"
  | "accountPasswordSaved"
  | "accountPasswordSaving"
  | "accountProfile"
  | "accountProfileDirty"
  | "accountProfileError"
  | "accountProfileSaved"
  | "accountProfileSaving"
  | "accountShowCurrentPassword"
  | "accountShowNewPassword"
  | "api"
  | "authUser"
  | "language"
  | "loadSystemSettings"
  | "resetAccountPassword"
  | "setLanguage"
  | "settingsOpen"
  | "settingsTab"
  | "showError"
  | "showToast"
  | "systemTimezone"
  | "t"
>;
export interface Actions {
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
export const settingsActions: Actions = {
  async openSettings(this: Context): Promise<void> {
    this.settingsTab = "general";
    this.accountProfile = { nickname: this.authUser?.nickname || "", email: this.authUser?.email || "" };
    this.accountProfileError = "";
    this.accountProfileSaved = false;
    this.resetAccountPassword();
    this.settingsOpen = true;
    if (this.authUser?.role === "admin") await this.loadSystemSettings();
  },
  async openSettingsTab(this: Context, tab: string): Promise<void> {
    if (tab !== "account") this.resetAccountPassword();
    this.settingsTab = tab;
  },
  accountProfileDirty(this: Context): boolean {
    return (
      this.accountProfile.nickname.trim() !== (this.authUser?.nickname || "") ||
      this.accountProfile.email.trim() !== (this.authUser?.email || "")
    );
  },
  async saveAccountProfile(this: Context): Promise<void> {
    if (this.accountProfileSaving || !this.accountProfileDirty()) return;
    this.accountProfileSaving = true;
    this.accountProfileError = "";
    this.accountProfileSaved = false;
    try {
      this.authUser = await this.api<DTO.User>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          nickname: this.accountProfile.nickname.trim() || null,
          email: this.accountProfile.email.trim() || null,
        }),
      });
      this.accountProfile = { nickname: this.authUser.nickname || "", email: this.authUser.email || "" };
      this.accountProfileSaved = true;
    } catch (cause) {
      const error = asError(cause);
      this.accountProfileError =
        error.status === 422 ? this.t("account.profileInvalid") : error.uiMessage || error.message;
    } finally {
      this.accountProfileSaving = false;
    }
  },
  resetAccountPassword(this: Context): void {
    this.accountPasswordOpen = false;
    this.accountCurrentPassword = "";
    this.accountNewPassword = "";
    this.accountShowCurrentPassword = false;
    this.accountShowNewPassword = false;
    this.accountPasswordErrors = { current: "", new: "", form: "" };
    this.accountPasswordSaved = false;
  },
  openAccountPassword(this: Context): void {
    this.resetAccountPassword();
    this.accountPasswordOpen = true;
    nextTick(() => document.querySelector<HTMLInputElement>('[data-ref="accountCurrentPassword"]')?.focus());
  },
  async saveAccountPassword(this: Context): Promise<void> {
    if (this.accountPasswordSaving) return;
    this.accountPasswordErrors = { current: "", new: "", form: "" };
    this.accountPasswordSaved = false;
    if (!this.accountCurrentPassword) this.accountPasswordErrors.current = this.t("account.currentPasswordRequired");
    const passwordLength = Array.from(this.accountNewPassword).length;
    if (passwordLength < 15 || passwordLength > 200) this.accountPasswordErrors.new = this.t("account.passwordLength");
    if (this.accountPasswordErrors.current || this.accountPasswordErrors.new) return;
    this.accountPasswordSaving = true;
    this.accountShowCurrentPassword = false;
    this.accountShowNewPassword = false;
    try {
      await this.api("/api/users/me/password", {
        method: "POST",
        body: JSON.stringify({
          current_password: this.accountCurrentPassword,
          new_password: this.accountNewPassword,
        }),
      });
      this.resetAccountPassword();
      this.accountPasswordSaved = true;
    } catch (cause) {
      const error = asError(cause);
      if (error.code === "account.currentPasswordIncorrect") {
        this.accountPasswordErrors.current = error.uiMessage;
        this.accountCurrentPassword = "";
        nextTick(() => document.querySelector<HTMLInputElement>('[data-ref="accountCurrentPassword"]')?.focus());
      } else {
        this.accountPasswordErrors.form =
          error.status === 422 ? this.t("account.passwordLength") : error.uiMessage || error.message;
      }
    } finally {
      this.accountPasswordSaving = false;
    }
  },
  async saveLanguage(this: Context): Promise<void> {
    await this.setLanguage(this.language);
  },
  async loadSystemSettings(this: Context): Promise<void> {
    try {
      this.systemTimezone = (await this.api<{ timezone: string }>("/api/settings")).timezone;
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    }
  },
  async saveSystemTimezone(this: Context): Promise<void> {
    try {
      this.systemTimezone = (
        await this.api<{ timezone: string }>("/api/settings/timezone", {
          method: "PATCH",
          body: JSON.stringify({ timezone: this.systemTimezone }),
        })
      ).timezone;
      this.showToast("System timezone updated");
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    }
  },
};
