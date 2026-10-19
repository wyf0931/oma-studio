import type { Actions as ChatActions, State as ChatState } from "../chat/actions";
import type { State as IdentityState } from "../identity/actions";
import type { Actions as ApiActions } from "../../shared/api";
import type { Actions as ShellActions } from "../../app/actions";
import type { Actions as ArtifactsActions } from "../artifacts/actions";
import type { Actions as I18nActions } from "../../shared/i18n";
import type { Actions as PresentationActions } from "../chat/presentation";
import type { Actions as DomActions } from "../../shared/dom";
import { unwrap } from "../../shared/api";
import { reactive } from "vue";
import type * as DTO from "../../shared/types";
import { asError } from "../../shared/types";
import { writeClipboardText } from "../../browser";

import { createSharesState } from "./state";
export type State = ReturnType<typeof createSharesState>;
export interface Actions {
  openShareRecords(): Promise<void>;
  showCreatedLink(url: string, target: string): void;
  loadShareRecords(): Promise<void>;
  shareRecordTitle(share: DTO.Share): string;
  shareRecordUrl(share: DTO.Share): string;
  requestRevokeShare(share: Pick<DTO.Share, "token" | "kind">): void;
  confirmRevokeShare(): Promise<void>;
  startShare(): Promise<void>;
  openSharedChat(token: string): Promise<void>;
  cancelShare(): void;
  closeShareDialog(): void;
  resetShare(): void;
  createShare(): Promise<void>;
  copyShareLink(): Promise<void>;
}
export interface Feature extends Actions {
  state: State;
}
export interface Dependencies {
  chat: Pick<ChatActions, "setMessagesLoading" | "setSharedConversation"> & {
    state: Readonly<Pick<ChatState, "activeChat">>;
  };
  identity: { state: Readonly<Pick<IdentityState, "authUser">> };
  api: Pick<ApiActions, "client">;
  shell: Pick<ShellActions, "showError" | "showPage" | "showToast">;
  artifacts: Pick<ArtifactsActions, "clearFileShare">;
  i18n: Pick<I18nActions, "t">;
  presentation: Pick<PresentationActions, "normalizeMessages">;
  dom: Pick<DomActions, "scrollMessagesToLatest">;
}
export function createShares(deps: Dependencies): Feature {
  const state = reactive(createSharesState());
  async function loadShareRecords(): Promise<void> {
    state.shareRecordsLoading = true;
    try {
      state.shareRecords = unwrap(await deps.api.client.GET("/api/shares")).shares || [];
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    } finally {
      state.shareRecordsLoading = false;
    }
  }
  function shareRecordTitle(share: DTO.Share): string {
    if (share.kind === "artifact") return String(share.path || "");
    const title = String(share.title || "");
    return [...title].length > 20 ? `${[...title].slice(0, 20).join("")}…` : title;
  }
  function shareRecordUrl(share: DTO.Share): string {
    return share.url || `/share/${encodeURIComponent(share.token || "")}`;
  }
  function requestRevokeShare(share: Pick<DTO.Share, "token" | "kind">): void {
    state.shareRevokeTarget = share;
  }
  async function confirmRevokeShare(): Promise<void> {
    const share = state.shareRevokeTarget;
    if (!share || state.shareRevoking) return;
    const viewingRevokedShare = state.sharedMode && share.token === state.sharedToken;
    state.shareRevoking = true;
    try {
      unwrap(await deps.api.client.DELETE("/api/shares/{token}", { params: { path: { token: share.token } } }));
      state.shareRecords = state.shareRecords.filter((item) => item.token !== share.token);
      deps.artifacts.clearFileShare(share.token);
      if (state.shareUrl.endsWith(`/share/${share.token}`) || state.shareUrl.includes(`share=${share.token}&`)) {
        resetShare();
      }
      state.shareRevokeTarget = null;
      deps.shell.showToast(deps.i18n.t("share.revoked"));
      // The page the owner is looking at no longer has a public link.
      if (viewingRevokedShare) location.assign("/");
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    } finally {
      state.shareRevoking = false;
    }
  }
  async function startShare(): Promise<void> {
    if (!deps.chat.state.activeChat || state.sharedMode) return;
    try {
      state.shareTarget = "session";
      const data = unwrap(
        await deps.api.client.GET("/api/chats/{chat_id}/share", {
          params: { path: { chat_id: deps.chat.state.activeChat.id } },
        }),
      );
      state.shareUrl = `${location.origin}${data.url}`;
      state.shareStep = "created";
    } catch (cause) {
      const error = asError(cause);
      if (error.status === 404) state.shareMode = true;
      else deps.shell.showError(error);
    }
  }
  async function openSharedChat(token: string): Promise<void> {
    state.sharedToken = token;
    state.sharedMode = true;
    state.sharedCanManage = false;
    deps.shell.showPage("chat");
    deps.chat.setMessagesLoading(true);
    try {
      const data = unwrap(await deps.api.client.GET("/api/share/{token}", { params: { path: { token: token } } }));
      // Only the account that owns the link may revoke it from this page.
      state.sharedCanManage = Boolean(data.can_manage);
      deps.chat.setSharedConversation(
        {
          id: `share:${token}`,
          status: "ready",
          title: data.chat.title || "Shared conversation",
          agent_id: data.chat.agent_id || "",
          created_at: data.chat.created_at || "",
          updated_at: data.chat.updated_at || "",
        },
        deps.presentation.normalizeMessages(data.messages || []),
      );
      deps.dom.scrollMessagesToLatest();
      document.title = `${deps.chat.state.activeChat?.title || "Shared conversation"} · OMA studio`;
    } catch (cause) {
      const e = asError(cause);
      deps.chat.setSharedConversation(null, []);
      if (e.status === 404) {
        // Revoked or unknown link: there is no public content to show, so an
        // anonymous visitor belongs on the sign-in screen instead of an empty
        // workspace, and a signed-in visitor goes back to their own chats.
        if (deps.identity.state.authUser) {
          deps.shell.showToast(deps.i18n.t("share.linkExpiredTitle"));
          location.assign("/");
        } else {
          state.sharedMode = false;
          history.replaceState({}, "", "/");
        }
      } else {
        deps.shell.showError(e);
      }
    } finally {
      deps.chat.setMessagesLoading(false);
    }
  }
  function cancelShare(): void {
    state.shareMode = false;
  }
  function closeShareDialog(): void {
    state.shareStep = null;
    state.copiedShare = false;
  }
  function resetShare(): void {
    state.shareMode = false;
    state.shareStep = null;
    state.shareUrl = "";
    state.copiedShare = false;
    state.shareTarget = "session";
    state.sharedCanManage = false;
  }
  async function createShare(): Promise<void> {
    if (!deps.chat.state.activeChat || state.creatingShare) return;
    state.creatingShare = true;
    try {
      state.shareTarget = "session";
      const data = unwrap(
        await deps.api.client.POST("/api/chats/{chat_id}/share", {
          params: { path: { chat_id: deps.chat.state.activeChat.id } },
        }),
      );
      state.shareUrl = `${location.origin}/share/${data.token}`;
      state.shareStep = "created";
      try {
        await writeClipboardText(state.shareUrl);
      } catch {}
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    } finally {
      state.creatingShare = false;
    }
  }
  async function copyShareLink(): Promise<void> {
    if (!state.shareUrl) return;
    try {
      await writeClipboardText(state.shareUrl);
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
      return;
    }
    state.copiedShare = true;
    setTimeout(() => {
      state.copiedShare = false;
    }, 1500);
  }
  async function openShareRecords(): Promise<void> {
    state.shareRecordsOpen = true;
    await loadShareRecords();
  }
  function showCreatedLink(url: string, target: string): void {
    state.shareUrl = url;
    state.shareTarget = target;
    state.shareStep = "created";
    state.copiedShare = false;
  }
  return {
    state,
    loadShareRecords,
    shareRecordTitle,
    shareRecordUrl,
    requestRevokeShare,
    confirmRevokeShare,
    startShare,
    openSharedChat,
    cancelShare,
    closeShareDialog,
    resetShare,
    createShare,
    copyShareLink,
    openShareRecords,
    showCreatedLink,
  };
}
