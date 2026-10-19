<script setup lang="ts">
import OmaIcon from "../../ui/Icon.vue";
import { useWorkspaceScope } from "../../app/scope";
const {
  addMarketMcpServers,
  closeMarketInstall,
  closeMarketMcpAdd,
  confirmDeleteMarketAgent,
  confirmInstallMarketAgent,
  confirmMarketUninstall,
  confirmMarketplaceAgentUpdate,
  confirmPublishAgent,
  installMarketExtension,
  installMarketSkill,
  marketDeleteAgentTarget,
  marketDeletingAgent,
  marketExtensionAction,
  marketExtensionPackage,
  marketInstallAgentTarget,
  marketInstallOpen,
  marketInstallingAgent,
  marketInstallingSkills,
  marketMcpAction,
  marketMcpAddOpen,
  marketMcpConfig,
  marketMcpNames,
  marketOwner,
  marketPublishTarget,
  marketPublishVersion,
  marketPublishing,
  marketSearch,
  marketSearchError,
  marketSearchLoading,
  marketSearchResults,
  marketSkillGitHubSource,
  marketSkillInstalled,
  marketSkillResultKey,
  marketTab,
  marketUninstallTarget,
  marketUpdateAgentTarget,
  marketUpdatingAgent,
  searchMarketSkills,
  t,
} = useWorkspaceScope([
  "addMarketMcpServers",
  "closeMarketInstall",
  "closeMarketMcpAdd",
  "confirmDeleteMarketAgent",
  "confirmInstallMarketAgent",
  "confirmMarketUninstall",
  "confirmMarketplaceAgentUpdate",
  "confirmPublishAgent",
  "installMarketExtension",
  "installMarketSkill",
  "marketDeleteAgentTarget",
  "marketDeletingAgent",
  "marketExtensionAction",
  "marketExtensionPackage",
  "marketInstallAgentTarget",
  "marketInstallOpen",
  "marketInstallingAgent",
  "marketInstallingSkills",
  "marketMcpAction",
  "marketMcpAddOpen",
  "marketMcpConfig",
  "marketMcpNames",
  "marketOwner",
  "marketPublishTarget",
  "marketPublishVersion",
  "marketPublishing",
  "marketSearch",
  "marketSearchError",
  "marketSearchLoading",
  "marketSearchResults",
  "marketSkillGitHubSource",
  "marketSkillInstalled",
  "marketSkillResultKey",
  "marketTab",
  "marketUninstallTarget",
  "marketUpdateAgentTarget",
  "marketUpdatingAgent",
  "searchMarketSkills",
  "t",
]);
</script>
<template>
  <dialog
    class="modal modal-middle"
    :open="Boolean(!!marketUpdateAgentTarget)"
    v-show="marketUpdateAgentTarget"
    @click.self="marketUpdateAgentTarget = null"
  >
    <div class="modal-box confirm-box">
      <div class="dialog-head">
        <div>
          <div class="eyebrow" v-text="t('marketplace.updateAgent')"></div>
          <h2>
            <span v-text="t('marketplace.updateAgent')"></span>
            <span v-text="marketUpdateAgentTarget?.name"></span>?
          </h2>
        </div>
        <button type="button" class="icon-btn" @click="marketUpdateAgentTarget = null" :aria-label="t('common.close')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <p class="confirm-copy" v-text="t('marketplace.updateAgentWarning')"></p>
      <p class="confirm-copy">
        <span v-text="t('marketplace.updateAgentVersion')"></span>
        <b v-text="marketUpdateAgentTarget?.marketplace_latest_version"></b>.
      </p>
      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-ghost"
          @click="marketUpdateAgentTarget = null"
          v-text="t('common.cancel')"
        ></button>
        <button
          type="button"
          class="btn btn-primary"
          @click="confirmMarketplaceAgentUpdate()"
          :disabled="marketUpdatingAgent"
        >
          <span v-show="!marketUpdatingAgent" v-text="t('marketplace.confirmUpdate')"></span>
          <span v-show="marketUpdatingAgent" class="loading loading-spinner loading-sm"></span>
        </button>
      </div>
    </div>
  </dialog>
  <dialog
    class="modal modal-middle"
    :open="Boolean(marketInstallOpen)"
    v-show="marketInstallOpen"
    @click.self="closeMarketInstall()"
  >
    <div class="modal-box market-install-dialog">
      <div class="dialog-head" v-show="marketTab === 'skills'">
        <div>
          <h2 v-text="t('marketplace.installSkill')"></h2>
          <p>Search skills.sh and add a skill to this workspace.</p>
        </div>
        <button type="button" class="icon-btn" @click="closeMarketInstall()" :aria-label="t('common.close')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <div class="dialog-head" v-show="marketTab === 'extensions'">
        <div>
          <h2 v-text="t('marketplace.installExtension')"></h2>
          <p>
            Find an extension package at
            <a class="link link-primary" href="https://pi.dev/packages" target="_blank" rel="noopener noreferrer"
              >pi.dev/packages</a
            >.
          </p>
        </div>
        <button type="button" class="icon-btn" @click="closeMarketInstall()" :aria-label="t('common.close')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <form
        class="market-extension-install"
        v-show="marketTab === 'extensions'"
        @submit.prevent="installMarketExtension()"
      >
        <label class="form-field">
          <span>Package or install command</span>
          <input
            class="input input-bordered"
            v-model="marketExtensionPackage"
            placeholder="pi install npm:pi-mcp-adapter"
            aria-label="Extension npm package"
            :disabled="marketExtensionAction"
          />
        </label>
        <p class="market-command-preview">
          <code
            >pi install npm:<span
              v-text="marketExtensionPackage.replace(/^pi install\\s+/, '').replace(/^npm:/, '') || 'package-name'"
            ></span
          ></code>
        </p>
        <div class="dialog-actions">
          <button type="submit" class="btn btn-soft btn-primary" :disabled="marketExtensionAction">
            <span v-show="!marketExtensionAction" v-text="t('common.install')"></span>
            <span v-show="marketExtensionAction" class="loading loading-spinner loading-sm"></span>
          </button>
        </div>
      </form>
      <form class="market-search" v-show="marketTab === 'skills'" @submit.prevent="searchMarketSkills()">
        <label class="market-search-field">
          <OmaIcon name="search" aria-hidden="true" />
          <input
            class="input input-bordered"
            v-model="marketSearch"
            placeholder="Search skills.sh or paste a GitHub URL"
            aria-label="Search skills.sh or paste a GitHub URL"
          />
        </label>
        <input
          class="input input-bordered market-owner"
          v-model="marketOwner"
          v-show="!marketSkillGitHubSource(marketSearch)"
          placeholder="Owner (optional)"
          aria-label="Filter by owner"
        />
        <button class="btn btn-soft btn-primary" type="submit" :disabled="marketSearchLoading">
          <span
            v-show="!marketSearchLoading"
            v-text="marketSkillGitHubSource(marketSearch) ? 'Preview' : 'Search'"
          ></span>
          <span v-show="marketSearchLoading" class="loading loading-spinner loading-sm"></span>
        </button>
      </form>
      <div class="market-search-state" v-show="marketSearchError || marketSearchResults.length || marketSearchLoading">
        <div class="alert alert-error" v-show="marketSearchError" v-text="marketSearchError"></div>
        <div
          class="market-search-results"
          v-show="!marketSearchLoading && !marketSearchError && marketSearchResults.length"
        >
          <template v-for="result in marketSearchResults" :key="result.repo + ':' + result.skill">
            <article class="card card-border market-result-card bg-base-100">
              <div class="card-body">
                <div class="market-result-heading">
                  <h2 class="card-title" v-text="result.skill"></h2>
                  <span class="badge badge-success badge-soft" v-show="marketSkillInstalled(result)">Installed</span>
                  <button
                    type="button"
                    class="btn btn-soft btn-primary btn-sm btn-square market-install-action"
                    v-show="!marketSkillInstalled(result)"
                    :disabled="marketInstallingSkills.includes(marketSkillResultKey(result))"
                    :aria-label="'Install ' + result.skill"
                    @click="installMarketSkill(result)"
                  >
                    <OmaIcon
                      name="plus"
                      v-show="!marketInstallingSkills.includes(marketSkillResultKey(result))"
                      aria-hidden="true"
                    />
                    <span
                      v-show="marketInstallingSkills.includes(marketSkillResultKey(result))"
                      class="loading loading-spinner loading-xs"
                    ></span>
                  </button>
                </div>
                <p class="market-result-repo" v-text="result.repo"></p>
                <a
                  class="link link-primary market-result-link"
                  :href="result.url"
                  v-show="result.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  v-text="result.url"
                ></a>
                <div class="market-result-meta">
                  <span
                    class="badge badge-ghost"
                    v-show="result.installs"
                    v-text="result.installs + ' installs'"
                  ></span>
                  <span class="market-result-owner" v-show="result.owner">
                    <OmaIcon name="user" aria-hidden="true" />
                    <span v-text="result.owner"></span>
                  </span>
                </div>
              </div>
            </article>
          </template>
        </div>
        <div
          class="market-empty market-search-empty"
          v-show="!marketSearchLoading && !marketSearchError && !marketSearchResults.length"
        >
          No skills found.
        </div>
      </div>
      <div class="market-install-note">
        <span v-show="marketTab === 'skills'"><span v-text="t('marketplace.reviewSkill')"></span></span>
        <span v-show="marketTab === 'extensions'"><span v-text="t('marketplace.reviewExtension')"></span></span>
      </div>
    </div>
  </dialog>
  <dialog
    class="modal modal-middle"
    :open="Boolean(marketMcpAddOpen)"
    v-show="marketMcpAddOpen"
    @click.self="closeMarketMcpAdd()"
  >
    <div class="modal-box market-install-dialog">
      <div class="dialog-head">
        <div>
          <h2 v-text="t('marketplace.addMcpServer')"></h2>
          <p v-text="t('marketplace.mcpHelp')"></p>
        </div>
        <button type="button" class="icon-btn" @click="closeMarketMcpAdd()" aria-label="Close add MCP server dialog">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <form @submit.prevent="addMarketMcpServers()">
        <label class="form-field">
          <span>Server configuration</span>
          <textarea
            class="textarea textarea-bordered mcp-config-input"
            v-model="marketMcpConfig"
            required
            maxlength="200000"
            spellcheck="false"
            aria-label="MCP server JSON configuration"
          ></textarea>
        </label>
        <p class="market-command-preview">
          Detected: <span v-text="marketMcpNames().join(', ') || 'No valid server names yet'"></span>
        </p>
        <div class="dialog-actions">
          <button type="button" class="btn btn-ghost" @click="closeMarketMcpAdd()" v-text="t('common.cancel')"></button>
          <button type="submit" class="btn btn-primary" :disabled="marketMcpAction || !marketMcpNames().length">
            <span v-show="!marketMcpAction" v-text="t('common.add')"></span>
            <span v-show="marketMcpAction" class="loading loading-spinner loading-sm"></span>
          </button>
        </div>
      </form>
    </div>
  </dialog>
  <dialog
    class="modal modal-middle"
    :open="Boolean(!!marketUninstallTarget)"
    v-show="marketUninstallTarget"
    @click.self="marketUninstallTarget = null"
  >
    <div class="modal-box confirm-box">
      <div class="dialog-head">
        <div>
          <div class="eyebrow" v-text="t('dialogs.uninstallResource')"></div>
          <h2>Remove <span v-text="marketUninstallTarget?.item.name"></span>?</h2>
        </div>
        <button type="button" class="icon-btn" @click="marketUninstallTarget = null" aria-label="Close">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <p class="confirm-copy">
        <span
          v-text="
            marketUninstallTarget?.kind === 'mcp_servers'
              ? 'This will remove the MCP server from the shared Pi configuration.'
              : 'This will remove the installed ' +
                (marketUninstallTarget?.kind === 'extensions' ? 'extension' : 'skill') +
                ' from Pi.'
          "
        ></span>
      </p>
      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-ghost"
          @click="marketUninstallTarget = null"
          v-text="t('common.cancel')"
        ></button>
        <button type="button" class="btn btn-error" @click="confirmMarketUninstall()">
          <span v-text="marketUninstallTarget?.kind === 'mcp_servers' ? 'Delete' : 'Uninstall'"></span>
        </button>
      </div>
    </div>
  </dialog>
  <dialog
    class="modal modal-middle"
    :open="Boolean(!!marketPublishTarget)"
    v-show="marketPublishTarget"
    @click.self="marketPublishTarget = null"
  >
    <div class="modal-box confirm-box agent-publish-dialog">
      <div class="dialog-head">
        <div>
          <div class="eyebrow" v-text="t('agents.shareAgent')"></div>
          <h2>Publish <span v-text="marketPublishTarget?.name"></span>?</h2>
        </div>
        <button type="button" class="icon-btn" @click="marketPublishTarget = null" aria-label="Close publish dialog">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <p class="confirm-copy">
        All organization members will be able to view and install an independent copy of this Agent.
      </p>
      <form @submit.prevent="confirmPublishAgent()">
        <label class="form-field">
          <span v-text="t('dialogs.version')"></span>
          <input
            class="input input-bordered"
            v-model="marketPublishVersion"
            placeholder="v1.0.0"
            pattern="v?\d+\.\d+\.\d+"
            required
            :disabled="marketPublishing"
          />
        </label>
        <div class="dialog-actions">
          <button
            type="button"
            class="btn btn-ghost"
            @click="marketPublishTarget = null"
            v-text="t('common.cancel')"
          ></button>
          <button type="submit" class="btn btn-primary" :disabled="marketPublishing">
            <span v-show="!marketPublishing" v-text="t('common.publish')"></span>
            <span v-show="marketPublishing" class="loading loading-spinner loading-sm"></span>
          </button>
        </div>
      </form>
    </div>
  </dialog>
  <dialog
    class="modal modal-middle"
    :open="Boolean(!!marketDeleteAgentTarget)"
    v-show="marketDeleteAgentTarget"
    @click.self="marketDeleteAgentTarget = null"
  >
    <div class="modal-box confirm-box">
      <div class="dialog-head">
        <div>
          <div class="eyebrow" v-text="t('marketplace.deleteMarketplaceAgent')"></div>
          <h2>Remove <span v-text="marketDeleteAgentTarget?.name"></span>?</h2>
        </div>
        <button type="button" class="icon-btn" @click="marketDeleteAgentTarget = null" aria-label="Close delete dialog">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <p class="confirm-copy">
        This removes the published Marketplace listing and prevents future installs. Existing installed Agents and the
        original Agent will remain available.
      </p>
      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-ghost"
          @click="marketDeleteAgentTarget = null"
          v-text="t('common.cancel')"
        ></button>
        <button type="button" class="btn btn-error" @click="confirmDeleteMarketAgent()" :disabled="marketDeletingAgent">
          <span v-show="!marketDeletingAgent" v-text="t('common.delete')"></span>
          <span v-show="marketDeletingAgent" class="loading loading-spinner loading-sm"></span>
        </button>
      </div>
    </div>
  </dialog>
  <dialog
    class="modal modal-middle"
    :open="Boolean(!!marketInstallAgentTarget)"
    v-show="marketInstallAgentTarget"
    @click.self="marketInstallAgentTarget = null"
  >
    <div class="modal-box confirm-box">
      <div class="dialog-head">
        <div>
          <div class="eyebrow" v-text="t('marketplace.installAgent')"></div>
          <h2>Install <span v-text="marketInstallAgentTarget?.name"></span>?</h2>
        </div>
        <button
          type="button"
          class="icon-btn"
          @click="marketInstallAgentTarget = null"
          aria-label="Close install dialog"
        >
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <p class="confirm-copy">
        A private copy of version <b v-text="marketInstallAgentTarget?.version"></b> will be added to your Agents. Your
        changes will not affect the original.
      </p>
      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-ghost"
          @click="marketInstallAgentTarget = null"
          v-text="t('common.cancel')"
        ></button>
        <button
          type="button"
          class="btn btn-primary"
          @click="confirmInstallMarketAgent()"
          :disabled="marketInstallingAgent"
        >
          <span v-show="!marketInstallingAgent" v-text="t('common.install')"></span>
          <span v-show="marketInstallingAgent" class="loading loading-spinner loading-sm"></span>
        </button>
      </div>
    </div>
  </dialog>
</template>
