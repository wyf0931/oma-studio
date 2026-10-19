<script setup lang="ts">
import { toRefs } from "vue";
import { useAgents } from "../agents/context";
import { useAutopilots } from "./context";
import { useFormat } from "../../shared/format-context";
import { useI18n } from "../../shared/i18n-context";

import { vOutside } from "../../ui/events";
import OmaIcon from "../../ui/Icon.vue";
const agentsFeature = useAgents();
const { agents } = toRefs(agentsFeature.state);
const { agentName } = agentsFeature;
const autopilotsFeature = useAutopilots();
const {
  autopilotAgentId,
  autopilotCron,
  autopilotDialog,
  autopilotEditAgentPickerOpen,
  autopilotEditing,
  autopilotEndsAt,
  autopilotInstruction,
  autopilotName,
  autopilotSaving,
  autopilotStartsAt,
} = toRefs(autopilotsFeature.state);
const { openCronBuilder, saveAutopilot, selectAutopilotEditAgent } = autopilotsFeature;
const formatFeature = useFormat();
const { initials } = formatFeature;
const i18nFeature = useI18n();
const { t } = i18nFeature;
</script>
<template>
  <dialog
    class="modal modal-middle"
    :open="Boolean(autopilotDialog)"
    v-show="autopilotDialog"
    @click.self="autopilotDialog = false"
  >
    <div class="modal-box autopilot-dialog">
      <div class="dialog-head">
        <div>
          <div class="eyebrow" v-text="t('autopilots.automation')"></div>
          <h2 v-text="autopilotEditing ? t('autopilots.edit') : t('autopilots.newTitle')"></h2>
        </div>
        <button class="icon-btn" @click="autopilotDialog = false" :aria-label="t('common.close')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <form @submit.prevent="saveAutopilot">
        <div class="form-field">
          <label for="autopilot-name" v-text="t('common.name')"></label
          ><input
            id="autopilot-name"
            class="input input-bordered"
            v-model="autopilotName"
            required
            maxlength="80"
            :placeholder="t('autopilots.namePlaceholder')"
          />
        </div>
        <div class="form-field">
          <label for="autopilot-instruction" v-text="t('agents.instruction')"></label
          ><textarea
            id="autopilot-instruction"
            class="textarea textarea-bordered"
            v-model="autopilotInstruction"
            required
            maxlength="10000"
            :placeholder="t('autopilots.instructionPlaceholder')"
          ></textarea>
        </div>
        <div class="autopilot-form-grid">
          <div class="form-field">
            <label for="autopilot-agent" v-text="t('common.agent')"></label>
            <div
              class="agent-picker"
              v-outside="
                () => {
                  autopilotEditAgentPickerOpen = false;
                }
              "
            >
              <button
                type="button"
                class="agent-picker-button"
                @click="autopilotEditAgentPickerOpen = !autopilotEditAgentPickerOpen"
                :aria-expanded="autopilotEditAgentPickerOpen"
                aria-haspopup="listbox"
                :aria-label="t('autopilots.selectAgent')"
              >
                <span class="agent-avatar" v-text="initials(agentName(autopilotAgentId))"></span>
                <span class="filter-agent-picker-label" v-text="agentName(autopilotAgentId)"></span>
                <OmaIcon class="picker-chevron" name="chevron-down" aria-hidden="true" />
              </button>
              <div class="agent-picker-menu" v-show="autopilotEditAgentPickerOpen" role="listbox">
                <template v-for="agent in agents" :key="agent.id">
                  <button
                    type="button"
                    class="agent-picker-option"
                    @click="selectAutopilotEditAgent(agent.id)"
                    role="option"
                    :aria-selected="autopilotAgentId === agent.id"
                  >
                    <span class="agent-avatar" v-text="initials(agent.name)"></span>
                    <span><b v-text="agent.name"></b></span>
                  </button>
                </template>
              </div>
            </div>
          </div>
          <div class="form-field">
            <label for="autopilot-cron" v-text="t('autopilots.cron')"></label
            ><input
              id="autopilot-cron"
              class="input input-bordered mono"
              v-model="autopilotCron"
              readonly
              @focus="openCronBuilder()"
              @click="openCronBuilder()"
              required
              :aria-label="t('autopilots.cronSchedule')"
            />
          </div>
        </div>
        <details class="collapse collapse-arrow autopilot-advanced">
          <summary class="collapse-title" v-text="t('autopilots.advanced')"></summary>
          <div class="collapse-content">
            <div class="form-field">
              <label for="autopilot-starts" v-text="t('autopilots.effectiveFrom')"></label
              ><input
                id="autopilot-starts"
                type="datetime-local"
                class="input input-bordered"
                v-model="autopilotStartsAt"
              />
            </div>
            <div class="form-field">
              <label for="autopilot-ends" v-text="t('autopilots.effectiveUntil')"></label
              ><input
                id="autopilot-ends"
                type="datetime-local"
                class="input input-bordered"
                v-model="autopilotEndsAt"
              />
            </div>
          </div>
        </details>
        <div class="dialog-actions">
          <button
            type="button"
            class="btn btn-sm btn-ghost"
            @click="autopilotDialog = false"
            v-text="t('common.cancel')"
          ></button
          ><button
            type="submit"
            class="btn btn-sm btn-primary"
            :disabled="autopilotSaving"
            v-text="autopilotEditing ? t('common.save') : t('autopilots.create')"
          ></button>
        </div>
      </form>
    </div>
  </dialog>
</template>
