<script setup lang="ts">
import OmaIcon from "../../ui/Icon.vue";
import { useWorkspaceScope } from "../../app/scope";
const {
  agentAvatarMarkup,
  agentItems,
  agentSearch,
  agentTagsMarkup,
  agents,
  chatCount,
  deleteAgent,
  dialog,
  editAgent,
  newAgent,
  page,
  publishAgent,
  requestMarketplaceAgentUpdate,
  t,
} = useWorkspaceScope([
  "agentAvatarMarkup",
  "agentItems",
  "agentSearch",
  "agentTagsMarkup",
  "agents",
  "chatCount",
  "deleteAgent",
  "dialog",
  "editAgent",
  "newAgent",
  "page",
  "publishAgent",
  "requestMarketplaceAgentUpdate",
  "t",
]);
</script>
<template>
  <section class="content-panel agents-page" v-show="page === 'agents'">
    <div class="page-heading">
      <div>
        <h1 v-text="t('agents.title')"></h1>
        <p v-text="t('agents.subtitle')"></p>
      </div>
    </div>
    <div class="agent-catalog-toolbar">
      <label class="library-search agent-catalog-search">
        <OmaIcon name="search" aria-hidden="true" />
        <input class="input" v-model="agentSearch" :placeholder="t('agents.search')" :aria-label="t('agents.search')" />
      </label>
      <button class="btn btn-soft btn-primary" @click="newAgent()">
        <OmaIcon name="plus" aria-hidden="true" /><span v-text="t('agents.new')"></span>
      </button>
    </div>
    <div class="agent-grid" v-show="agentItems().length">
      <template v-for="agent in agentItems()" :key="agent.id"
        ><div class="agent-card" role="button" tabindex="0" @click="dialog = agent" @keydown.enter="dialog = agent">
          <div class="card-top agent-card-identity">
            <span class="agent-avatar-slot" data-rendered-content="" v-html="agentAvatarMarkup(agent, 'large')"></span>
            <h3 v-text="agent.name"></h3>
            <button
              type="button"
              class="agent-market-update-action"
              v-show="agent.marketplace_update_available"
              @click.stop="requestMarketplaceAgentUpdate(agent)"
              :aria-label="t('marketplace.updateAgent') + ' ' + agent.name"
              :title="t('marketplace.updateAgent')"
            >
              <OmaIcon name="circle-fading-arrow-up" aria-hidden="true" />
            </button>
          </div>
          <p class="agent-instruction" v-text="agent.instruction"></p>
          <div class="agent-card-tags" v-show="agent.tags?.length">
            <span data-rendered-content="" v-html="agentTagsMarkup(agent.tags)"></span>
          </div>
          <div class="card-bottom">
            <div class="agent-card-bottom-start">
              <span v-text="chatCount(agent.id) + ' chats'"></span>
            </div>
            <div class="agent-card-bottom-actions">
              <button
                type="button"
                class="trash-btn"
                v-show="!agent.protected"
                @click.stop="deleteAgent(agent)"
                title="Delete agent"
                aria-label="Delete agent"
              >
                <OmaIcon name="trash-2" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="trash-btn agent-publish-btn agent-edit-btn"
                @click.stop="editAgent(agent)"
                aria-label="Edit agent"
                title="Edit agent"
              >
                <OmaIcon name="square-pen" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="trash-btn agent-publish-btn"
                @click.stop="publishAgent(agent)"
                aria-label="Share agent"
                title="Share agent"
              >
                <OmaIcon name="rss" aria-hidden="true" />
              </button>
            </div>
          </div></div
      ></template>
    </div>
    <div class="market-empty" v-show="agents.length && !agentItems().length">
      <span v-text="t('agents.noMatching')"></span>
    </div>
  </section>
</template>
