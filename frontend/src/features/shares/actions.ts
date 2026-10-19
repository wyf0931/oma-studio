import { asError } from "../../shared/types";
import type { Workspace } from "../../app/workspace";

import { writeClipboardText } from "../../browser";

import type * as DTO from "../../shared/types";

// Explicit dependency contract for this feature; the composition root supplies it.
type Context = Pick<
  Workspace,
  | "activeChat"
  | "api"
  | "authUser"
  | "copiedShare"
  | "creatingShare"
  | "fileViewer"
  | "messages"
  | "messagesLoading"
  | "normalizeMessages"
  | "page"
  | "resetShare"
  | "scrollMessagesToLatest"
  | "shareMode"
  | "shareRecords"
  | "shareRecordsLoading"
  | "shareRevokeTarget"
  | "shareRevoking"
  | "shareStep"
  | "shareTarget"
  | "shareUrl"
  | "sharedCanManage"
  | "sharedMode"
  | "sharedToken"
  | "showError"
  | "showToast"
  | "t"
>;
export interface Actions {
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
export const sharesActions: Actions = {
  async loadShareRecords(this: Context): Promise<void> {
    this.shareRecordsLoading = true;
    try {
      this.shareRecords = (await this.api<{ shares: DTO.Share[] }>("/api/shares")).shares || [];
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    } finally {
      this.shareRecordsLoading = false;
    }
  },
  shareRecordTitle(this: Context, share: DTO.Share): string {
    if (share.kind === "artifact") return String(share.path || "");
    const title = String(share.title || "");
    return [...title].length > 20 ? `${[...title].slice(0, 20).join("")}…` : title;
  },
  shareRecordUrl(this: Context, share: DTO.Share): string {
    return share.url || `/share/${encodeURIComponent(share.token || "")}`;
  },
  requestRevokeShare(this: Context, share: Pick<DTO.Share, "token" | "kind">): void {
    this.shareRevokeTarget = share;
  },
  async confirmRevokeShare(this: Context): Promise<void> {
    const share = this.shareRevokeTarget;
    if (!share || this.shareRevoking) return;
    const viewingRevokedShare = this.sharedMode && share.token === this.sharedToken;
    this.shareRevoking = true;
    try {
      await this.api(`/api/shares/${encodeURIComponent(share.token)}`, { method: "DELETE" });
      this.shareRecords = this.shareRecords.filter((item) => item.token !== share.token);
      if (this.fileViewer?.artifactShare?.token === share.token) this.fileViewer.artifactShare = null;
      if (this.shareUrl.endsWith(`/share/${share.token}`) || this.shareUrl.includes(`share=${share.token}&`)) {
        this.resetShare();
      }
      this.shareRevokeTarget = null;
      this.showToast(this.t("share.revoked"));
      // The page the owner is looking at no longer has a public link.
      if (viewingRevokedShare) location.assign("/");
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    } finally {
      this.shareRevoking = false;
    }
  },
  async startShare(this: Context): Promise<void> {
    if (!this.activeChat || this.sharedMode) return;
    try {
      this.shareTarget = "session";
      const data = await this.api<DTO.Share>(`/api/chats/${this.activeChat.id}/share`);
      this.shareUrl = `${location.origin}${data.url}`;
      this.shareStep = "created";
    } catch (cause) {
      const error = asError(cause);
      if (error.status === 404) this.shareMode = true;
      else this.showError(error);
    }
  },
  async openSharedChat(this: Context, token: string): Promise<void> {
    this.sharedToken = token;
    this.sharedMode = true;
    this.sharedCanManage = false;
    this.page = "chat";
    this.messagesLoading = true;
    try {
      const data = await this.api<{ can_manage: boolean; chat: DTO.Chat; messages: DTO.Message[] }>(
        `/api/share/${encodeURIComponent(token)}`,
      );
      // Only the account that owns the link may revoke it from this page.
      this.sharedCanManage = Boolean(data.can_manage);
      this.activeChat = {
        ...(data.chat || {}),
        id: `share:${token}`,
        status: "ready",
      };
      this.messages = this.normalizeMessages(data.messages || []);
      this.scrollMessagesToLatest();
      document.title = `${this.activeChat.title || "Shared conversation"} · OMA studio`;
    } catch (cause) {
      const e = asError(cause);
      this.activeChat = null;
      this.messages = [];
      if (e.status === 404) {
        // Revoked or unknown link: there is no public content to show, so an
        // anonymous visitor belongs on the sign-in screen instead of an empty
        // workspace, and a signed-in visitor goes back to their own chats.
        if (this.authUser) {
          this.showToast(this.t("share.linkExpiredTitle"));
          location.assign("/");
        } else {
          this.sharedMode = false;
          history.replaceState({}, "", "/");
        }
      } else {
        this.showError(e);
      }
    } finally {
      this.messagesLoading = false;
    }
  },
  cancelShare(this: Context): void {
    this.shareMode = false;
  },
  closeShareDialog(this: Context): void {
    this.shareStep = null;
    this.copiedShare = false;
  },
  resetShare(this: Context): void {
    this.shareMode = false;
    this.shareStep = null;
    this.shareUrl = "";
    this.copiedShare = false;
    this.shareTarget = "session";
    this.sharedCanManage = false;
  },
  async createShare(this: Context): Promise<void> {
    if (!this.activeChat || this.creatingShare) return;
    this.creatingShare = true;
    try {
      this.shareTarget = "session";
      const data = await this.api<DTO.Share>(`/api/chats/${this.activeChat.id}/share`, {
        method: "POST",
      });
      this.shareUrl = `${location.origin}/share/${data.token}`;
      this.shareStep = "created";
      try {
        await writeClipboardText(this.shareUrl);
      } catch {}
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    } finally {
      this.creatingShare = false;
    }
  },
  async copyShareLink(this: Context): Promise<void> {
    if (!this.shareUrl) return;
    try {
      await writeClipboardText(this.shareUrl);
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
      return;
    }
    this.copiedShare = true;
    setTimeout(() => {
      this.copiedShare = false;
    }, 1500);
  },
};
