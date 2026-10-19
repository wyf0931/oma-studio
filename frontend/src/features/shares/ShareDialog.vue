<script setup lang="ts">
import { toRefs } from "vue";
import { useShares } from "./context";
import { useI18n } from "../../shared/i18n-context";

import OmaIcon from "../../ui/Icon.vue";
const sharesFeature = useShares();
const { copiedShare, shareStep, shareTarget, shareUrl } = toRefs(sharesFeature.state);
const { closeShareDialog, copyShareLink } = sharesFeature;
const i18nFeature = useI18n();
const { t } = i18nFeature;
</script>
<template>
  <dialog
    class="modal modal-middle"
    :open="Boolean(shareStep !== null)"
    v-show="shareStep !== null"
    @click.self="closeShareDialog()"
  >
    <div class="modal-box share-dialog">
      <div class="dialog-head">
        <h2 v-text="shareTarget === 'artifact' ? t('share.fileShareTitle') : t('share.shareLink')"></h2>
        <button type="button" class="icon-btn" @click="closeShareDialog()" :aria-label="t('share.close')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <template v-if="shareStep === 'created'"
        ><div class="share-dialog-body">
          <p class="share-warning" v-show="shareTarget !== 'artifact'" v-text="t('share.anyoneWithLink')"></p>
          <div class="share-link-row">
            <p class="share-link-note" v-show="shareTarget === 'artifact'" v-text="t('share.fileShareNote')"></p>
            <input
              class="share-link-input"
              :value="shareUrl"
              readonly
              @focus="($event.target as HTMLInputElement).select()"
              :aria-label="t('share.shareLink')"
            />
            <button type="button" class="btn btn-primary copy-link-btn" @click="copyShareLink()">
              <span v-text="copiedShare ? t('share.copied') : t('share.copy')"></span>
            </button>
          </div></div
      ></template>
    </div>
  </dialog>
</template>
