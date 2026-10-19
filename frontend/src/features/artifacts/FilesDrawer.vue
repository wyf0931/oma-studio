<script setup lang="ts">
import OmaIcon from "../../ui/Icon.vue";
import { useWorkspaceScope } from "../../app/scope";
const {
  displayedFiles,
  downloadUrl,
  fileCountLabel,
  filesLoading,
  filesOpen,
  filesTab,
  formatBytes,
  formatDate,
  openFile,
  t,
} = useWorkspaceScope([
  "displayedFiles",
  "downloadUrl",
  "fileCountLabel",
  "filesLoading",
  "filesOpen",
  "filesTab",
  "formatBytes",
  "formatDate",
  "openFile",
  "t",
]);
</script>
<template>
  <aside class="files-drawer" v-show="filesOpen" :aria-label="t('chat.files')">
    <div class="files-drawer-header">
      <div>
        <h2 v-text="t('chat.files')"></h2>
        <p v-text="fileCountLabel(displayedFiles().length)"></p>
      </div>
      <button type="button" class="icon-btn" @click="filesOpen = false" aria-label="Close files">
        <OmaIcon name="x" aria-hidden="true" />
      </button>
    </div>
    <div role="tablist" class="tabs tabs-box files-tabs" :aria-label="t('chat.fileTabs')">
      <button
        type="button"
        role="tab"
        class="tab"
        :class="{ 'tab-active': filesTab === 'outputs' }"
        :aria-selected="filesTab === 'outputs'"
        @click="filesTab = 'outputs'"
        v-text="t('chat.outputs')"
      ></button>
      <button
        type="button"
        role="tab"
        class="tab"
        :class="{ 'tab-active': filesTab === 'inputs' }"
        :aria-selected="filesTab === 'inputs'"
        @click="filesTab = 'inputs'"
        v-text="t('chat.inputs')"
      ></button>
    </div>
    <div class="files-drawer-body">
      <template v-if="filesLoading"
        ><div class="files-empty">
          <span class="loading loading-dots loading-sm"></span></div></template
      ><template v-if="!filesLoading && displayedFiles().length === 0"
        ><div
          class="files-empty"
          v-text="filesTab === 'inputs' ? t('chat.noInputFiles') : t('chat.noGeneratedFiles')"
        ></div></template
      ><template v-for="file in displayedFiles()" :key="file.id"
        ><div
          class="file-card"
          role="button"
          tabindex="0"
          @click="openFile(file)"
          @keydown.enter.prevent="openFile(file)"
          @keydown.space.prevent="openFile(file)"
        >
          <span class="file-type" v-text="file.extension || 'file'"></span
          ><span class="file-card-copy"
            ><b v-text="file.name"></b><small v-text="file.path"></small
            ><small v-text="formatDate(file.generated_at) + ' · ' + formatBytes(file.size)"></small></span
          ><span class="file-actions">
            <button
              type="button"
              class="btn btn-sm btn-ghost btn-square file-open"
              @click.stop="openFile(file)"
              title="Open file"
              aria-label="Open file"
            >
              <OmaIcon name="external-link" aria-hidden="true" />
            </button>
            <a
              class="btn btn-sm btn-ghost btn-square file-download"
              :href="downloadUrl(file)"
              :download="file.name"
              @click.stop
              title="Download file"
              aria-label="Download file"
            >
              <OmaIcon name="download" aria-hidden="true" />
            </a>
          </span></div
      ></template>
    </div>
  </aside>
</template>
