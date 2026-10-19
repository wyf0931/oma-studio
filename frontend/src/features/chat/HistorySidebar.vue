<script setup lang="ts">
import OmaIcon from "../../ui/Icon.vue";
import { useWorkspaceScope } from "../../app/scope";
const {
  activeChat,
  agentName,
  authUser,
  brandClick,
  chats,
  deleteChat,
  go,
  mobileSidebarOpen,
  newChat,
  openChat,
  openChatSearch,
  openProfileLogout,
  openProfileSettings,
  openProfileShares,
  openProfileUsage,
  openProfileUsers,
  page,
  profileAvatarInitials,
  profileDisplayName,
  profileMenuOpen,
  profileRoleLabel,
  relativeTime,
  sidebarCollapsed,
  t,
} = useWorkspaceScope([
  "activeChat",
  "agentName",
  "authUser",
  "brandClick",
  "chats",
  "deleteChat",
  "go",
  "mobileSidebarOpen",
  "newChat",
  "openChat",
  "openChatSearch",
  "openProfileLogout",
  "openProfileSettings",
  "openProfileShares",
  "openProfileUsage",
  "openProfileUsers",
  "page",
  "profileAvatarInitials",
  "profileDisplayName",
  "profileMenuOpen",
  "profileRoleLabel",
  "relativeTime",
  "sidebarCollapsed",
  "t",
]);
</script>
<template>
  <aside class="history-panel">
    <div class="sidebar-top">
      <a class="brand" href="#" @click.prevent="brandClick()"
        ><img :src="'/static/oma-logo-transparent.png'" alt="OhMyAgent logo" /><span>OMA studio</span></a
      >
      <div class="sidebar-tools">
        <button
          type="button"
          class="sidebar-tool"
          @click="sidebarCollapsed = !sidebarCollapsed"
          :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <OmaIcon name="panel-left-close" v-show="!sidebarCollapsed" aria-hidden="true" />
          <OmaIcon name="panel-left-open" v-show="sidebarCollapsed" aria-hidden="true" />
        </button>
      </div>
    </div>
    <nav class="sidebar-menu" :aria-label="t('nav.workspaceNavigation')">
      <button
        class="new-chat menu-item primary-menu"
        :class="{ active: page === 'chat' && !activeChat }"
        @click="newChat()"
      >
        <span class="menu-icon"><OmaIcon name="message-square-plus" aria-hidden="true" /></span
        ><span class="menu-label" v-text="t('nav.newTask')"></span>
      </button>
      <button class="menu-item" :class="{ active: page === 'library' }" @click="go('library')">
        <span class="menu-icon"><OmaIcon name="library" aria-hidden="true" /></span
        ><span class="menu-label" v-text="t('nav.library')"></span>
      </button>
      <button class="menu-item" :class="{ active: page === 'autopilots' }" @click="go('autopilots')">
        <span class="menu-icon"><OmaIcon name="alarm-clock" aria-hidden="true" /></span
        ><span class="menu-label" v-text="t('nav.autopilots')"></span>
      </button>
      <button class="menu-item" :class="{ active: page === 'agents' }" @click="go('agents')">
        <span class="menu-icon"><OmaIcon name="bot" aria-hidden="true" /></span
        ><span class="menu-label" v-text="t('nav.agents')"></span>
      </button>
      <button class="menu-item" :class="{ active: page === 'market' }" @click="go('market')">
        <span class="menu-icon"><OmaIcon name="circle-pile" aria-hidden="true" /></span
        ><span class="menu-label" v-text="t('nav.marketplace')"></span>
      </button>
    </nav>
    <div class="history-area">
      <div class="sidebar-section-heading">
        <span v-text="t('nav.chatHistory')"></span>
        <div class="history-actions">
          <button
            type="button"
            class="sidebar-tool expanded-search"
            @click="openChatSearch()"
            :title="t('nav.searchChats')"
            :aria-label="t('nav.searchChats')"
          >
            <OmaIcon name="search" aria-hidden="true" /></button
          ><button class="icon-btn" @click="newChat()" :title="t('nav.newTask')" :aria-label="t('nav.newTask')">
            <OmaIcon name="plus" aria-hidden="true" />
          </button>
        </div>
      </div>
      <template v-if="chats.length === 0"><div class="empty-history" v-text="t('chat.emptyHistory')"></div></template>
      <div class="history-list">
        <template v-for="chat in chats" :key="chat.id">
          <div
            class="history-item"
            :class="{ selected: activeChat?.id === chat.id }"
            @click="
              openChat(chat);
              mobileSidebarOpen = false;
            "
            @keydown.enter="
              openChat(chat);
              mobileSidebarOpen = false;
            "
            tabindex="0"
            role="button"
          >
            <span class="history-title" v-text="chat.title"></span>
            <span class="history-meta"
              ><span v-text="agentName(chat.agent_id)"></span><span v-text="relativeTime(chat.last_activity_at)"></span
            ></span>
            <button
              type="button"
              class="history-trash"
              @click.stop="deleteChat(chat)"
              :title="t('chat.deleteChat')"
              :aria-label="t('chat.deleteChat')"
            >
              <OmaIcon name="trash-2" aria-hidden="true" />
            </button>
          </div>
        </template>
      </div>
    </div>
    <div class="sidebar-footer">
      <div class="dropdown dropdown-top sidebar-profile" :class="{ 'dropdown-open': profileMenuOpen }">
        <button
          type="button"
          class="sidebar-profile-trigger"
          @click.stop="profileMenuOpen = !profileMenuOpen"
          :aria-expanded="profileMenuOpen"
          aria-haspopup="menu"
          :aria-label="t('nav.openProfileMenu')"
        >
          <div class="avatar avatar-placeholder sidebar-profile-avatar">
            <div><span v-text="profileAvatarInitials()"></span></div>
          </div>
          <span class="sidebar-profile-identity"
            ><b v-text="profileDisplayName()"></b><small v-text="profileRoleLabel()"></small
          ></span>
          <OmaIcon class="sidebar-profile-chevron" name="chevron-up" aria-hidden="true" />
        </button>
        <ul class="menu menu-sm dropdown-content sidebar-profile-menu" v-show="profileMenuOpen" @click.stop>
          <li>
            <button type="button" @click="openProfileSettings()">
              <OmaIcon name="settings" aria-hidden="true" /><span v-text="t('nav.settings')"></span>
            </button>
          </li>
          <li>
            <button type="button" @click="openProfileUsage()">
              <OmaIcon name="chart-pie" aria-hidden="true" /><span v-text="t('nav.usage')"></span>
            </button>
          </li>
          <li>
            <button type="button" @click="openProfileShares()">
              <OmaIcon name="share-2" aria-hidden="true" /><span v-text="t('nav.shareRecords')"></span>
            </button>
          </li>
          <li v-show="authUser?.role === 'admin'">
            <button type="button" @click="openProfileUsers()">
              <OmaIcon name="users" aria-hidden="true" /><span v-text="t('nav.users')"></span>
            </button>
          </li>
          <li class="sidebar-profile-divider" aria-hidden="true"></li>
          <li class="menu-title"><span v-text="t('nav.support')"></span></li>
          <li class="menu-disabled">
            <button type="button" disabled>
              <OmaIcon name="circle-help" aria-hidden="true" /><span v-text="t('nav.helpFeedback')"></span>
            </button>
          </li>
          <li class="menu-disabled">
            <button type="button" disabled>
              <OmaIcon name="info" aria-hidden="true" /><span v-text="t('nav.about')"></span>
            </button>
          </li>
          <li class="sidebar-profile-divider" aria-hidden="true"></li>
          <li>
            <button type="button" class="sidebar-profile-logout" @click="openProfileLogout()">
              <OmaIcon name="log-out" aria-hidden="true" /><span v-text="t('nav.logout')"></span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>
