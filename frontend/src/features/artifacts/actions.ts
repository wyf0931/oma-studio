import { ApiError, asError } from "../../shared/types";
import type { Workspace } from "../../app/workspace";
import { nextTick } from "vue";

import mermaid from "mermaid";

import type * as DTO from "../../shared/types";

// Explicit dependency contract for this feature; the composition root supplies it.
type Context = Pick<
  Workspace,
  | "activeChat"
  | "addUploadSelection"
  | "api"
  | "attachmentCommandDismissed"
  | "attachmentCommandIndex"
  | "attachmentCommandItems"
  | "attachmentCommandMatch"
  | "attachmentCommandVisible"
  | "autopilotAgentFilter"
  | "autopilotAgentId"
  | "autopilotAgentPickerOpen"
  | "autopilotEditAgentPickerOpen"
  | "browserViewUrl"
  | "chatRead"
  | "chooseFileAttachment"
  | "copiedShare"
  | "downloadUrl"
  | "draft"
  | "fileViewer"
  | "fileViewerExpired"
  | "files"
  | "filesLoading"
  | "filesOpen"
  | "filesTab"
  | "inputBrowserViewUrl"
  | "inputFiles"
  | "isAbortError"
  | "libraryAgentFilter"
  | "libraryAgentPickerOpen"
  | "libraryFiles"
  | "libraryLoading"
  | "libraryPage"
  | "libraryPages"
  | "librarySearch"
  | "libraryTotal"
  | "linkDrawerOpen"
  | "loadArtifactShare"
  | "loadAutopilots"
  | "loadChatFiles"
  | "loadLibrary"
  | "loadSharedFiles"
  | "openInternalTab"
  | "opensInNativeBrowser"
  | "pendingArtifacts"
  | "pendingAttachments"
  | "pendingUploads"
  | "removePendingArtifact"
  | "removePendingUpload"
  | "removeUploadSelection"
  | "renderMermaidDiagrams"
  | "request"
  | "resetUploadDragState"
  | "responseData"
  | "shareStep"
  | "shareTarget"
  | "shareUrl"
  | "sharedMode"
  | "sharedToken"
  | "sharingViewedFile"
  | "showError"
  | "t"
  | "theme"
  | "uploadDragActive"
  | "uploadDragDepth"
  | "uploadLimits"
  | "uploadSelection"
  | "uploadingFiles"
