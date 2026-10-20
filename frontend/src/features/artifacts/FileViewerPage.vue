<script setup lang="ts">
import { toRefs, watch, nextTick } from "vue";
import { useArtifacts } from "./context";
import { useShell } from "../../app/context";
import { useShares } from "../shares/context";
import { useI18n } from "../../shared/i18n-context";
import { useContent } from "../../shared/content-context";
import { useSettings } from "../settings/context";

import OmaIcon from "../../ui/Icon.vue";
const artifactsFeature = useArtifacts();
const { fileViewer, fileViewerExpired, sharingViewedFile } = toRefs(artifactsFeature.state);
const { fileViewerDownloadName, fileViewerDownloadUrl, leaveFileViewer, renderFilePreview, shareViewedFile } =
  artifactsFeature;
const shellFeature = useShell();
const { page } = toRefs(shellFeature.state);
const sharesFeature = useShares();
const { requestRevokeShare } = sharesFeature;
const i18nFeature = useI18n();
const { t } = i18nFeature;
const settingsFeature = useSettings();
const { theme } = toRefs(settingsFeature.state);
const content = useContent();
watch(
  () => [fileViewer.value?.content, theme.value],
  async () => {
    await nextTick();
    content.renderMermaidDiagrams();
  },
  { immediate: true, flush: "post" },
);
</script>
<template>
  <section class="content-panel file-view-page" v-show="page === 'file'">
    <div class="file-share-expired" v-show="fileViewerExpired">
      <OmaIcon class="file-share-expired-icon" name="link-2-off" aria-hidden="true" />
      <h1 v-text="t('share.linkExpiredTitle')"></h1>
      <p v-text="t('share.linkExpiredDescription')"></p>
    </div>
    <div v-show="fileViewer">
      <button
        type="button"
        class="file-view-back btn btn-ghost btn-circle"
        @click="leaveFileViewer()"
        aria-label="Back"
        title="Back"
      >
        <OmaIcon name="arrow-left" aria-hidden="true" />
      </button>
      <div class="file-view-header">
        <span class="file-view-path" v-text="fileViewer?.path"></span>
      </div>
      <div class="file-view-actions">
        <a
          class="file-view-download btn btn-ghost btn-circle"
          v-show="!fileViewer?.isShared"
          :href="fileViewerDownloadUrl()"
          :download="fileViewerDownloadName()"
          :title="t('files.download')"
          :aria-label="t('files.download')"
        >
          <OmaIcon name="download" aria-hidden="true" />
        </a>
        <button
          type="button"
          class="file-view-share btn btn-ghost btn-circle"
          v-show="fileViewer?.canManageShare"
          @click="fileViewer?.artifactShare ? requestRevokeShare(fileViewer?.artifactShare) : shareViewedFile()"
          :disabled="sharingViewedFile"
          :aria-label="fileViewer?.artifactShare ? t('share.revokeFile') : t('share.shareFile')"
          :title="fileViewer?.artifactShare ? t('share.revokeFile') : t('share.shareFile')"
        >
          <span class="loading loading-spinner loading-xs" v-show="sharingViewedFile"></span>
          <OmaIcon name="share-2" aria-hidden="true" v-show="!sharingViewedFile && !fileViewer?.artifactShare" />
          <OmaIcon name="link-2-off" aria-hidden="true" v-show="!sharingViewedFile && fileViewer?.artifactShare" />
        </button>
      </div>
    </div>
    <template v-if="fileViewer"
      ><article
        class="file-markdown prose max-w-none"
        v-show="!fileViewerExpired"
        :class="{ 'prose-invert': theme === 'dark' }"
        data-rendered-content=""
        v-html="renderFilePreview()"
      ></article
    ></template>
  </section>
</template>
