<script setup lang="ts">
import OmaIcon from "../../ui/Icon.vue";
import { useWorkspaceScope } from "../../app/scope";
const {
  autopilotDeleteTarget,
  autopilotRuns,
  autopilotRunsItem,
  autopilotRunsOpen,
  confirmDeleteAutopilot,
  formatDateTime,
  runAutopilot,
  statusLabel,
  t,
} = useWorkspaceScope([
  "autopilotDeleteTarget",
  "autopilotRuns",
  "autopilotRunsItem",
  "autopilotRunsOpen",
  "confirmDeleteAutopilot",
  "formatDateTime",
  "runAutopilot",
  "statusLabel",
  "t",
]);
</script>
<template>
  <dialog
    class="modal modal-middle"
    :open="Boolean(autopilotRunsOpen)"
    v-show="autopilotRunsOpen"
    @click.self="autopilotRunsOpen = false"
  >
    <div class="modal-box autopilot-runs-dialog">
      <div class="dialog-head">
        <div>
          <div class="eyebrow" v-text="t('autopilots.runHistory')"></div>
          <h2 v-text="autopilotRunsItem?.name || 'Autopilot'"></h2>
        </div>
        <div class="dialog-head-actions">
          <button class="icon-btn" @click="autopilotRunsOpen = false" :aria-label="t('common.close')">
            <OmaIcon name="x" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div class="autopilot-runs-toolbar">
        <button class="btn btn-sm btn-primary" @click="autopilotRunsItem && runAutopilot(autopilotRunsItem)">
          <OmaIcon name="play" aria-hidden="true" /><span v-text="t('autopilots.run')"></span>
        </button>
      </div>
      <div class="autopilot-runs-table">
        <template v-if="!autopilotRuns.length"
          ><div class="files-empty" v-text="t('autopilots.noRuns')"></div
        ></template>
        <table class="table" v-show="autopilotRuns.length">
          <thead>
            <tr>
              <th v-text="t('autopilots.started')"></th>
              <th v-text="t('autopilots.duration')"></th>
              <th v-text="t('common.status')"></th>
              <th v-text="t('autopilots.session')"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="run in autopilotRuns" :key="run.id"
              ><tr class="bg-base-200">
                <td v-text="formatDateTime(run.started_at)"></td>
                <td v-text="run.duration_ms ? (run.duration_ms / 1000).toFixed(1) + 's' : '—'"></td>
                <td>
                  <span
                    class="badge badge-soft"
                    :class="
                      run.status === 'success'
                        ? 'badge-success'
                        : run.status === 'error'
                          ? 'badge-error'
                          : run.status === 'cancelled'
                            ? 'badge-warning'
                            : 'badge-ghost'
                    "
                    v-text="statusLabel(run.status)"
                  ></span>
                </td>
                <td>
                  <a
                    class="btn btn-sm btn-ghost"
                    :href="'/chat/' + run.chat_id"
                    :title="t('autopilots.openSession')"
                    :aria-label="t('autopilots.openSession')"
                    ><OmaIcon name="square-arrow-out-up-right" aria-hidden="true"
                  /></a>
                </td></tr
            ></template>
          </tbody>
        </table>
      </div>
    </div>
  </dialog>
  <dialog
    class="modal modal-middle"
    :open="Boolean(autopilotDeleteTarget)"
    v-show="autopilotDeleteTarget"
    @click.self="autopilotDeleteTarget = null"
  >
    <div class="modal-box confirm-box">
      <div class="dialog-head">
        <div>
          <div class="eyebrow" v-text="t('dialogs.deleteAutopilot')"></div>
          <h2>Remove <span v-text="autopilotDeleteTarget?.name"></span>?</h2>
        </div>
        <button class="icon-btn" @click="autopilotDeleteTarget = null" :aria-label="t('common.close')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <p class="confirm-copy">
        This removes the automation definition. Existing sessions and run history remain available.
      </p>
      <div class="dialog-actions">
        <button class="btn btn-sm btn-ghost" @click="autopilotDeleteTarget = null" v-text="t('common.cancel')"></button
        ><button class="btn btn-sm btn-error" @click="confirmDeleteAutopilot()" v-text="t('common.delete')"></button>
      </div>
    </div>
  </dialog>
</template>
