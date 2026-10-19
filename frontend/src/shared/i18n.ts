import { ApiError, asError } from "./types";
import type { Workspace } from "../app/workspace";

import i18next from "i18next";

import type * as DTO from "./types";

// Explicit dependency contract for this feature; the composition root supplies it.
type Context = Pick<Workspace, "i18nMessages" | "i18nReady" | "language" | "syncDocumentLanguage" | "t">;
export interface Actions {
  initI18n(): Promise<void>;
  t(key: string, options?: Record<string, string | number>): string;
  localizedMessage(message: string): string;
  locale(): string;
  syncDocumentLanguage(): void;
  setLanguage(value: string): Promise<void>;
}
export const i18nActions: Actions = {
  async initI18n(this: Context): Promise<void> {
    try {
      const resources = await Promise.all(
        ["en", "zh-CN"].map(async (locale) => {
          const response = await fetch(`/static/locales/${locale}.json`, { cache: "no-store" });
          if (!response.ok) throw new ApiError(`Unable to load ${locale} translations`);
          return [locale, await response.json()];
        }),
      );
      this.i18nMessages = Object.fromEntries(resources);
      const resourceMap = Object.fromEntries(
        resources.map(([locale, messages]) => [locale, { translation: messages }]),
      );
      if (i18next) {
        await i18next.init({
          lng: this.language,
          fallbackLng: "en",
          resources: resourceMap,
          interpolation: { escapeValue: false },
          returnNull: false,
        });
      }
    } catch (cause) {
      const error = asError(cause);
      console.warn("OMA i18n initialization failed; using English fallback", error);
    }
    this.syncDocumentLanguage();
    this.i18nReady = true;
  },
  t(this: Context, key: string, options: Record<string, string | number> = {}): string {
    void this.i18nReady;
    const fallback = String(options.defaultValue || key);
    const lookup = (messages: DTO.TranslationTree | undefined): string | undefined => {
      let value: string | DTO.TranslationTree | undefined = messages;
      for (const part of key.split(".")) value = typeof value === "object" ? value[part] : undefined;
      return typeof value === "string" ? value : undefined;
    };
    const localMessage = lookup(this.i18nMessages[this.language]) ?? lookup(this.i18nMessages.en);
    if (typeof localMessage === "string") {
      return localMessage.replace(/{{\s*(\w+)\s*}}/g, (_, name) => String(options[name] ?? ""));
    }
    return i18next?.isInitialized ? i18next.t(key, { ...options, defaultValue: fallback }) : fallback;
  },
  localizedMessage(this: Context, message: string): string {
    const exact: Record<string, string> = {
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
    };
    const exactKey = exact[message];
    if (exactKey) return this.t(exactKey, { defaultValue: message });
    const dynamic: [RegExp, string, string[]][] = [
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
        const values = Object.fromEntries(names.map((name, index) => [name, match[index + 1] || ""]));
        if (key === "toasts.userStatus" && this.language === "zh-CN") {
          values.status = values.status === "enabled" ? "启用" : "停用";
        }
        return this.t(key, values);
      }
    }
    return message;
  },
  locale(this: Context): string {
    return this.language === "zh-CN" ? "zh-CN" : "en-US";
  },
  syncDocumentLanguage(this: Context): void {
    document.documentElement.lang = this.language;
    const message = document.getElementById("unsupported-browser-message");
    const close = document.getElementById("unsupported-browser-close");
    if (message) message.textContent = this.t("common.unsupportedBrowser");
    if (close) close.textContent = this.t("common.close");
  },
  async setLanguage(this: Context, value: string): Promise<void> {
    const locale = ["en", "zh-CN"].includes(value) ? value : "en";
    this.language = locale;
    localStorage.setItem("oma-language", locale);
    this.syncDocumentLanguage();
    if (i18next?.isInitialized) await i18next.changeLanguage(locale);
  },
};
