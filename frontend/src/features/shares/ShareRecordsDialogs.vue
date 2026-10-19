<script setup lang="ts">
import { toRefs } from "vue";
import { useShares } from "./context";
import { useFormat } from "../../shared/format-context";
import { useI18n } from "../../shared/i18n-context";

import OmaIcon from "../../ui/Icon.vue";
const sharesFeature = useShares();
const { shareRecords, shareRecordsLoading, shareRecordsOpen, shareRevokeTarget, shareRevoking } = toRefs(
  sharesFeature.state,
);
const { confirmRevokeShare, requestRevokeShare, shareRecordTitle, shareRecordUrl } = sharesFeature;
const formatFeature = useFormat();
const { formatDateTime } = formatFeature;
const i18nFeature = useI18n();
const { t } = i18nFeature;
</script>
<template>
  <dialog
    class="modal modal-middle share-records-dialog"
    :open="Boolean(shareRecordsOpen)"
    v-show="shareRecordsOpen"
    @click.self="shareRecordsOpen = false"
  >
    <div class="modal-box usage-modal-box users-modal-box">
      <div class="usage-header">
        <div>
          <div class="eyebrow" v-text="t('share.recordsEyebrow')"></div>
          <h2 v-text="t('share.recordsTitle')"></h2>
          <p v-text="t('share.recordsSubtitle')"></p>
        </div>
        <button type="button" class="icon-btn" @click="shareRecordsOpen = false" :aria-label="t('share.closeRecords')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <div class="usage-body users-body">
        <div class="users-table-wrap overflow-x-auto">
          <div class="users-loading" v-show="shareRecordsLoading">
            <span class="loading loading-dots loading-sm"></span>
          </div>
          <table class="table" v-show="!shareRecordsLoading && shareRecords.length">
            <thead>
              <tr>
                <th v-text="t('share.sessionOrFile')"></th>
                <th v-text="t('share.shareId')"></th>
                <th v-text="t('share.sharedAt')"></th>
                <th v-text="t('users.actions')"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="share in shareRecords" :key="share.token">
                <tr class="bg-base-200">
                  <td v-text="shareRecordTitle(share)"></td>
                  <td>
                    <a
                      class="share-record-id"
                      :href="shareRecordUrl(share)"
                      target="_blank"
                      rel="noopener noreferrer"
                      :aria-label="t('share.openShareRecord') + ' ' + share.token"
                      ><code v-text="share.token"></code
                    ></a>
                  </td>
                  <td v-text="formatDateTime(share.created_at)"></td>
                  <td>
                    <button
                      type="button"
                      class="btn btn-ghost btn-error btn-sm btn-square"
                      @click="requestRevokeShare(share)"
                      :aria-label="t('share.revoke') + ' ' + share.title"
                      :title="t('share.revoke')"
                    >
                      <OmaIcon name="link-2-off" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <div
            class="market-empty"
            v-show="!shareRecordsLoading && !shareRecords.length"
            v-text="t('share.noRecords')"
          ></div>
        </div>
      </div>
    </div>
  </dialog>
  <dialog
    class="modal modal-middle"
    :open="Boolean(!!shareRevokeTarget)"
    v-show="shareRevokeTarget"
    @click.self="shareRevokeTarget = null"
  >
    <div class="modal-box confirm-box">
      <div class="dialog-head">
        <div>
          <div class="eyebrow" v-text="t('share.revoke')"></div>
          <h2 v-text="t('share.revokeTitle')"></h2>
        </div>
        <button type="button" class="icon-btn" @click="shareRevokeTarget = null" :aria-label="t('common.close')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <p class="confirm-copy" v-text="t('share.revokeWarning')"></p>
      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-ghost"
          @click="shareRevokeTarget = null"
          v-text="t('common.cancel')"
        ></button>
        <button type="button" class="btn btn-error" @click="confirmRevokeShare()" :disabled="shareRevoking">
          <span v-show="!shareRevoking" v-text="t('share.revoke')"></span>
          <span v-show="shareRevoking" class="loading loading-spinner loading-sm"></span>
        </button>
      </div>
    </div>
  </dialog>
</template>
