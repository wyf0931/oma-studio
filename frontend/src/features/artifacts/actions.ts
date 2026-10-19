import type { Actions as ChatActions, State as ChatState } from "../chat/actions";
import type { Actions as SharesActions, State as SharesState } from "../shares/actions";
import type { Actions as PresentationActions } from "../chat/presentation";
import type { Actions as ApiActions } from "../../shared/api";
import type { Actions as ShellActions } from "../../app/actions";
import type { Actions as I18nActions } from "../../shared/i18n";
import type { Actions as ContentActions } from "../../shared/content";
import { reactive, nextTick } from "vue";
import type * as DTO from "../../shared/types";
import { ApiError, asError } from "../../shared/types";

import { createArtifactsState } from "./state";
export type State = ReturnType<typeof createArtifactsState>;
export interface Actions {
  closeFiles(): void;
  resetFilePanel(): void;
  clearAttachments(includeLocal?: boolean): void;
  restoreUploads(uploads: DTO.Artifact[]): void;
  clearFileShare(token: string): void;
  toggleFiles(): Promise<void>;
  refreshOpenFiles(chatId?: string | undefined): Promise<void>;
  loadSharedFiles(): Promise<void>;
  loadChatFiles(): Promise<void>;
  loadLibrary(page?: number): Promise<void>;
  selectLibraryAgent(agentId: string): void;
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
  renderFilePreview(): string;
}
export interface Feature extends Actions {
  state: State;
}
export interface Dependencies {
  chat: Pick<ChatActions, "chatRead" | "clearAttachmentCommand" | "isAbortError"> & {
    state: Readonly<Pick<ChatState, "activeChat" | "draft">>;
  };
  shares: Pick<SharesActions, "showCreatedLink"> & { state: Readonly<Pick<SharesState, "sharedMode" | "sharedToken">> };
  presentation: Pick<PresentationActions, "closeLinkDrawer">;
  api: Pick<ApiActions, "api" | "request" | "responseData">;
  shell: Pick<ShellActions, "showError">;
  i18n: Pick<I18nActions, "t">;
  content: Pick<
    ContentActions,
    | "fileExtension"
    | "isCodeFile"
    | "isCsvFile"
    | "renderCodeFile"
    | "renderCsv"
    | "renderMarkdown"
    | "renderMermaidDiagrams"
  >;
}
export function createArtifacts(deps: Dependencies): Feature {
  const state = reactive(createArtifactsState());
  async function toggleFiles(): Promise<void> {
    state.filesOpen = !state.filesOpen;
    if (state.filesOpen) deps.presentation.closeLinkDrawer();
    if (state.filesOpen && deps.chat.state.activeChat) {
      if (deps.shares.state.sharedMode) await loadSharedFiles();
      else await loadChatFiles();
    }
  }
  async function refreshOpenFiles(chatId: string | undefined = deps.chat.state.activeChat?.id): Promise<void> {
    if (!state.filesOpen || !chatId || deps.chat.state.activeChat?.id !== chatId) return;
    if (deps.shares.state.sharedMode) await loadSharedFiles();
    else await loadChatFiles();
  }
  async function loadSharedFiles(): Promise<void> {
    state.filesLoading = true;
    try {
      state.files = (
        await deps.api.api<{ files: DTO.Artifact[] }>(`/api/share/${deps.shares.state.sharedToken}/files`)
      ).files;
      state.inputFiles = [];
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    } finally {
      state.filesLoading = false;
    }
  }
  async function loadChatFiles(): Promise<void> {
    if (!deps.chat.state.activeChat) return;
    state.filesLoading = true;
    try {
      const [outputs, inputs] = await Promise.all([
        deps.chat.chatRead<{ files: DTO.Artifact[] }>(`/api/chats/${deps.chat.state.activeChat.id}/files`),
        deps.chat.chatRead<{ files: DTO.Artifact[] }>(`/api/chats/${deps.chat.state.activeChat.id}/inputs`),
      ]);
      state.files = outputs.files;
      state.inputFiles = inputs.files;
    } catch (cause) {
      const e = asError(cause);
      if (!deps.chat.isAbortError(e)) deps.shell.showError(e);
    } finally {
      state.filesLoading = false;
    }
  }
  async function loadLibrary(page: number = state.libraryPage): Promise<void> {
    state.libraryLoading = true;
    state.libraryPage = Math.max(1, page);
    try {
      const params = new URLSearchParams({
        page: String(state.libraryPage),
        page_size: "20",
      });
      if (state.librarySearch.trim()) params.set("search", state.librarySearch.trim());
      if (state.libraryAgentFilter) params.set("agent_id", state.libraryAgentFilter);
      const data = await deps.api.api<{ files: DTO.Artifact[]; pages: number; total: number }>(
        `/api/library/files?${params}`,
      );
      state.libraryFiles = data.files;
      state.libraryPages = data.pages;
      state.libraryTotal = data.total;
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    } finally {
      state.libraryLoading = false;
    }
  }
  function selectLibraryAgent(agentId: string): void {
    state.libraryAgentFilter = agentId;
    state.libraryAgentPickerOpen = false;
    loadLibrary(1);
  }
  function openFile(file: DTO.Artifact): void {
    if (!deps.chat.state.activeChat) return;
    const input = file.kind === "input";
    if (opensInNativeBrowser(file)) {
      const url = deps.shares.state.sharedMode
        ? `/api/share/${encodeURIComponent(deps.shares.state.sharedToken)}/files/view?path=${encodeURIComponent(file.path)}`
        : input
          ? inputBrowserViewUrl(deps.chat.state.activeChat.id, file.path)
          : browserViewUrl(deps.chat.state.activeChat.id, file.path);
      openInternalTab(url);
      return;
    }
    const query = deps.shares.state.sharedMode
      ? new URLSearchParams({ share: deps.shares.state.sharedToken, path: file.path, from: "chat" })
      : new URLSearchParams({
          chat_id: deps.chat.state.activeChat.id,
          path: file.path,
          from: "chat",
          ...(input ? { kind: "input" } : {}),
        });
    openInternalTab(`/file-view?${query.toString()}`);
  }
  function displayedFiles(): DTO.Artifact[] {
    return state.filesTab === "inputs" ? state.inputFiles : state.files;
  }
  function pendingAttachments(): DTO.Attachment[] {
    return [
      ...state.pendingUploads,
      ...state.uploadSelection.map((file) => ({
        _localFile: file,
        id: `local:${file.name}:${file.lastModified}:${file.size}`,
        filename: file.name,
        media_type: file.type || "application/octet-stream",
        size: file.size,
      })),
      ...state.pendingArtifacts,
    ];
  }
  function attachmentCommandMatch(): { query: string } | null {
    if (!deps.chat.state.activeChat || deps.shares.state.sharedMode) return null;
    const match = deps.chat.state.draft.match(/(?:^|\s)@([^\s]*)$/);
    return match ? { query: (match[1] || "").toLowerCase() } : null;
  }
  function attachmentCommandItems(): DTO.Artifact[] {
    const match = attachmentCommandMatch();
    if (!match) return [];
    const selectedOutputs = new Set(state.pendingArtifacts.map((file) => file.path));
    const selectedInputs = new Set(state.pendingUploads.map((file) => file.id));
    const candidates = [
      ...state.files.map((file) => ({ ...file, kind: "output" })),
      ...state.inputFiles.map((file) => ({ ...file, kind: "input" })),
    ];
    return candidates
      .filter((file) => (file.kind === "input" ? !selectedInputs.has(file.id) : !selectedOutputs.has(file.path)))
      .filter((file) => file.name.toLowerCase().includes(match.query))
      .slice(0, 8);
  }
  function attachmentCommandVisible(): boolean {
    return (
      Boolean(attachmentCommandMatch()) && !state.attachmentCommandDismissed && attachmentCommandItems().length > 0
    );
  }
  function updateAttachmentCommandState(): void {
    state.attachmentCommandIndex = 0;
    state.attachmentCommandDismissed = false;
    if (attachmentCommandMatch() && !state.filesLoading && !state.files.length && !state.inputFiles.length)
      void loadChatFiles();
  }
  function handleAttachmentKeydown(event: KeyboardEvent): void {
    if (!attachmentCommandVisible()) return;
    const items = attachmentCommandItems();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      state.attachmentCommandIndex = (state.attachmentCommandIndex + 1) % items.length;
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      state.attachmentCommandIndex = (state.attachmentCommandIndex - 1 + items.length) % items.length;
    } else if (event.key === "Tab") {
      event.preventDefault();
      chooseFileAttachment(items[state.attachmentCommandIndex]!);
    } else if (event.key === "Escape") {
      event.preventDefault();
      state.attachmentCommandDismissed = true;
    }
  }
  function chooseFileAttachment(file: DTO.Artifact): void {
    if (file.kind === "input") {
      state.pendingUploads.push({
        ...file,
        filename: file.name,
      });
    } else {
      state.pendingArtifacts.push(file);
    }
    deps.chat.clearAttachmentCommand();
    state.attachmentCommandIndex = 0;
    state.attachmentCommandDismissed = false;
    nextTick(() => document.getElementById("conversation-message")?.focus());
  }
  function openUploadPicker(): void {
    if (!state.uploadingFiles) document.querySelector<HTMLInputElement>('[data-ref="uploadInput"]')?.click();
  }
  async function handleUploadSelection(event: Event): Promise<void> {
    if (!(event.target instanceof HTMLInputElement)) return;
    const selected = [...(event.target.files || [])];
    event.target.value = "";
    addUploadSelection(selected);
  }
  function handlePaste(event: ClipboardEvent): void {
    if (state.uploadingFiles) return;
    const items = [...(event.clipboardData?.items || [])];
    const images = items
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    if (!images.length) return;
    event.preventDefault();
    addUploadSelection(images);
  }
  async function handleUploadDrop(event: DragEvent): Promise<void> {
    resetUploadDragState();
    if (state.uploadingFiles) return;
    addUploadSelection([...(event.dataTransfer?.files || [])]);
  }
  function handleContentDragEnter(event: DragEvent): void {
    if (state.uploadingFiles || !event.dataTransfer?.types?.includes("Files")) return;
    state.uploadDragDepth += 1;
    state.uploadDragActive = true;
  }
  function handleContentDragOver(event: DragEvent): void {
    if (!state.uploadingFiles && event.dataTransfer?.types?.includes("Files")) state.uploadDragActive = true;
  }
  function handleContentDragLeave(event: DragEvent): void {
    if (
      event.currentTarget instanceof Element &&
      (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget))
    )
      resetUploadDragState();
  }
  function resetUploadDragState(): void {
    state.uploadDragDepth = 0;
    state.uploadDragActive = false;
  }
  function addUploadSelection(selected: File[]): void {
    if (!selected.length || state.uploadingFiles) return;
    const maxFiles = Number(state.uploadLimits.max_files) || 100;
    const maxBytes = Number(state.uploadLimits.max_bytes) || 100 * 1024 * 1024;
    const currentFiles = state.pendingUploads.length + state.pendingArtifacts.length + state.uploadSelection.length;
    const availableFiles = maxFiles - currentFiles;
    if (selected.length > availableFiles) {
      deps.shell.showError(new ApiError(`You can attach at most ${maxFiles} files to one message`));
    }
    let availableBytes = maxBytes - pendingAttachments().reduce((total, file) => total + (Number(file.size) || 0), 0);
    const files = [];
    for (const file of selected.slice(0, Math.max(0, availableFiles))) {
      if (file.size > availableBytes) {
        deps.shell.showError(
          new ApiError(`Selected files exceed the ${Math.ceil(maxBytes / 1024 / 1024)} MiB upload limit`),
        );
        break;
      }
      files.push(file);
      availableBytes -= file.size;
    }
    state.uploadSelection.push(...files);
  }
  function uploadSelectionTotalBytes(): number {
    return state.uploadSelection.reduce((total, file) => total + (Number(file.size) || 0), 0);
  }
  function removeUploadSelection(file: File, force: boolean = false): void {
    if (force || !state.uploadingFiles) {
      state.uploadSelection = state.uploadSelection.filter((item) => item !== file);
    }
  }
  function formatFileSize(bytes: number): string {
    const size = Number(bytes) || 0;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  async function uploadFiles(chat: DTO.Chat): Promise<DTO.Artifact[]> {
    if (!state.uploadSelection.length) return [];
    if (state.uploadingFiles) return [];
    state.uploadingFiles = true;
    const uploaded = [];
    try {
      for (const file of [...state.uploadSelection]) {
        const requestPath = `/api/chats/${chat.id}/uploads`;
        const { response, requestId } = await deps.api.request(requestPath, {
          method: "POST",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
            "X-Upload-Filename": encodeURIComponent(file.name),
          },
          body: file,
        });
        const { data } = await deps.api.responseData<DTO.Artifact>(response, requestId, requestPath);
        state.pendingUploads.push(data);
        uploaded.push(data);
        removeUploadSelection(file, true);
      }
      return uploaded;
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
      throw error;
    } finally {
      state.uploadingFiles = false;
    }
  }
  function removePendingAttachment(file: DTO.Attachment): void {
    if (file._localFile) return removeUploadSelection(file._localFile);
    if (file.filename) return void removePendingUpload(file);
    removePendingArtifact(file);
  }
  async function removePendingUpload(upload: Pick<DTO.Attachment, "id">): Promise<void> {
    const chat = deps.chat.state.activeChat;
    if (!chat) return;
    try {
      await deps.api.api(`/api/chats/${chat.id}/uploads/${upload.id}`, { method: "DELETE" });
      state.pendingUploads = state.pendingUploads.filter((item) => item.id !== upload.id);
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    }
  }
  function removePendingArtifact(artifact: Pick<DTO.Attachment, "path">): void {
    state.pendingArtifacts = state.pendingArtifacts.filter((item) => item.path !== artifact.path);
  }
  function openLibraryFile(file: DTO.Artifact): void {
    if (opensInNativeBrowser(file)) {
      openInternalTab(browserViewUrl(file.chat_id || "", file.path));
      return;
    }
    const query = new URLSearchParams({
      chat_id: file.chat_id || "",
      path: file.path,
      from: "library",
    });
    openInternalTab(`/file-view?${query.toString()}`);
  }
  function openLibraryChat(file: DTO.Artifact): void {
    openInternalTab(`/chat/${encodeURIComponent(file.chat_id || "")}`);
  }
  function openInternalTab(url: string): void {
    if (typeof url !== "string" || !url.startsWith("/")) return;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
  function opensInNativeBrowser(file: Partial<DTO.Artifact>): boolean {
    return ["avif", "bmp", "gif", "htm", "html", "ico", "jpeg", "jpg", "pdf", "png", "svg", "webp"].includes(
      String(file?.extension || "").toLowerCase(),
    );
  }
  function browserViewUrl(chatId: string, path: string): string {
    return `/api/chats/${encodeURIComponent(chatId || "")}/files/view?path=${encodeURIComponent(path)}`;
  }
  function inputBrowserViewUrl(chatId: string, path: string): string {
    return `/api/chats/${encodeURIComponent(chatId || "")}/inputs/view?path=${encodeURIComponent(path)}`;
  }
  function leaveFileViewer(): void {
    const params = new URLSearchParams(location.search);
    if (document.referrer.startsWith(location.origin) && history.length > 1) {
      history.back();
    } else if (params.get("from") === "chat" && params.get("chat_id")) {
      location.assign(`/chat/${encodeURIComponent(params.get("chat_id") || "")}`);
    } else {
      location.assign("/library");
    }
  }
  function downloadUrl(file: Pick<DTO.Artifact, "chat_id" | "kind" | "path">): string {
    const resource = file.kind === "input" ? "inputs" : "files";
    return `/api/chats/${encodeURIComponent(file.chat_id || "")}/${resource}/download?path=${encodeURIComponent(file.path)}`;
  }
  function fileViewerDownloadUrl(): string {
    const viewer = state.fileViewer;
    if (!viewer || viewer.isShared) return "";
    return downloadUrl({
      chat_id: viewer.chatId,
      kind: viewer.kind,
      path: viewer.path,
    });
  }
  function fileViewerDownloadName(): string {
    return (
      String(state.fileViewer?.path || "")
        .split("/")
        .pop() || "file"
    );
  }
  async function loadFileViewer(): Promise<void> {
    const params = new URLSearchParams(location.search);
    const share = params.get("share");
    const chatId = params.get("chat_id");
    const path = params.get("path");
    state.fileViewer = null;
    state.fileViewerExpired = false;
    if ((!chatId && !share) || !path) {
      if (share) {
        state.fileViewerExpired = true;
        document.title = deps.i18n.t("share.linkExpiredTitle");
        return;
      }
      deps.shell.showError(new ApiError("File reference is incomplete"));
      return;
    }
    try {
      const data = share
        ? await deps.api.api<{ content: string }>(
            `/api/share/${encodeURIComponent(share || "")}/files/content?path=${encodeURIComponent(path)}`,
          )
        : await deps.api.api<{ content: string }>(
            `/api/chats/${encodeURIComponent(chatId || "")}/${params.get("kind") === "input" ? "inputs" : "files"}/content?path=${encodeURIComponent(path)}`,
          );
      state.fileViewer = {
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
      if (state.fileViewer.canManageShare) await loadArtifactShare(chatId || "", path);
      document.title = path.split("/").pop() || "File";
      setTimeout(() => deps.content.renderMermaidDiagrams(), 0);
    } catch (cause) {
      const error = asError(cause);
      if (share && error.status === 404) {
        state.fileViewer = null;
        state.fileViewerExpired = true;
        document.title = deps.i18n.t("share.linkExpiredTitle");
      } else {
        deps.shell.showError(error);
      }
    }
  }
  async function loadArtifactShare(chatId: string, path: string): Promise<void> {
    try {
      state.fileViewer!.artifactShare = await deps.api.api<DTO.Share>(
        `/api/chats/${encodeURIComponent(chatId || "")}/artifact-shares?path=${encodeURIComponent(path)}`,
      );
      state.fileViewer!.artifactShare!.kind = "artifact";
    } catch (cause) {
      const error = asError(cause);
      if (error.status !== 404) deps.shell.showError(error);
    }
  }
  async function shareViewedFile(): Promise<void> {
    const params = new URLSearchParams(location.search);
    const chatId = params.get("chat_id");
    const path = state.fileViewer?.path;
    if (!chatId || !path || state.sharingViewedFile) return;
    state.sharingViewedFile = true;
    try {
      const data = await deps.api.api<DTO.Share>(
        `/api/chats/${encodeURIComponent(chatId || "")}/artifact-shares?path=${encodeURIComponent(path)}`,
        {
          method: "POST",
        },
      );
      state.fileViewer!.artifactShare = {
        ...data,
        kind: "artifact",
        title: deps.chat.state.activeChat?.title || "",
      };
      deps.shares.showCreatedLink(`${location.origin}${data.url}`, "artifact");
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    } finally {
      state.sharingViewedFile = false;
    }
  }
  function renderFilePreview(): string {
    const path = state.fileViewer?.path || "";
    const content = state.fileViewer?.content || "";
    if (deps.content.isCsvFile(path)) return deps.content.renderCsv(content);
    if (deps.content.isCodeFile(path)) return deps.content.renderCodeFile(content, deps.content.fileExtension(path));
    return deps.content.renderMarkdown(content);
  }
  function closeFiles(): void {
    state.filesOpen = false;
  }
  function resetFilePanel(): void {
    state.files = [];
    state.inputFiles = [];
    state.filesOpen = false;
    state.filesTab = "outputs";
  }
  function clearAttachments(includeLocal: boolean = true): void {
    state.pendingUploads = [];
    state.pendingArtifacts = [];
    if (includeLocal) state.uploadSelection = [];
  }
  function restoreUploads(uploads: DTO.Artifact[]): void {
    state.pendingUploads = uploads;
  }
  function clearFileShare(token: string): void {
    if (state.fileViewer?.artifactShare?.token === token) state.fileViewer.artifactShare = null;
  }
  return {
    state,
    toggleFiles,
    refreshOpenFiles,
    loadSharedFiles,
    loadChatFiles,
    loadLibrary,
    selectLibraryAgent,
    openFile,
    displayedFiles,
    pendingAttachments,
    attachmentCommandMatch,
    attachmentCommandItems,
    attachmentCommandVisible,
    updateAttachmentCommandState,
    handleAttachmentKeydown,
    chooseFileAttachment,
    openUploadPicker,
    handleUploadSelection,
    handlePaste,
    handleUploadDrop,
    handleContentDragEnter,
    handleContentDragOver,
    handleContentDragLeave,
    resetUploadDragState,
    addUploadSelection,
    uploadSelectionTotalBytes,
    removeUploadSelection,
    formatFileSize,
    uploadFiles,
    removePendingAttachment,
    removePendingUpload,
    removePendingArtifact,
    openLibraryFile,
    openLibraryChat,
    openInternalTab,
    opensInNativeBrowser,
    browserViewUrl,
    inputBrowserViewUrl,
    leaveFileViewer,
    downloadUrl,
    fileViewerDownloadUrl,
    fileViewerDownloadName,
    loadFileViewer,
    loadArtifactShare,
    shareViewedFile,
    renderFilePreview,
    closeFiles,
    resetFilePanel,
    clearAttachments,
    restoreUploads,
    clearFileShare,
  };
}
