<script setup lang="ts">
import { toRefs } from "vue";
import { useAgents } from "./context";
import { useDom } from "../../shared/dom-context";
import { useI18n } from "../../shared/i18n-context";

import OmaIcon from "../../ui/Icon.vue";
const agentsFeature = useAgents();
const {
  agentSkillSearch,
  agentWizardStep,
  confirmTarget,
  createDialog,
  creating,
  editingAgent,
  generatingInstruction,
  newAgentAvatarPreview,
  newAgentDescription,
  newAgentExtensions,
  newAgentInstruction,
  newAgentMcpServers,
  newAgentModel,
  newAgentName,
  newAgentProvider,
  newAgentQuickstarts,
  newAgentSkills,
  newAgentTags,
  newAgentThinkingLevel,
  resources,
  toolGroups,
} = toRefs(agentsFeature.state);
const {
  agentSkillItems,
  autoModelConfigLabel,
  avatarUrl,
  changeAgentModel,
  changeAgentProvider,
  closeAgentDialog,
  confirmDelete,
  dismissAgentDialogFromBackdrop,
  generateAgentInstruction,
  modelsFor,
  nextAgentWizardStep,
  previousAgentWizardStep,
  setAgentWizardStep,
  submitAgent,
  thinkingLevelsFor,
  toggleResource,
  toggleToolGroup,
  toolGroupState,
  uploadAgentAvatar,
  usesAutoModelConfig,
} = agentsFeature;
const domFeature = useDom();
const { resizeAgentTextarea } = domFeature;
const i18nFeature = useI18n();
const { t } = i18nFeature;
</script>
<template>
  <dialog class="modal" :open="Boolean(!!confirmTarget)" v-show="confirmTarget" @click.self="confirmTarget = null">
    <div class="modal-box confirm-box">
      <div class="dialog-head">
        <div>
          <div class="eyebrow" v-text="t('dialogs.deleteAgent')"></div>
          <h2><span v-text="t('common.remove')"></span> <span v-text="confirmTarget?.name"></span>?</h2>
        </div>
        <button class="icon-btn" @click="confirmTarget = null" :aria-label="t('common.close')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <p class="confirm-copy">
        This agent definition will be removed. Existing chat sessions and their Pi history will remain available.
      </p>
      <div class="dialog-actions">
        <button type="button" class="btn btn-ghost" @click="confirmTarget = null" v-text="t('common.cancel')"></button
        ><button type="button" class="btn btn-error" @click="confirmDelete()" v-text="t('agents.deleteAgent')"></button>
      </div>
    </div>
  </dialog>
  <dialog
    class="modal modal-middle agent-dialog"
    :open="Boolean(createDialog)"
    v-show="createDialog"
    @click.self="dismissAgentDialogFromBackdrop()"
  >
    <div class="modal-box agent-dialog-box">
      <div class="dialog-head">
        <div>
          <h2 class="text-lg font-bold agent-wizard-title" v-text="editingAgent ? 'Edit Agent' : 'New Agent'"></h2>
        </div>
        <button class="icon-btn" @click="closeAgentDialog()" :aria-label="t('common.close')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <form @submit.prevent="agentWizardStep === 3 && submitAgent()">
        <ul class="steps agent-wizard-steps" aria-label="Agent setup steps">
          <li
            class="step"
            :class="{ 'step-primary': agentWizardStep >= 1 }"
            data-content="1"
            role="button"
            tabindex="0"
            @click="setAgentWizardStep(1)"
            @keydown.enter.prevent="setAgentWizardStep(1)"
          >
            Basics
          </li>
          <li
            class="step"
            :class="{ 'step-primary': agentWizardStep >= 2 }"
            data-content="2"
            role="button"
            tabindex="0"
            @click="setAgentWizardStep(2)"
            @keydown.enter.prevent="setAgentWizardStep(2)"
          >
            Permissions
          </li>
          <li
            class="step"
            :class="{ 'step-primary': agentWizardStep >= 3 }"
            data-content="3"
            role="button"
            tabindex="0"
            @click="setAgentWizardStep(3)"
            @keydown.enter.prevent="setAgentWizardStep(3)"
          >
            Capabilities
          </li>
        </ul>
        <div class="divider agent-wizard-divider"></div>

        <section class="agent-wizard-panel" v-show="agentWizardStep === 1">
          <div class="agent-form-intro">
            <div class="avatar-upload-panel">
              <input
                id="new-agent-avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                @change="uploadAgentAvatar($event)"
                hidden
              />
              <label class="avatar-upload" for="new-agent-avatar">
                <template v-if="newAgentAvatarPreview || (editingAgent && avatarUrl(editingAgent))"
                  ><img class="avatar-upload-image" :src="newAgentAvatarPreview || avatarUrl(editingAgent)" alt=""
                /></template>
                <template v-if="!newAgentAvatarPreview && !(editingAgent && avatarUrl(editingAgent))"
                  ><span class="avatar-upload-placeholder">
                    <OmaIcon name="image-plus" aria-hidden="true" />
                    <span>Choose avatar</span>
                  </span></template
                >
              </label>
              <p class="avatar-upload-note">JPEG, PNG, WebP, or GIF · 5 MB max</p>
            </div>
            <div class="agent-form-main">
              <div class="form-field">
                <label for="new-agent-name">name</label
                ><input
                  id="new-agent-name"
                  class="input input-bordered"
                  v-model="newAgentName"
                  required
                  maxlength="80"
                  placeholder="e.g. researcher"
                />
              </div>
              <div class="form-field">
                <label for="new-agent-tags">tags <small>(up to 5, comma-separated)</small></label>
                <input
                  id="new-agent-tags"
                  class="input input-bordered"
                  v-model="newAgentTags"
                  placeholder="e.g. Research, Writing, Strategy"
                />
              </div>
            </div>
          </div>
          <div class="agent-form-content agent-wizard-basics">
            <div class="form-field">
              <label for="new-agent-description">description</label>
              <textarea
                id="new-agent-description"
                class="textarea textarea-bordered"
                v-model="newAgentDescription"
                @input="resizeAgentTextarea($event)"
                maxlength="240"
                rows="1"
                placeholder="Describe the result this Agent helps users achieve…"
              ></textarea>
            </div>
            <div class="form-field">
              <label for="new-agent-quickstarts">shortcuts <small>(3-5 prompts, one per line)</small></label>
              <textarea
                id="new-agent-quickstarts"
                class="textarea textarea-bordered"
                v-model="newAgentQuickstarts"
                @input="resizeAgentTextarea($event)"
                maxlength="1200"
                rows="1"
                placeholder="Help me…\nReview this…"
              ></textarea>
            </div>
            <div class="form-field agent-instruction-field">
              <label class="agent-section-label" for="new-agent-instruction">Instruction</label>
              <div class="instruction-textarea-wrap">
                <textarea
                  id="new-agent-instruction"
                  class="textarea textarea-bordered"
                  v-model="newAgentInstruction"
                  @input="resizeAgentTextarea($event)"
                  required
                  maxlength="10000"
                  rows="1"
                  placeholder="Tell this agent how it should behave…"
                ></textarea>
              </div>
            </div>
          </div>
        </section>

        <section class="agent-wizard-panel" v-show="agentWizardStep === 2">
          <div class="form-field agent-provider-row">
            <label class="agent-section-label">Provider</label>
            <div class="agent-model-fields">
              <div class="form-field">
                <label for="new-agent-provider">Provider</label
                ><select
                  id="new-agent-provider"
                  class="select select-bordered"
                  v-model="newAgentProvider"
                  @change="changeAgentProvider()"
                >
                  <option value="">Auto (system default)</option>
                  <template v-for="provider in resources.providers" :key="provider.id"
                    ><option :value="provider.id" v-text="provider.name"></option
                  ></template>
                </select>
              </div>
              <div class="form-field">
                <label for="new-agent-model">Model</label
                ><select
                  id="new-agent-model"
                  class="select select-bordered"
                  v-model="newAgentModel"
                  @change="changeAgentModel()"
                  :disabled="!newAgentProvider"
                >
                  <option value="">Auto</option>
                  <template v-for="model in modelsFor()" :key="model.id"
                    ><option :value="model.id" v-text="model.name"></option
                  ></template>
                </select>
              </div>
              <div class="form-field">
                <label for="new-agent-thinking">Thinking effort</label
                ><select
                  id="new-agent-thinking"
                  class="select select-bordered"
                  v-model="newAgentThinkingLevel"
                  :disabled="!newAgentProvider || !newAgentModel"
                >
                  <option value="">Auto</option>
                  <template v-for="level in thinkingLevelsFor()" :key="level"
                    ><option :value="level" v-text="level"></option
                  ></template>
                </select>
              </div>
            </div>
            <p
              class="agent-model-auto-note"
              v-show="usesAutoModelConfig()"
              v-text="'Auto uses: ' + autoModelConfigLabel()"
            ></p>
          </div>
          <div class="form-field">
            <label class="agent-section-label">Built-in tools</label>
            <div class="tool-group-grid">
              <template v-for="group in toolGroups" :key="group.id">
                <label class="tool-group" :title="group.description">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :checked="toolGroupState(group) === 'all'"
                    :indeterminate="toolGroupState(group) === 'partial'"
                    @change="toggleToolGroup(group)"
                  />
                  <span class="tool-group-copy">
                    <b v-text="group.label"></b>
                    <small class="tool-group-tools" v-text="group.tools.join(' · ')"></small>
                  </span>
                </label>
              </template>
            </div>
          </div>
          <div class="form-field">
            <label class="agent-section-label">Extensions</label>
            <div class="resource-check-grid">
              <template v-if="resources.extensions.length === 0"
                ><span class="resource-empty">No extensions discovered</span></template
              ><template v-for="item in resources.extensions" :key="item.id"
                ><label class="resource-check" :title="item.description || item.path"
                  ><input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :value="item.path"
                    :checked="newAgentExtensions.includes(item.path)"
                    @change="toggleResource('extensions', item.path)" /><span
                    ><b v-text="item.name"></b><small v-text="item.description || item.path"></small></span></label
              ></template>
            </div>
          </div>
          <div class="form-field">
            <label class="agent-section-label">MCP servers</label>
            <div class="resource-check-grid mcp-check-grid">
              <template v-if="resources.mcp_servers.length === 0"
                ><span class="resource-empty">No MCP servers discovered</span></template
              ><template v-for="server in resources.mcp_servers" :key="server.id"
                ><label class="resource-check" :title="server.path"
                  ><input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :value="server.id"
                    :checked="newAgentMcpServers.includes(server.id)"
                    @change="toggleResource('mcp', server.id)" /><span
                    ><b v-text="server.name"></b
                    ><small v-text="server.description || server.path"></small></span></label
              ></template>
            </div>
          </div>
        </section>

        <section class="agent-wizard-panel" v-show="agentWizardStep === 3">
          <div class="form-field agent-skills-field">
            <label class="agent-section-label" for="agent-skill-search">Skills</label>
            <input
              id="agent-skill-search"
              class="input input-bordered agent-skill-search"
              v-model="agentSkillSearch"
              type="search"
              placeholder="Search skills by name or description…"
            />
            <div class="resource-check-grid agent-skills-grid">
              <template v-if="resources.skills.length === 0"
                ><span class="resource-empty">No skills discovered</span></template
              ><template v-if="resources.skills.length && agentSkillItems().length === 0"
                ><span class="resource-empty">No matching skills</span></template
              ><template v-for="item in agentSkillItems()" :key="item.id"
                ><label class="resource-check" :title="item.description || item.path"
                  ><input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :value="item.path"
                    :checked="newAgentSkills.includes(item.path)"
                    @change="toggleResource('skills', item.path)" /><span
                    ><b v-text="item.name"></b><small v-text="item.description || item.path"></small></span></label
              ></template>
            </div>
          </div>
        </section>

        <div class="dialog-actions agent-wizard-actions">
          <button type="button" class="btn btn-sm btn-ghost" @click="closeAgentDialog()">Cancel</button>
          <button
            type="button"
            class="btn btn-sm btn-ghost agent-optimize-button"
            :disabled="generatingInstruction"
            @click="generateAgentInstruction"
            title="Optimize agent profile"
          >
            <OmaIcon v-show="!generatingInstruction" name="pencil-sparkles" aria-hidden="true" />
            <span v-show="generatingInstruction" class="loading loading-spinner loading-xs" aria-hidden="true"></span>
            <span v-text="generatingInstruction ? 'Optimizing' : 'Optimize'"></span>
          </button>
          <span class="agent-wizard-action-spacer"></span>
          <button
            type="button"
            class="btn btn-sm btn-ghost"
            v-show="agentWizardStep > 1"
            @click="previousAgentWizardStep()"
          >
            Back
          </button>
          <button
            type="button"
            class="btn btn-sm btn-primary"
            v-show="agentWizardStep < 3"
            @click="nextAgentWizardStep()"
          >
            Next
          </button>
          <button type="submit" class="btn btn-sm btn-primary" v-show="agentWizardStep === 3" :disabled="creating">
            <span v-text="editingAgent ? 'Save' : 'Create'"></span>
          </button>
        </div>
      </form>
    </div>
  </dialog>
</template>
