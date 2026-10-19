<script setup lang="ts">
import { toRefs } from "vue";
import { useAgents } from "../agents/context";
import { useChat } from "./context";
import { useFormat } from "../../shared/format-context";
import { useI18n } from "../../shared/i18n-context";

import { vOutside } from "../../ui/events";
import OmaIcon from "../../ui/Icon.vue";
const agentsFeature = useAgents();
const { agents } = toRefs(agentsFeature.state);
const { agentName } = agentsFeature;
const chatFeature = useChat();
const { chatSearchAgentFilter, chatSearchAgentPickerOpen, chatSearchQuery, searchOpen } = toRefs(chatFeature.state);
const { searchChatResults, selectChatSearchAgent, selectSearchChat } = chatFeature;
const formatFeature = useFormat();
const { initials, relativeTime } = formatFeature;
const i18nFeature = useI18n();
const { t } = i18nFeature;
</script>
<template>
  <dialog
    id="chat-search-dialog"
    class="modal chat-search-dialog"
    :open="Boolean(searchOpen)"
    v-show="searchOpen"
    @click.self="searchOpen = false"
  >
    <div class="modal-box">
      <div class="dialog-head">
        <div>
          <div class="eyebrow" v-text="t('nav.chatHistory')"></div>
          <h2 v-text="t('dialogs.searchChats')"></h2>
        </div>
        <button class="icon-btn" @click="searchOpen = false" :aria-label="t('common.close')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <div class="chat-search-toolbar">
        <label class="chat-search-input"
          ><OmaIcon name="search" aria-hidden="true" /><input
            class="input"
            v-model="chatSearchQuery"
            :placeholder="t('dialogs.searchByTask')"
            autofocus
            :aria-label="t('dialogs.searchTasks')"
        /></label>
        <div
          class="agent-picker filter-agent-picker chat-search-agent-picker"
          v-outside="
            () => {
              chatSearchAgentPickerOpen = false;
            }
          "
        >
          <button
            type="button"
            class="agent-picker-button filter-agent-picker-button"
            @click="chatSearchAgentPickerOpen = !chatSearchAgentPickerOpen"
            :aria-expanded="chatSearchAgentPickerOpen"
            aria-haspopup="listbox"
            :aria-label="t('dialogs.filterChats')"
          >
            <span
              class="agent-avatar"
              v-text="initials(chatSearchAgentFilter ? agentName(chatSearchAgentFilter) : 'All')"
            ></span>
            <span
              class="filter-agent-picker-label"
              v-text="chatSearchAgentFilter ? agentName(chatSearchAgentFilter) : t('common.all')"
            ></span>
            <OmaIcon class="picker-chevron" name="chevron-down" aria-hidden="true" />
          </button>
          <div class="agent-picker-menu filter-agent-picker-menu" v-show="chatSearchAgentPickerOpen" role="listbox">
            <button type="button" class="agent-picker-option" @click="selectChatSearchAgent('')">
              <span class="agent-avatar" v-text="initials('All')"></span>
              <span><b v-text="t('common.all')"></b></span>
            </button>
            <template v-for="agent in agents" :key="agent.id">
              <button type="button" class="agent-picker-option" @click="selectChatSearchAgent(agent.id)">
                <span class="agent-avatar" v-text="initials(agent.name)"></span>
                <span><b v-text="agent.name"></b></span>
              </button>
            </template>
          </div>
        </div>
      </div>
      <div class="chat-search-results">
        <template v-if="searchChatResults().length === 0"
          ><div class="files-empty" v-text="t('library.noMatchingChats')"></div></template
        ><template v-for="chat in searchChatResults()" :key="chat.id"
          ><button type="button" class="chat-search-item" @click="selectSearchChat(chat)">
            <span
              ><b v-text="chat.title"></b
              ><small
                ><span v-text="agentName(chat.agent_id)"></span
                ><span v-text="relativeTime(chat.last_activity_at)"></span></small></span
            ><OmaIcon name="square-arrow-out-up-right" aria-hidden="true" /></button
        ></template>
      </div>
    </div>
  </dialog>
</template>
