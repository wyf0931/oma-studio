<script setup lang="ts">
import { useDebouncedCallback } from "../../ui/events";
import { vOutside } from "../../ui/events";
import OmaIcon from "../../ui/Icon.vue";
import { useWorkspaceScope } from "../../app/scope";
const {
  agentName,
  agents,
  autopilotAgentFilter,
  autopilotAgentPickerOpen,
  autopilotLoading,
  autopilotSearch,
  autopilots,
  deleteAutopilot,
  editAutopilot,
  formatDateTime,
  initials,
  loadAutopilotRuns,
  loadAutopilots,
  newAutopilot,
  page,
  runAutopilot,
  selectAutopilotAgent,
  statusLabel,
  t,
  toggleAutopilot,
} = useWorkspaceScope([
  "agentName",
  "agents",
  "autopilotAgentFilter",
  "autopilotAgentPickerOpen",
  "autopilotLoading",
  "autopilotSearch",
  "autopilots",
  "deleteAutopilot",
  "editAutopilot",
  "formatDateTime",
  "initials",
  "loadAutopilotRuns",
  "loadAutopilots",
  "newAutopilot",
  "page",
  "runAutopilot",
  "selectAutopilotAgent",
  "statusLabel",
  "t",
  "toggleAutopilot",
]);
const debounceSearch = useDebouncedCallback(() => {
  void loadAutopilots.value();
});
</script>
<template>
  <section class="content-panel autopilots-page" v-show="page === 'autopilots'">
    <div class="page-heading">
      <div>
        <h1 v-text="t('autopilots.title')"></h1>
        <p v-text="t('autopilots.subtitle')"></p>
      </div>
    </div>
    <div class="autopilot-filters">
      <div
        class="agent-picker filter-agent-picker"
        v-outside="
          () => {
            autopilotAgentPickerOpen = false;
          }
        "
      >
        <button
          type="button"
          class="agent-picker-button filter-agent-picker-button"
          @click="autopilotAgentPickerOpen = !autopilotAgentPickerOpen"
          :aria-expanded="autopilotAgentPickerOpen"
          aria-haspopup="listbox"
          :aria-label="t('autopilots.filterByAgent')"
        >
          <span
            class="agent-avatar"
            v-text="initials(autopilotAgentFilter ? agentName(autopilotAgentFilter) : 'All')"
          ></span>
          <span
            class="filter-agent-picker-label"
            v-text="autopilotAgentFilter ? agentName(autopilotAgentFilter) : t('common.all')"
          ></span>
          <OmaIcon class="picker-chevron" name="chevron-down" aria-hidden="true" />
        </button>
        <div class="agent-picker-menu filter-agent-picker-menu" v-show="autopilotAgentPickerOpen" role="listbox">
          <button type="button" class="agent-picker-option" @click="selectAutopilotAgent('')">
            <span class="agent-avatar" v-text="initials('All')"></span>
            <span><b v-text="t('common.all')"></b></span>
          </button>
          <template v-for="agent in agents" :key="agent.id">
            <button type="button" class="agent-picker-option" @click="selectAutopilotAgent(agent.id)">
              <span class="agent-avatar" v-text="initials(agent.name)"></span>
              <span><b v-text="agent.name"></b></span>
            </button>
          </template>
        </div>
      </div>
      <label class="library-search"
        ><OmaIcon name="search" aria-hidden="true" /><input
          class="input"
          v-model="autopilotSearch"
          @input="debounceSearch"
          :placeholder="t('autopilots.search')"
          :aria-label="t('autopilots.search')"
      /></label>
      <button class="btn btn-soft btn-primary autopilot-new" @click="newAutopilot()">
        <OmaIcon name="plus" aria-hidden="true" /><span v-text="t('autopilots.new')"></span>
      </button>
    </div>
    <div class="autopilot-table-wrap">
      <template v-if="autopilotLoading"
        ><div class="files-empty">
          <span class="loading loading-dots loading-sm"></span></div></template
      ><template v-if="!autopilotLoading && autopilots.length === 0"
        ><div class="files-empty">No autopilots yet</div></template
      >
      <table class="table autopilot-table" v-show="!autopilotLoading && autopilots.length">
        <thead>
          <tr>
            <th v-text="t('common.name')"></th>
            <th v-text="t('common.agent')"></th>
            <th v-text="t('autopilots.schedule')"></th>
            <th v-text="t('common.status')"></th>
            <th v-text="t('common.actions')"></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="item in autopilots" :key="item.id"
            ><tr class="bg-base-200">
              <td>
                <button class="autopilot-name" @click="loadAutopilotRuns(item)">
                  <b v-text="item.name"></b><small v-text="item.instruction"></small>
                </button>
              </td>
              <td v-text="item.agent_name"></td>
              <td>
                <span class="mono" v-text="item.cron"></span
                ><small
                  class="autopilot-next"
                  v-text="item.next_run_at ? 'Next ' + formatDateTime(item.next_run_at) : '—'"
                ></small>
              </td>
              <td>
                <span
                  class="badge badge-soft"
                  :class="item.enabled ? 'badge-success' : 'badge-ghost'"
                  v-text="statusLabel(item.status)"
                ></span>
              </td>
              <td>
                <div class="autopilot-actions">
                  <input
                    type="checkbox"
                    class="toggle toggle-sm toggle-primary"
                    :checked="item.enabled"
                    @change="toggleAutopilot(item)"
                    :aria-label="'Toggle ' + item.name"
                  /><button
                    class="btn btn-sm btn-ghost"
                    @click="runAutopilot(item)"
                    title="Run now"
                    aria-label="Run now"
                  >
                    <OmaIcon name="play" aria-hidden="true" /></button
                  ><button class="btn btn-sm btn-ghost" @click="editAutopilot(item)" title="Edit" aria-label="Edit">
                    <OmaIcon name="square-pen" aria-hidden="true" /></button
                  ><button
                    class="btn btn-sm btn-ghost text-error"
                    @click="deleteAutopilot(item)"
                    title="Delete"
                    aria-label="Delete"
                  >
                    <OmaIcon name="trash-2" aria-hidden="true" /></button
                  ><button
                    class="btn btn-sm btn-ghost"
                    @click="loadAutopilotRuns(item)"
                    :title="t('autopilots.runHistory')"
                    :aria-label="t('autopilots.runHistory')"
                  >
                    <OmaIcon name="rotate-ccw-clock" aria-hidden="true" />
                  </button>
                </div>
              </td></tr
          ></template>
        </tbody>
      </table>
    </div>
  </section>
</template>
