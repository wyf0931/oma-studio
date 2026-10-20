import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";

export type Locale = "zh-CN" | "en";
const storageKey = "oma-landing-locale";

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "zh-CN" || saved === "en") return saved;
  } catch {
    // Storage can be unavailable in private browsing; fall back to browser language.
  }
  return navigator.language.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
}

export function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(storageKey, locale);
  } catch {
    // The current page still switches locale if storage is unavailable.
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: "zh-CN",
  messages: { "zh-CN": zhCN, en },
});
