import type { Actions as I18nActions } from "./i18n";

export interface Actions {
  formatBytes(bytes: number): string;
  formatDateTime(value: string | undefined | null): string;
  initials(name: string): string;
  relativeTime(value: string): string;
  formatDate(value: string | undefined | null): string;
  statusLabel(status: string): string;
  escape(text: string): string;
  formatCompactNumber(value: unknown): string;
  resourceCountLabel(count: number): string;
  fileCountLabel(count: number): string;
}
export type Feature = Actions;
export interface Dependencies {
  i18n: Pick<I18nActions, "locale" | "t">;
}
export function createFormat(deps: Dependencies): Feature {
  function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  function formatDateTime(value: string | undefined | null): string {
    return value
      ? new Date(value).toLocaleString(undefined, {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  }
  function initials(name: string): string {
    return name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  function relativeTime(value: string): string {
    if (!value) return "";
    const diff = Date.now() - Date.parse(value);
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return new Date(value).toLocaleDateString(deps.i18n.locale(), {
      month: "short",
      day: "numeric",
    });
  }
  function formatDate(value: string | undefined | null): string {
    return value
      ? new Date(value).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";
  }
  function statusLabel(status: string): string {
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
    return key ? deps.i18n.t(key) : status;
  }
  function escape(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  function formatCompactNumber(value: unknown): string {
    const number = Number(value) || 0;
    if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
    if (number >= 1000) return `${(number / 1000).toFixed(1)}k`;
    return String(Math.round(number));
  }
  function resourceCountLabel(count: number): string {
    return deps.i18n.t("chat.resourceCount", { count });
  }
  function fileCountLabel(count: number): string {
    return deps.i18n.t("chat.fileCount", { count });
  }
  return {
    formatBytes,
    formatDateTime,
    initials,
    relativeTime,
    formatDate,
    statusLabel,
    escape,
    formatCompactNumber,
    resourceCountLabel,
    fileCountLabel,
  };
}