>;
export interface Actions {
  toggleFiles(): Promise<void>;
  refreshOpenFiles(chatId?: string | undefined): Promise<void>;
  loadSharedFiles(): Promise<void>;
  loadChatFiles(): Promise<void>;
  loadLibrary(page?: number): Promise<void>;
  selectLibraryAgent(agentId: string): void;
  selectAutopilotAgent(agentId: string): void;
  selectAutopilotEditAgent(agentId: string): void;
  statusLabel(status: string): string;
  openFile(file: DTO.Artifact): void;
  displayedFiles(): DTO.Artifact[];
  pendingAttachments(): DTO.Attachment[];
  attachmentCommandMatch(): { query: string } | null;
  attachmentCommandItems(): DTO.Artifact[];
  attachmentCommandVisible(): boolean;
  updateAttachmentCommandState(): void;
  handleAttachmentKeydown(event: KeyboardEvent): void;
  chooseFileAttachment(file: DTO.Artifact): void;
  openUploadPicker(): void;
  handleUploadSelection(event: Event): Promise<void>;
  handlePaste(event: ClipboardEvent): void;
  handleUploadDrop(event: DragEvent): Promise<void>;
  handleContentDragEnter(event: DragEvent): void;
  handleContentDragOver(event: DragEvent): void;
  handleContentDragLeave(event: DragEvent): void;
  resetUploadDragState(): void;
  addUploadSelection(selected: File[]): void;
  uploadSelectionTotalBytes(): number;
  removeUploadSelection(file: File, force?: boolean): void;
  formatFileSize(bytes: number): string;
  uploadFiles(chat: DTO.Chat): Promise<DTO.Artifact[]>;
  removePendingAttachment(file: DTO.Attachment): void;
  removePendingUpload(upload: Pick<DTO.Attachment, "id">): Promise<void>;
  removePendingArtifact(artifact: Pick<DTO.Attachment, "path">): void;
  openLibraryFile(file: DTO.Artifact): void;
  openLibraryChat(file: DTO.Artifact): void;
  openInternalTab(url: string): void;
  opensInNativeBrowser(file: Partial<DTO.Artifact>): boolean;
  browserViewUrl(chatId: string, path: string): string;
  inputBrowserViewUrl(chatId: string, path: string): string;
  leaveFileViewer(): void;
  downloadUrl(file: Pick<DTO.Artifact, "chat_id" | "kind" | "path">): string;
  fileViewerDownloadUrl(): string;
  fileViewerDownloadName(): string;
  loadFileViewer(): Promise<void>;
  loadArtifactShare(chatId: string, path: string): Promise<void>;
  shareViewedFile(): Promise<void>;
  renderMermaidDiagrams(): void;
}
export const artifactsActions: Actions = {
  async toggleFiles(this: Context): Promise<void> {
    this.filesOpen = !this.filesOpen;
    if (this.filesOpen) this.linkDrawerOpen = false;
    if (this.filesOpen && this.activeChat) {
      if (this.sharedMode) await this.loadSharedFiles();
      else await this.loadChatFiles();
    }
  },
  async refreshOpenFiles(this: Context, chatId: string | undefined = this.activeChat?.id): Promise<void> {
    if (!this.filesOpen || !chatId || this.activeChat?.id !== chatId) return;
    if (this.sharedMode) await this.loadSharedFiles();
    else await this.loadChatFiles();
  },
  async loadSharedFiles(this: Context): Promise<void> {
    this.filesLoading = true;
    try {
      this.files = (await this.api<{ files: DTO.Artifact[] }>(`/api/share/${this.sharedToken}/files`)).files;
      this.inputFiles = [];
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    } finally {
      this.filesLoading = false;
    }
  },
  async loadChatFiles(this: Context): Promise<void> {
    if (!this.activeChat) return;
    this.filesLoading = true;
    try {
      const [outputs, inputs] = await Promise.all([
        this.chatRead<{ files: DTO.Artifact[] }>(`/api/chats/${this.activeChat.id}/files`),
        this.chatRead<{ files: DTO.Artifact[] }>(`/api/chats/${this.activeChat.id}/inputs`),
      ]);
      this.files = outputs.files;
      this.inputFiles = inputs.files;
    } catch (cause) {
      const e = asError(cause);
      if (!this.isAbortError(e)) this.showError(e);
    } finally {
      this.filesLoading = false;
    }
  },
  async loadLibrary(this: Context, page: number = this.libraryPage): Promise<void> {
    this.libraryLoading = true;
    this.libraryPage = Math.max(1, page);
    try {
      const params = new URLSearchParams({
        page: String(this.libraryPage),
        page_size: "20",
      });
      if (this.librarySearch.trim()) params.set("search", this.librarySearch.trim());
      if (this.libraryAgentFilter) params.set("agent_id", this.libraryAgentFilter);
      const data = await this.api<{ files: DTO.Artifact[]; pages: number; total: number }>(
        `/api/library/files?${params}`,
      );
      this.libraryFiles = data.files;
      this.libraryPages = data.pages;
      this.libraryTotal = data.total;
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    } finally {
      this.libraryLoading = false;
    }
  },
  selectLibraryAgent(this: Context, agentId: string): void {
    this.libraryAgentFilter = agentId;
    this.libraryAgentPickerOpen = false;
    this.loadLibrary(1);
  },
  selectAutopilotAgent(this: Context, agentId: string): void {
    this.autopilotAgentFilter = agentId;
    this.autopilotAgentPickerOpen = false;
    this.loadAutopilots();
  },
  selectAutopilotEditAgent(this: Context, agentId: string): void {
    this.autopilotAgentId = agentId;
    this.autopilotEditAgentPickerOpen = false;
  },
  statusLabel(this: Context, status: string): string {
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
    return key ? this.t(key) : status;
  },
  openFile(this: Context, file: DTO.Artifact): void {
    if (!this.activeChat) return;
    const input = file.kind === "input";
    if (this.opensInNativeBrowser(file)) {
      const url = this.sharedMode
        ? `/api/share/${encodeURIComponent(this.sharedToken)}/files/view?path=${encodeURIComponent(file.path)}`
        : input
          ? this.inputBrowserViewUrl(this.activeChat.id, file.path)
          : this.browserViewUrl(this.activeChat.id, file.path);
      this.openInternalTab(url);
      return;
    }
    const query = this.sharedMode
      ? new URLSearchParams({ share: this.sharedToken, path: file.path, from: "chat" })
      : new URLSearchParams({
          chat_id: this.activeChat.id,
          path: file.path,
          from: "chat",
          ...(input ? { kind: "input" } : {}),
        });
    this.openInternalTab(`/file-view?${query.toString()}`);
  },
  displayedFiles(this: Context): DTO.Artifact[] {
    return this.filesTab === "inputs" ? this.inputFiles : this.files;
  },
  pendingAttachments(this: Context): DTO.Attachment[] {
    return [
      ...this.pendingUploads,
      ...this.uploadSelection.map((file) => ({
        _localFile: file,
        id: `local:${file.name}:${file.lastModified}:${file.size}`,
        filename: file.name,
        media_type: file.type || "application/octet-stream",
        size: file.size,
      })),
      ...this.pendingArtifacts,
    ];
  },
  attachmentCommandMatch(this: Context): { query: string } | null {
    if (!this.activeChat || this.sharedMode) return null;
    const match = this.draft.match(/(?:^|\s)@([^\s]*)$/);
    return match ? { query: (match[1] || "").toLowerCase() } : null;
  },
  attachmentCommandItems(this: Context): DTO.Artifact[] {
    const match = this.attachmentCommandMatch();
    if (!match) return [];
    const selectedOutputs = new Set(this.pendingArtifacts.map((file) => file.path));
    const selectedInputs = new Set(this.pendingUploads.map((file) => file.id));
    const candidates = [
      ...this.files.map((file) => ({ ...file, kind: "output" })),
      ...this.inputFiles.map((file) => ({ ...file, kind: "input" })),
    ];
    return candidates
      .filter((file) => (file.kind === "input" ? !selectedInputs.has(file.id) : !selectedOutputs.has(file.path)))
      .filter((file) => file.name.toLowerCase().includes(match.query))
      .slice(0, 8);
  },
  attachmentCommandVisible(this: Context): boolean {
    return (
      Boolean(this.attachmentCommandMatch()) &&
      !this.attachmentCommandDismissed &&
      this.attachmentCommandItems().length > 0
    );
  },
  updateAttachmentCommandState(this: Context): void {
    this.attachmentCommandIndex = 0;
    this.attachmentCommandDismissed = false;
    if (this.attachmentCommandMatch() && !this.filesLoading && !this.files.length && !this.inputFiles.length)
      void this.loadChatFiles();
  },
  handleAttachmentKeydown(this: Context, event: KeyboardEvent): void {
    if (!this.attachmentCommandVisible()) return;
    const items = this.attachmentCommandItems();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.attachmentCommandIndex = (this.attachmentCommandIndex + 1) % items.length;
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      this.attachmentCommandIndex = (this.attachmentCommandIndex - 1 + items.length) % items.length;
    } else if (event.key === "Tab") {
      event.preventDefault();
      this.chooseFileAttachment(items[this.attachmentCommandIndex]!);
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.attachmentCommandDismissed = true;
    }
  },
  chooseFileAttachment(this: Context, file: DTO.Artifact): void {
    if (file.kind === "input") {
      this.pendingUploads.push({
        ...file,
        filename: file.name,
      });
    } else {
      this.pendingArtifacts.push(file);
    }
    this.draft = this.draft.replace(/(?:^|\s)@[^\s]*$/, (value) => (value.startsWith(" ") ? " " : ""));
    this.attachmentCommandIndex = 0;
    this.attachmentCommandDismissed = false;
    nextTick(() => document.getElementById("conversation-message")?.focus());
  },
  openUploadPicker(this: Context): void {
    if (!this.uploadingFiles) document.querySelector<HTMLInputElement>('[data-ref="uploadInput"]')?.click();
  },
  async handleUploadSelection(this: Context, event: Event): Promise<void> {
    if (!(event.target instanceof HTMLInputElement)) return;
    const selected = [...(event.target.files || [])];
    event.target.value = "";
    this.addUploadSelection(selected);
  },
  handlePaste(this: Context, event: ClipboardEvent): void {
    if (this.uploadingFiles) return;
    const items = [...(event.clipboardData?.items || [])];
    const images = items
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    if (!images.length) return;
    event.preventDefault();
    this.addUploadSelection(images);
  },
  async handleUploadDrop(this: Context, event: DragEvent): Promise<void> {
    this.resetUploadDragState();
    if (this.uploadingFiles) return;
    this.addUploadSelection([...(event.dataTransfer?.files || [])]);
  },
  handleContentDragEnter(this: Context, event: DragEvent): void {
    if (this.uploadingFiles || !event.dataTransfer?.types?.includes("Files")) return;
    this.uploadDragDepth += 1;
    this.uploadDragActive = true;
  },
  handleContentDragOver(this: Context, event: DragEvent): void {
    if (!this.uploadingFiles && event.dataTransfer?.types?.includes("Files")) this.uploadDragActive = true;
  },
  handleContentDragLeave(this: Context, event: DragEvent): void {
    if (
      event.currentTarget instanceof Element &&
      (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget))
    )
      this.resetUploadDragState();
  },
  resetUploadDragState(this: Context): void {
    this.uploadDragDepth = 0;
    this.uploadDragActive = false;
  },
  addUploadSelection(this: Context, selected: File[]): void {
    if (!selected.length || this.uploadingFiles) return;
    const maxFiles = Number(this.uploadLimits.max_files) || 100;
    const maxBytes = Number(this.uploadLimits.max_bytes) || 100 * 1024 * 1024;
    const currentFiles = this.pendingUploads.length + this.pendingArtifacts.length + this.uploadSelection.length;
    const availableFiles = maxFiles - currentFiles;
    if (selected.length > availableFiles) {
      this.showError(new ApiError(`You can attach at most ${maxFiles} files to one message`));
    }
    let availableBytes =
      maxBytes - this.pendingAttachments().reduce((total, file) => total + (Number(file.size) || 0), 0);
    const files = [];
    for (const file of selected.slice(0, Math.max(0, availableFiles))) {
      if (file.size > availableBytes) {
        this.showError(new ApiError(`Selected files exceed the ${Math.ceil(maxBytes / 1024 / 1024)} MiB upload limit`));
        break;
      }
      files.push(file);
      availableBytes -= file.size;
    }
    this.uploadSelection.push(...files);
  },
  uploadSelectionTotalBytes(this: Context): number {
    return this.uploadSelection.reduce((total, file) => total + (Number(file.size) || 0), 0);
  },
  removeUploadSelection(this: Context, file: File, force: boolean = false): void {
    if (force || !this.uploadingFiles) {
      this.uploadSelection = this.uploadSelection.filter((item) => item !== file);
    }
  },
  formatFileSize(this: Context, bytes: number): string {
    const size = Number(bytes) || 0;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  },
  async uploadFiles(this: Context, chat: DTO.Chat): Promise<DTO.Artifact[]> {
    if (!this.uploadSelection.length) return [];
    if (this.uploadingFiles) return [];
    this.uploadingFiles = true;
    const uploaded = [];
    try {
      for (const file of [...this.uploadSelection]) {
        const requestPath = `/api/chats/${chat.id}/uploads`;
        const { response, requestId } = await this.request(requestPath, {
          method: "POST",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
            "X-Upload-Filename": encodeURIComponent(file.name),
          },
          body: file,
        });
        const { data } = await this.responseData<DTO.Artifact>(response, requestId, requestPath);
        this.pendingUploads.push(data);
        uploaded.push(data);
        this.removeUploadSelection(file, true);
      }
      return uploaded;
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
      throw error;
    } finally {
      this.uploadingFiles = false;
    }
  },
  removePendingAttachment(this: Context, file: DTO.Attachment): void {
    if (file._localFile) return this.removeUploadSelection(file._localFile);
    if (file.filename) return void this.removePendingUpload(file);
    this.removePendingArtifact(file);
  },
  async removePendingUpload(this: Context, upload: Pick<DTO.Attachment, "id">): Promise<void> {
    const chat = this.activeChat;
    if (!chat) return;
    try {
      await this.api(`/api/chats/${chat.id}/uploads/${upload.id}`, { method: "DELETE" });
      this.pendingUploads = this.pendingUploads.filter((item) => item.id !== upload.id);
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    }
  },
  removePendingArtifact(this: Context, artifact: Pick<DTO.Attachment, "path">): void {
    this.pendingArtifacts = this.pendingArtifacts.filter((item) => item.path !== artifact.path);
  },
  openLibraryFile(this: Context, file: DTO.Artifact): void {
    if (this.opensInNativeBrowser(file)) {
      this.openInternalTab(this.browserViewUrl(file.chat_id || "", file.path));
      return;
    }
    const query = new URLSearchParams({
      chat_id: file.chat_id || "",
      path: file.path,
      from: "library",
    });
    this.openInternalTab(`/file-view?${query.toString()}`);
  },
  openLibraryChat(this: Context, file: DTO.Artifact): void {
    this.openInternalTab(`/chat/${encodeURIComponent(file.chat_id || "")}`);
  },
  openInternalTab(this: Context, url: string): void {
    if (typeof url !== "string" || !url.startsWith("/")) return;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  },
  opensInNativeBrowser(this: Context, file: Partial<DTO.Artifact>): boolean {
    return ["avif", "bmp", "gif", "htm", "html", "ico", "jpeg", "jpg", "pdf", "png", "svg", "webp"].includes(
      String(file?.extension || "").toLowerCase(),
    );
  },
  browserViewUrl(this: Context, chatId: string, path: string): string {
    return `/api/chats/${encodeURIComponent(chatId || "")}/files/view?path=${encodeURIComponent(path)}`;
  },
  inputBrowserViewUrl(this: Context, chatId: string, path: string): string {
    return `/api/chats/${encodeURIComponent(chatId || "")}/inputs/view?path=${encodeURIComponent(path)}`;
  },
  leaveFileViewer(this: Context): void {
    const params = new URLSearchParams(location.search);
    if (document.referrer.startsWith(location.origin) && history.length > 1) {
      history.back();
    } else if (params.get("from") === "chat" && params.get("chat_id")) {
      location.assign(`/chat/${encodeURIComponent(params.get("chat_id") || "")}`);
    } else {
      location.assign("/library");
    }
  },
  downloadUrl(this: Context, file: Pick<DTO.Artifact, "chat_id" | "kind" | "path">): string {
    const resource = file.kind === "input" ? "inputs" : "files";
    return `/api/chats/${encodeURIComponent(file.chat_id || "")}/${resource}/download?path=${encodeURIComponent(file.path)}`;
  },
  fileViewerDownloadUrl(this: Context): string {
    const viewer = this.fileViewer;
    if (!viewer || viewer.isShared) return "";
    return this.downloadUrl({
      chat_id: viewer.chatId,
      kind: viewer.kind,
      path: viewer.path,
    });
  },
  fileViewerDownloadName(this: Context): string {
    return (
      String(this.fileViewer?.path || "")
        .split("/")
        .pop() || "file"
    );
  },
  async loadFileViewer(this: Context): Promise<void> {
    const params = new URLSearchParams(location.search);
    const share = params.get("share");
    const chatId = params.get("chat_id");
    const path = params.get("path");
    this.fileViewer = null;
    this.fileViewerExpired = false;
    if ((!chatId && !share) || !path) {
      if (share) {
        this.fileViewerExpired = true;
        document.title = this.t("share.linkExpiredTitle");
        return;
      }
      this.showError(new ApiError("File reference is incomplete"));
      return;
    }
    try {
      const data = share
        ? await this.api<{ content: string }>(
            `/api/share/${encodeURIComponent(share || "")}/files/content?path=${encodeURIComponent(path)}`,
          )
        : await this.api<{ content: string }>(
            `/api/chats/${encodeURIComponent(chatId || "")}/${params.get("kind") === "input" ? "inputs" : "files"}/content?path=${encodeURIComponent(path)}`,
          );
      this.fileViewer = {
        chatId: chatId || `share:${share}`,
        kind: params.get("kind") === "input" ? "input" : "file",
        isShared: Boolean(share),
        canManageShare: Boolean(
          chatId &&
          !share &&
          params.get("kind") !== "input" &&
          ["md", "markdown"].includes(path.split(".").pop()?.toLowerCase() || ""),
        ),
        artifactShare: null,
        path,
        content: data.content,
      };
      if (this.fileViewer.canManageShare) await this.loadArtifactShare(chatId || "", path);
      document.title = path.split("/").pop() || "File";
      setTimeout(() => this.renderMermaidDiagrams(), 0);
    } catch (cause) {
      const error = asError(cause);
      if (share && error.status === 404) {
        this.fileViewer = null;
        this.fileViewerExpired = true;
        document.title = this.t("share.linkExpiredTitle");
      } else {
        this.showError(error);
      }
    }
  },
  async loadArtifactShare(this: Context, chatId: string, path: string): Promise<void> {
    try {
      this.fileViewer!.artifactShare = await this.api<DTO.Share>(
        `/api/chats/${encodeURIComponent(chatId || "")}/artifact-shares?path=${encodeURIComponent(path)}`,
      );
      this.fileViewer!.artifactShare!.kind = "artifact";
    } catch (cause) {
      const error = asError(cause);
      if (error.status !== 404) this.showError(error);
    }
  },
  async shareViewedFile(this: Context): Promise<void> {
    const params = new URLSearchParams(location.search);
    const chatId = params.get("chat_id");
    const path = this.fileViewer?.path;
    if (!chatId || !path || this.sharingViewedFile) return;
    this.sharingViewedFile = true;
    try {
      const data = await this.api<DTO.Share>(
        `/api/chats/${encodeURIComponent(chatId || "")}/artifact-shares?path=${encodeURIComponent(path)}`,
        {
          method: "POST",
        },
      );
      this.fileViewer!.artifactShare = {
        ...data,
        kind: "artifact",
        title: this.activeChat?.title || "",
      };
      this.shareTarget = "artifact";
      this.shareUrl = `${location.origin}${data.url}`;
      this.shareStep = "created";
      this.copiedShare = false;
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    } finally {
      this.sharingViewedFile = false;
    }
  },
  renderMermaidDiagrams(this: Context): void {
    if (!mermaid) return;
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: this.theme === "dark" ? "dark" : "default",
      });
      mermaid.run({
        nodes: [...document.querySelectorAll<HTMLElement>(".file-markdown .mermaid")],
      });
    } catch {}
  },
};
