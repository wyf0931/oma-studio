<script setup lang="ts">
import OmaIcon from "../ui/Icon.vue";
import { onMounted, onBeforeUnmount, provide } from "vue";
import { installContentEvents } from "../ui/content-events";
import { createWorkspace } from "./workspace";
import { workspaceKey, useWorkspaceScope } from "./scope";
import ChatPage from "../features/chat/ChatPage.vue";
import LibraryPage from "../features/artifacts/LibraryPage.vue";
import FileViewerPage from "../features/artifacts/FileViewerPage.vue";
import AgentsPage from "../features/agents/AgentsPage.vue";
import MarketplacePage from "../features/marketplace/MarketplacePage.vue";
import MarketplaceDialogs from "../features/marketplace/MarketplaceDialogs.vue";
import AutopilotsPage from "../features/autopilots/AutopilotsPage.vue";
import FilesDrawer from "../features/artifacts/FilesDrawer.vue";
import AutopilotDialogs from "../features/autopilots/AutopilotDialogs.vue";
import ShareRecordsDialogs from "../features/shares/ShareRecordsDialogs.vue";
import AutopilotRunDialogs from "../features/autopilots/AutopilotRunDialogs.vue";
import ChatSearchDialog from "../features/chat/ChatSearchDialog.vue";
import IdentityDialogs from "../features/identity/IdentityDialogs.vue";
import SettingsDialog from "../features/settings/SettingsDialog.vue";
import UsersDialog from "../features/identity/UsersDialog.vue";
import UsageDialog from "../features/usage/UsageDialog.vue";
import AgentDialogs from "../features/agents/AgentDialogs.vue";
import ChatDeleteDialog from "../features/chat/ChatDeleteDialog.vue";
import AgentEditorDialogs from "../features/agents/AgentEditorDialogs.vue";
import CronDialog from "../features/autopilots/CronDialog.vue";
import LinkDrawer from "../features/chat/LinkDrawer.vue";
import ShareDialog from "../features/shares/ShareDialog.vue";
import HistorySidebar from "../features/chat/HistorySidebar.vue";
import LoginScreen from "../features/identity/LoginScreen.vue";
const workspace = createWorkspace();
provide(workspaceKey, workspace);
const {
  appReady,
  authUser,
  closeDrawersOutside,
  dialog,
  error,
  mobileSidebarOpen,
  newChat,
  page,
  sharedMode,
  sidebarCollapsed,
  t,
  toastKind,
  toastMessage,
  toggleMobileSidebar,
} = useWorkspaceScope(
  [
    "appReady",
    "authUser",
    "closeDrawersOutside",
    "dialog",
    "error",
    "mobileSidebarOpen",
    "newChat",
    "page",
    "sharedMode",
    "sidebarCollapsed",
    "t",
    "toastKind",
    "toastMessage",
    "toggleMobileSidebar",
  ],
  workspace,
);
onMounted(() => {
  workspace.cleanups.push(installContentEvents(workspace));
  const onEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape" && workspace.settingsOpen) {
      workspace.settingsOpen = false;
      event.preventDefault();
    }
  };
  window.addEventListener("keydown", onEscape);
  workspace.cleanups.push(() => window.removeEventListener("keydown", onEscape));
  void workspace.init();
});
onBeforeUnmount(() => {
  workspace.stopWatching();
  workspace.abortChatReads();
  workspace._iconObserver?.disconnect();
  if (workspace.healthTimer) clearInterval(workspace.healthTimer);
  for (const cleanup of workspace.cleanups) cleanup();
});
</script>
<template>
  <div @keydown.escape="dialog = null" @click="closeDrawersOutside($event)">
    <div class="app-boot" v-show="!appReady" role="status" aria-live="polite">
      <div class="app-boot-brand">
        <img :src="'/static/oma-logo-transparent.png'" alt="" />
        <span>OMA studio</span>
      </div>
      <span class="loading loading-bars loading-md" aria-hidden="true"></span>
      <span>Loading workspace…</span>
    </div>
    <LoginScreen />
    <div
      class="app-shell"
      v-show="appReady && (sharedMode || authUser)"
      :class="{
        'sidebar-collapsed': sidebarCollapsed,
        'mobile-sidebar-open': mobileSidebarOpen,
        shared: sharedMode,
        'file-preview': page === 'file',
      }"
    >
      <main class="workspace">
        <div class="mobile-topbar">
          <button
            type="button"
            class="btn btn-ghost btn-circle"
            @click="toggleMobileSidebar()"
            aria-label="Open chat history"
          >
            <OmaIcon name="menu" aria-hidden="true" /></button
          ><a class="mobile-brand" href="#" @click.prevent="newChat()"
            ><img :src="'/static/oma-logo-transparent.png'" alt="OMA studio" /><span>OMA studio</span></a
          ><button type="button" class="btn btn-ghost btn-circle" @click="newChat()" :aria-label="t('nav.newTask')">
            <OmaIcon name="plus" aria-hidden="true" />
          </button>
        </div>
        <HistorySidebar />
        <button
          type="button"
          class="mobile-sidebar-overlay"
          @click="mobileSidebarOpen = false"
          :aria-label="t('nav.closeChatHistory')"
        ></button>

        <ChatPage />

        <LibraryPage />

        <FileViewerPage />

        <AgentsPage />
        <MarketplacePage />
        <MarketplaceDialogs />
        <AutopilotsPage />
      </main>
      <FilesDrawer />
    </div>

    <AutopilotDialogs />
    <ShareRecordsDialogs />
    <AutopilotRunDialogs />
    <ChatSearchDialog />
    <IdentityDialogs />
    <SettingsDialog />
    <UsersDialog />
    <UsageDialog />
    <AgentDialogs />
    <ChatDeleteDialog />
    <AgentEditorDialogs />
    <div
      class="toast"
      v-show="toastMessage || error"
      v-text="toastMessage || error"
      :class="{
        'toast-success': toastMessage && toastKind === 'success',
        'toast-warning': toastMessage && toastKind === 'warning',
      }"
    ></div>

    <CronDialog />
    <LinkDrawer />
    <ShareDialog />
  </div>
</template>
