import type { Page } from "../shared/types";
export function createAppState() {
  return {
    healthTimer: null as ReturnType<typeof setInterval> | null,
    cleanups: [] as (() => void)[],
    runError: "",
    mobileSidebarOpen: false,
    page: "chat" as Page,
    sidebarCollapsed: false,
    activeProcesses: 0,
    toastMessage: "",
    toastKind: "success",
    error: "",
    mode: ["development", "production"].includes(new URLSearchParams(location.search).get("mode") || "production")
      ? new URLSearchParams(location.search).get("mode") || "production"
      : "production",
    appReady: false,
  };
}
