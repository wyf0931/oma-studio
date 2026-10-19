import type { Workspace } from "../app/workspace";

// Explicit dependency contract for this feature; the composition root supplies it.
type Context = Pick<Workspace, "locale">;
export interface Actions {
  formatBytes(bytes: number): string;
  formatDateTime(value: string | undefined | null): string;
  initials(name: string): string;
  relativeTime(value: string): string;
  formatDate(value: string | undefined | null): string;
}
export const formatActions: Actions = {
  formatBytes(this: Context, bytes: number): string {
    if (!Number.isFinite(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },
  formatDateTime(this: Context, value: string | undefined | null): string {
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
  initials(this: Context, name: string): string {
    return name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  },
  relativeTime(this: Context, value: string): string {
    if (!value) return "";
    const diff = Date.now() - Date.parse(value);
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return new Date(value).toLocaleDateString(this.locale(), {
      month: "short",
      day: "numeric",
    });
  },
  formatDate(this: Context, value: string | undefined | null): string {
    return value
      ? new Date(value).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";
  },
};
