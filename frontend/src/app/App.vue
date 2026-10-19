<script setup lang="ts">
import OmaIcon from "../ui/Icon.vue";
import { onMounted, onBeforeUnmount, provide, defineAsyncComponent, defineComponent } from "vue";
import type { Component } from "vue";
import { installContentEvents } from "../ui/content-events";
import ChatPage from "../features/chat/ChatPage.vue";
const LoadFailure = defineComponent({ render: () => null });
function lazyView(loader: () => Promise<{ default: Component }>) {
  return defineAsyncComponent({
    loader,
    errorComponent: LoadFailure,
    onError(error, _retry, fail) {
      application.shell.showError(error);
      fail();
    },
  });
}
const LibraryPage = lazyView(() => import("../features/artifacts/LibraryPage.vue"));
const FileViewerPage = lazyView(() => import("../features/artifacts/FileViewerPage.vue"));
const AgentsPage = lazyView(() => import("../features/agents/AgentsPage.vue"));
const MarketplacePage = lazyView(() => import("../features/marketplace/MarketplacePage.vue"));
const MarketplaceDialogs = lazyView(() => import("../features/marketplace/MarketplaceDialogs.vue"));
const AutopilotsPage = lazyView(() => import("../features/autopilots/AutopilotsPage.vue"));
import FilesDrawer from "../features/artifacts/FilesDrawer.vue";
const AutopilotDialogs = lazyView(() => import("../features/autopilots/AutopilotDialogs.vue"));
const ShareRecordsDialogs = lazyView(() => import("../features/shares/ShareRecordsDialogs.vue"));
const AutopilotRunDialogs = lazyView(() => import("../features/autopilots/AutopilotRunDialogs.vue"));
const ChatSearchDialog = lazyView(() => import("../features/chat/ChatSearchDialog.vue"));
const IdentityDialogs = lazyView(() => import("../features/identity/IdentityDialogs.vue"));
const SettingsDialog = lazyView(() => import("../features/settings/SettingsDialog.vue"));
const UsersDialog = lazyView(() => import("../features/identity/UsersDialog.vue"));
const UsageDialog = lazyView(() => import("../features/usage/UsageDialog.vue"));
const AgentDialogs = lazyView(() => import("../features/agents/AgentDialogs.vue"));
const ChatDeleteDialog = lazyView(() => import("../features/chat/ChatDeleteDialog.vue"));
const AgentEditorDialogs = lazyView(() => import("../features/agents/AgentEditorDialogs.vue"));
const CronDialog = lazyView(() => import("../features/autopilots/CronDialog.vue"));
import LinkDrawer from "../features/chat/LinkDrawer.vue";
const ShareDialog = lazyView(() => import("../features/shares/ShareDialog.vue"));
import HistorySidebar from "../features/chat/HistorySidebar.vue";
import LoginScreen from "../features/identity/LoginScreen.vue";

