import type * as DTO from "./types";
export function createI18nState() {
  return {
    language: ["en", "zh-CN"].includes(localStorage.getItem("oma-language") || "en")
      ? localStorage.getItem("oma-language") || "en"
      : "en",
    i18nReady: false,
    i18nMessages: {} as Record<string, DTO.TranslationTree>,
  };
}
