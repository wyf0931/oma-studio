<script setup lang="ts">
import { toRefs } from "vue";
import { useAgents } from "../agents/context";
import { useIdentity } from "../identity/context";
import { useMarketplace } from "./context";
import { useShell } from "../../app/context";
import { useI18n } from "../../shared/i18n-context";

import OmaIcon from "../../ui/Icon.vue";
const agentsFeature = useAgents();
const { resources } = toRefs(agentsFeature.state);
const { agentAvatarMarkup } = agentsFeature;
const identityFeature = useIdentity();
const { authUser } = toRefs(identityFeature.state);
const marketplaceFeature = useMarketplace();
const { marketAgentsLoading, marketCatalogSearch, marketTab, marketUninstallTarget } = toRefs(marketplaceFeature.state);
const {
  deleteMarketAgent,
  installMarketAgent,
  marketAgentItems,
  marketCatalogItems,
  marketResourceAuthor,
  marketResourceSource,
  marketSearchPlaceholder,
  openMarketInstall,
  openMarketMcpAdd,
  openMarketUninstall,
  requestMarketListingUpdate,
} = marketplaceFeature;
const shellFeature = useShell();
const { page } = toRefs(shellFeature.state);
const i18nFeature = useI18n();
const { t } = i18nFeature;
</script>
<template>
  <section class="content-panel market-page" v-show="page === 'market'">
    <div class="page-heading">
      <div>
        <h1 v-text="t('marketplace.title')"></h1>
        <p v-text="t('marketplace.subtitle')"></p>
      </div>
    </div>
    <div class="tabs tabs-border market-tabs" role="tablist" aria-label="Marketplace resources">
      <button
        type="button"
        role="tab"
        class="tab"
        :class="{ 'tab-active': marketTab === 'skills' }"
        :aria-selected="marketTab === 'skills'"
        @click="marketTab = 'skills'"
      >
        <span v-text="t('marketplace.skills')"></span>
      </button>
      <button
        type="button"
        role="tab"
        class="tab"
        :class="{ 'tab-active': marketTab === 'extensions' }"
        :aria-selected="marketTab === 'extensions'"
        @click="marketTab = 'extensions'"
      >
        <span v-text="t('marketplace.extensions')"></span>
      </button>
      <button
        type="button"
        role="tab"
        class="tab"
        :class="{ 'tab-active': marketTab === 'mcp_servers' }"
        :aria-selected="marketTab === 'mcp_servers'"
        @click="marketTab = 'mcp_servers'"
      >
        <span v-text="t('marketplace.mcpServers')"></span>
      </button>
      <button
        type="button"
        role="tab"
        class="tab"
        :class="{ 'tab-active': marketTab === 'agents' }"
        :aria-selected="marketTab === 'agents'"
        @click="marketTab = 'agents'"
      >
        <span v-text="t('agents.title')"></span>
      </button>
      <button
        type="button"
        role="tab"
        class="tab"
        :class="{ 'tab-active': marketTab === 'agent_teams' }"
        :aria-selected="marketTab === 'agent_teams'"
        @click="marketTab = 'agent_teams'"
      >
        <span v-text="t('marketplace.agentTeams')"></span>
      </button>
    </div>
    <div class="market-catalog-toolbar">
      <label class="library-search market-catalog-search">
        <OmaIcon name="search" aria-hidden="true" />
        <input
          class="input"
          v-model="marketCatalogSearch"
          :placeholder="marketSearchPlaceholder()"
          :aria-label="marketSearchPlaceholder()"
        />
      </label>
      <button
        class="btn btn-soft btn-primary"
        v-show="authUser?.role === 'admin' && ['skills', 'extensions'].includes(marketTab)"
        @click="openMarketInstall()"
      >
        <OmaIcon name="plus" aria-hidden="true" /><span v-text="t('common.install')"></span>
      </button>
      <button
        type="button"
        class="btn btn-soft btn-primary"
        v-show="authUser?.role === 'admin' && marketTab === 'mcp_servers'"
        @click="openMarketMcpAdd()"
      >
        <OmaIcon name="plus" aria-hidden="true" /><span v-text="t('marketplace.add')"></span>
      </button>
    </div>
    <div class="market-content" v-show="marketTab === 'skills'">
      <div class="market-grid" v-show="marketCatalogItems('skills').length">
        <template v-for="item in marketCatalogItems('skills')" :key="item.id">
          <article class="card card-border market-card bg-base-100" :title="item.description || item.path">
            <div class="card-body">
              <div class="market-card-top">
                <span class="agent-avatar-slot" data-rendered-content="" v-html="agentAvatarMarkup(item)"></span>
                <h2 class="card-title" v-text="item.name"></h2>
              </div>
              <p class="market-description" v-text="item.description || 'No description available'"></p>
              <div class="card-actions market-card-footer">
                <span class="market-card-author"
                  ><OmaIcon name="user" aria-hidden="true" /><span v-text="marketResourceAuthor('skills', item)"></span
                ></span>
                <button
                  type="button"
                  class="trash-btn market-uninstall-action"
                  v-show="authUser?.role === 'admin' && marketResourceSource('skills', item)"
                  @click.stop="openMarketUninstall('skills', item)"
                  :aria-label="'Uninstall ' + item.name"
                  title="Uninstall skill"
                >
                  <OmaIcon name="trash-2" aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        </template>
      </div>
      <div class="market-empty" v-show="!resources.skills.length" v-text="t('marketplace.noSkills')"></div>
      <div class="market-empty" v-show="resources.skills.length && !marketCatalogItems('skills').length">
        <span v-text="t('marketplace.noMatchingSkills')"></span>
      </div>
    </div>
    <div class="market-content" v-show="marketTab === 'extensions'">
      <div class="market-grid" v-show="marketCatalogItems('extensions').length">
        <template v-for="item in marketCatalogItems('extensions')" :key="item.id">
          <article class="card card-border market-card bg-base-100" :title="item.description || item.path">
            <div class="card-body">
              <div class="market-card-top">
                <span class="agent-avatar-slot" data-rendered-content="" v-html="agentAvatarMarkup(item)"></span>
                <h2 class="card-title" v-text="item.name"></h2>
              </div>
              <p class="market-description" v-text="item.description || 'No description available'"></p>
              <div class="card-actions market-card-footer">
                <span class="market-card-author"
                  ><OmaIcon name="user" aria-hidden="true" /><span
                    v-text="marketResourceAuthor('extensions', item)"
                  ></span
                ></span>
                <button
                  type="button"
                  class="trash-btn market-uninstall-action"
                  v-show="authUser?.role === 'admin' && marketResourceSource('extensions', item)"
                  @click.stop="openMarketUninstall('extensions', item)"
                  :aria-label="'Uninstall ' + item.name"
                  title="Uninstall extension"
                >
                  <OmaIcon name="trash-2" aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        </template>
      </div>
      <div class="market-empty" v-show="!resources.extensions.length" v-text="t('marketplace.noExtensions')"></div>
      <div class="market-empty" v-show="resources.extensions.length && !marketCatalogItems('extensions').length">
        <span v-text="t('marketplace.noMatchingExtensions')"></span>
      </div>
    </div>
    <div class="market-content" v-show="marketTab === 'mcp_servers'">
      <div class="market-grid" v-show="marketCatalogItems('mcp_servers').length">
        <template v-for="item in marketCatalogItems('mcp_servers')" :key="item.id">
          <article class="card card-border market-card bg-base-100" :title="item.description || item.path">
            <div class="card-body">
              <div class="market-card-top">
                <span class="agent-avatar-slot" data-rendered-content="" v-html="agentAvatarMarkup(item)"></span>
                <h2 class="card-title" v-text="item.name"></h2>
              </div>
              <p class="market-description" v-text="item.description || 'MCP server'"></p>
              <div class="card-actions market-card-footer">
                <span class="market-card-author"
                  ><OmaIcon name="user" aria-hidden="true" /><span
                    v-text="marketResourceAuthor('mcp_servers', item)"
                  ></span
                ></span>
                <button
                  type="button"
                  class="trash-btn market-uninstall-action"
                  v-show="authUser?.role === 'admin'"
                  @click.stop="marketUninstallTarget = { kind: 'mcp_servers', item }"
                  :aria-label="'Delete ' + item.name"
                  title="Delete MCP server"
                >
                  <OmaIcon name="trash-2" aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        </template>
      </div>
      <div class="market-empty" v-show="!resources.mcp_servers.length" v-text="t('marketplace.noMcpServers')"></div>
      <div class="market-empty" v-show="resources.mcp_servers.length && !marketCatalogItems('mcp_servers').length">
        <span v-text="t('marketplace.noMatchingMcpServers')"></span>
      </div>
    </div>
    <div class="market-empty" v-show="marketTab === 'agent_teams'">
      <h2 v-text="t('common.comingSoon')"></h2>
      <p v-text="t('marketplace.reserved')"></p>
    </div>
    <div class="market-content" v-show="marketTab === 'agents'">
      <div class="market-grid" v-show="!marketAgentsLoading && marketAgentItems().length">
        <template v-for="item in marketAgentItems()" :key="item.id">
          <article class="card card-border market-card agent-market-card bg-base-100">
            <div class="card-body">
              <span
                class="market-agent-status market-agent-status-installed"
                v-show="item.installation_status === 'installed'"
                role="status"
                :aria-label="t('marketplace.agentInstalled')"
                :title="t('marketplace.agentInstalled')"
              >
                <OmaIcon name="circle-check" aria-hidden="true" />
              </span>
              <button
                type="button"
                class="market-agent-status market-agent-status-update"
                v-show="item.installation_status === 'update_available'"
                @click.stop="requestMarketListingUpdate(item)"
                :aria-label="t('marketplace.agentUpdateAvailable')"
                :title="t('marketplace.agentUpdateAvailable')"
              >
                <OmaIcon name="circle-fading-arrow-up" aria-hidden="true" />
              </button>
              <div class="market-card-top">
                <span
                  class="agent-avatar-slot"
                  data-rendered-content=""
                  v-html="agentAvatarMarkup(item, '', true)"
                ></span>
                <h2 class="card-title" v-text="item.name"></h2>
              </div>
              <p class="market-description" v-text="item.instruction"></p>
              <div class="card-actions market-card-footer">
                <div class="market-agent-meta">
                  <span class="market-card-author">
                    <OmaIcon name="user" aria-hidden="true" />
                    <span v-text="item.author"></span>
                  </span>
                  <span class="market-card-separator"></span>
                  <span v-text="item.install_count + ' installed'"></span>
                </div>
                <div class="market-agent-actions">
                  <button
                    type="button"
                    class="trash-btn market-agent-install-action"
                    @click.stop="installMarketAgent(item)"
                    :aria-label="t('common.install') + ' ' + item.name"
                    :title="t('common.install')"
                  >
                    <OmaIcon name="plus" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="trash-btn market-agent-delete-action"
                    v-show="authUser?.role === 'admin'"
                    @click.stop="deleteMarketAgent(item)"
                    :aria-label="t('common.delete') + ' ' + item.name"
                    :title="t('common.delete')"
                  >
                    <OmaIcon name="trash-2" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        </template>
      </div>
      <div class="files-empty" v-show="marketAgentsLoading">
        <span class="loading loading-dots loading-sm"></span>
      </div>
      <div
        class="market-empty"
        v-show="!marketAgentsLoading && !marketCatalogSearch.trim() && !marketAgentItems().length"
      >
        <h2 v-text="t('marketplace.noSharedAgents')"></h2>
        <p v-text="t('marketplace.shareAgentHint')"></p>
      </div>
      <div
        class="market-empty"
        v-show="!marketAgentsLoading && marketCatalogSearch.trim() && !marketAgentItems().length"
      >
        <span v-text="t('marketplace.noMatchingAgents')"></span>
      </div>
    </div>
  </section>
</template>