import { toRefs } from "vue";
import { createApplication } from "./application";
import { shellKey } from "./context";
import { i18nKey } from "../shared/i18n-context";
import { domKey } from "../shared/dom-context";
import { apiKey } from "../shared/api-context";
import { formatKey } from "../shared/format-context";
import { contentKey } from "../shared/content-context";
import { presentationKey } from "../features/chat/presentation-context";
import { agentsKey } from "../features/agents/context";
import { artifactsKey } from "../features/artifacts/context";
import { autopilotsKey } from "../features/autopilots/context";
import { chatKey } from "../features/chat/context";
import { identityKey } from "../features/identity/context";
import { marketplaceKey } from "../features/marketplace/context";
import { settingsKey } from "../features/settings/context";
import { sharesKey } from "../features/shares/context";
import { usageKey } from "../features/usage/context";
const application = createApplication();
provide(shellKey, application.shell);
provide(i18nKey, application.i18n);
provide(domKey, application.dom);
provide(apiKey, application.api);
provide(formatKey, application.format);
provide(contentKey, application.content);
provide(presentationKey, application.presentation);
provide(agentsKey, application.agents);
provide(artifactsKey, application.artifacts);
provide(autopilotsKey, application.autopilots);
provide(chatKey, application.chat);
provide(identityKey, application.identity);
provide(marketplaceKey, application.marketplace);
provide(settingsKey, application.settings);
provide(sharesKey, application.shares);
provide(usageKey, application.usage);
const shellFeature = application.shell;
const { appReady, error, mobileSidebarOpen, page, sidebarCollapsed, toastKind, toastMessage } = toRefs(
  shellFeature.state,
);
const { closeDrawersOutside, toggleMobileSidebar } = shellFeature;
const identityFeature = application.identity;
const { authUser } = toRefs(identityFeature.state);
const agentsFeature = application.agents;
const { dialog } = toRefs(agentsFeature.state);
const chatFeature = application.chat;
const { newChat } = chatFeature;
const sharesFeature = application.shares;
const { sharedMode } = toRefs(sharesFeature.state);
const i18nFeature = application.i18n;
const { t } = i18nFeature;
onMounted(() => {
  application.shell.state.cleanups.push(
    installContentEvents({
      copyCodeBlock: application.chat.copyCodeBlock,
      openWebActivity: application.presentation.openWebActivity,
      setReasoningOpen: application.presentation.setReasoningOpen,
    }),
  );
  const onEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape" && application.settings.state.settingsOpen) {
      application.settings.closeSettings();
      event.preventDefault();
    }
  };
  window.addEventListener("keydown", onEscape);
  application.shell.state.cleanups.push(() => window.removeEventListener("keydown", onEscape));
  void application.shell.init();
});
onBeforeUnmount(() => application.dispose());
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

        <LibraryPage v-if="page === 'library'" />

        <FileViewerPage v-if="page === 'file'" />

        <AgentsPage v-if="page === 'agents'" />
        <MarketplacePage v-if="page === 'market'" />
        <MarketplaceDialogs
          v-if="
            application.marketplace.state.marketUpdateAgentTarget ||
            application.marketplace.state.marketInstallOpen ||
            application.marketplace.state.marketMcpAddOpen ||
            application.marketplace.state.marketUninstallTarget ||
            application.marketplace.state.marketPublishTarget ||
            application.marketplace.state.marketDeleteAgentTarget ||
            application.marketplace.state.marketInstallAgentTarget
          "
        />
        <AutopilotsPage v-if="page === 'autopilots'" />
      </main>
      <FilesDrawer />
    </div>

    <AutopilotDialogs
      v-if="application.autopilots.state.autopilotDialog || application.autopilots.state.autopilotDeleteTarget"
    />
    <ShareRecordsDialogs
      v-if="application.shares.state.shareRecordsOpen || application.shares.state.shareRevokeTarget"
    />
    <AutopilotRunDialogs
      v-if="application.autopilots.state.autopilotRunsOpen || application.autopilots.state.autopilotDeleteTarget"
    />
    <ChatSearchDialog v-if="application.chat.state.searchOpen" />
    <IdentityDialogs
      v-if="
        application.identity.state.userAddOpen ||
        application.identity.state.userDeleteTarget ||
        application.identity.state.logoutConfirmOpen
      "
    />
    <SettingsDialog v-if="application.settings.state.settingsOpen" />
    <UsersDialog v-if="application.identity.state.usersOpen" />
    <UsageDialog v-if="application.usage.state.usageOpen" />
    <AgentDialogs v-if="dialog" />
    <ChatDeleteDialog v-if="application.chat.state.deleteChatTarget" />
    <AgentEditorDialogs
      v-if="
        application.agents.state.createDialog ||
        application.agents.state.editingAgent ||
        application.agents.state.confirmTarget
      "
    />
    <div
      class="toast"
      v-show="toastMessage || error"
      v-text="toastMessage || error"
      :class="{
        'toast-success': toastMessage && toastKind === 'success',
        'toast-warning': toastMessage && toastKind === 'warning',
      }"
    ></div>

    <CronDialog v-if="application.autopilots.state.cronBuilderOpen" />
    <LinkDrawer />
    <ShareDialog v-if="application.shares.state.shareStep !== null" />
  </div>
</template>
