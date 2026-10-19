<script setup lang="ts">
import { toRefs } from "vue";
import { useAgents } from "./context";
import { useIdentity } from "../identity/context";
import { useChat } from "../chat/context";
import { useI18n } from "../../shared/i18n-context";

import OmaIcon from "../../ui/Icon.vue";
const agentsFeature = useAgents();
const { dialog } = toRefs(agentsFeature.state);
const { agentAvatarMarkup, agentSkills, agentTagsMarkup, modelName, providerName, resourceNames } = agentsFeature;
const identityFeature = useIdentity();
const { authUser } = toRefs(identityFeature.state);
const chatFeature = useChat();
const { startQuickstart } = chatFeature;
const i18nFeature = useI18n();
const { t } = i18nFeature;
</script>
<template>
  <dialog class="modal modal-middle agent-dialog" :open="Boolean(!!dialog)" v-show="dialog" @click.self="dialog = null">
    <template v-if="dialog"
      ><div class="modal-box agent-dialog-box">
        <div class="agent-dialog-toolbar">
          <button class="icon-btn" @click="dialog = null">
            <OmaIcon name="x" aria-hidden="true" />
          </button>
        </div>
        <div class="detail-group">
          <div class="agent-profile-identity">
            <span class="agent-avatar-slot" data-rendered-content="" v-html="agentAvatarMarkup(dialog, 'large')"></span>
            <div class="agent-profile-copy">
              <h3 v-text="dialog.name"></h3>
              <p v-text="dialog.description || 'Ready to help with your work.'"></p>
              <div
                class="agent-profile-tags"
                v-show="dialog.tags?.length"
                data-rendered-content=""
                v-html="agentTagsMarkup(dialog.tags)"
              ></div>
            </div>
          </div>
        </div>
        <div class="detail-group">
          <div class="detail-heading" v-text="t('agents.tryAsking')"></div>
          <div class="agent-quickstarts" v-show="dialog.quickstarts?.length">
            <template v-for="prompt in dialog.quickstarts" :key="prompt">
              <button type="button" class="agent-quickstart" @click="startQuickstart(dialog, prompt)">
                <span v-text="prompt"></span><OmaIcon name="arrow-right" aria-hidden="true" />
              </button>
            </template>
          </div>
          <p class="agent-detail-empty" v-show="!dialog.quickstarts?.length" v-text="t('agents.startNewChat')"></p>
        </div>
        <div class="detail-group">
          <div class="detail-heading" v-text="t('agents.builtInSkills')"></div>
          <div class="agent-skill-list" v-show="agentSkills(dialog).length">
            <template v-for="skill in agentSkills(dialog)" :key="skill.path">
              <div class="agent-skill-row">
                <div class="agent-skill-copy">
                  <b v-text="skill.name"></b
                  ><small
                    class="agent-skill-description"
                    :title="skill.description || t('agents.readyToUse')"
                    v-text="skill.description || t('agents.readyToUse')"
                  ></small>
                </div>
              </div>
            </template>
          </div>
          <p class="agent-detail-empty" v-show="!agentSkills(dialog).length" v-text="t('agents.noSkills')"></p>
        </div>
        <details class="detail-group" v-show="authUser?.role === 'admin'">
          <summary class="detail-heading">
            <span v-text="t('agents.adminConfig')"></span>
            <OmaIcon name="chevron-down" aria-hidden="true" />
          </summary>
          <div class="reserved-grid">
            <div>
              <span v-text="t('agents.provider')"></span><b v-text="providerName(dialog.provider) || 'Pi default'"></b>
            </div>
            <div>
              <span v-text="t('agents.model')"></span
              ><b v-text="modelName(dialog.provider, dialog.model) || 'Pi default'"></b>
            </div>
            <div>
              <span v-text="t('agents.extensions')"></span
              ><b v-text="resourceNames(dialog.extensions, 'extensions')"></b>
            </div>
            <div>
              <span v-text="t('agents.tools')"></span
              ><b v-text="dialog.tools?.length ? dialog.tools.join(', ') : t('common.disabled')"></b>
            </div>
          </div>
        </details>
        <div class="dialog-actions">
          <button class="btn btn-sm btn-ghost" @click="dialog = null">Close</button>
        </div>
      </div></template
    >
  </dialog>
</template>
