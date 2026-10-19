<script setup lang="ts">
import { useDebouncedCallback } from "../../ui/events";
import { vOutside } from "../../ui/events";
import OmaIcon from "../../ui/Icon.vue";
import { useWorkspaceScope } from "../../app/scope";
const {
  agentName,
  agents,
  downloadUrl,
  formatBytes,
  formatDateTime,
  initials,
  libraryAgentFilter,
  libraryAgentPickerOpen,
  libraryFiles,
  libraryLoading,
  libraryPage,
  libraryPages,
  librarySearch,
  loadLibrary,
  openLibraryChat,
  openLibraryFile,
  page,
  selectLibraryAgent,
  t,
} = useWorkspaceScope([
  "agentName",
  "agents",
  "downloadUrl",
  "formatBytes",
  "formatDateTime",
  "initials",
  "libraryAgentFilter",
  "libraryAgentPickerOpen",
  "libraryFiles",
  "libraryLoading",
  "libraryPage",
  "libraryPages",
  "librarySearch",
  "loadLibrary",
  "openLibraryChat",
  "openLibraryFile",
  "page",
  "selectLibraryAgent",
  "t",
]);
const debounceSearch = useDebouncedCallback(() => {
  void loadLibrary.value(1);
});
</script>
<template>
  <section class="content-panel library-page" v-show="page === 'library'">
    <div class="page-heading library-heading">
      <div>
        <h1 v-text="t('library.title')"></h1>
        <p v-text="t('library.subtitle')"></p>
      </div>
    </div>
    <div class="library-filters">
      <div
        class="agent-picker filter-agent-picker"
        v-outside="
          () => {
            libraryAgentPickerOpen = false;
          }
        "
      >
        <button
          type="button"
          class="agent-picker-button filter-agent-picker-button"
          @click="libraryAgentPickerOpen = !libraryAgentPickerOpen"
          :aria-expanded="libraryAgentPickerOpen"
          aria-haspopup="listbox"
          aria-label="Filter Library by agent"
        >
          <span
            class="agent-avatar"
            v-text="initials(libraryAgentFilter ? agentName(libraryAgentFilter) : 'All')"
          ></span>
          <span
            class="filter-agent-picker-label"
            v-text="libraryAgentFilter ? agentName(libraryAgentFilter) : t('common.all')"
          ></span>
          <OmaIcon class="picker-chevron" name="chevron-down" aria-hidden="true" />
        </button>
        <div class="agent-picker-menu filter-agent-picker-menu" v-show="libraryAgentPickerOpen" role="listbox">
          <button type="button" class="agent-picker-option" @click="selectLibraryAgent('')">
            <span class="agent-avatar" v-text="initials('All')"></span>
            <span><b v-text="t('common.all')"></b></span>
          </button>
          <template v-for="agent in agents" :key="agent.id">
            <button type="button" class="agent-picker-option" @click="selectLibraryAgent(agent.id)">
              <span class="agent-avatar" v-text="initials(agent.name)"></span>
              <span><b v-text="agent.name"></b></span>
            </button>
          </template>
        </div>
      </div>
      <label class="library-search"
        ><OmaIcon name="search" aria-hidden="true" /><input
          class="input"
          v-model="librarySearch"
          @input="debounceSearch"
          :placeholder="t('library.searchFiles')"
          :aria-label="t('library.searchFiles')"
      /></label>
    </div>
    <div class="library-table-wrap">
      <template v-if="libraryLoading"
        ><div class="files-empty">
          <span class="loading loading-dots loading-sm"></span></div></template
      ><template v-if="!libraryLoading && libraryFiles.length === 0"
        ><div class="files-empty" v-text="t('library.noFilesFound')"></div
      ></template>
      <table class="table library-table" v-show="!libraryLoading && libraryFiles.length">
        <thead>
          <tr>
            <th v-text="t('common.name')"></th>
            <th v-text="t('common.agent')"></th>
            <th v-text="t('common.size')"></th>
            <th v-text="t('common.created')"></th>
            <th v-text="t('common.actions')"></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="file in libraryFiles" :key="file.chat_id + ':' + file.path"
            ><tr class="bg-base-200">
              <td class="library-file-cell">
                <button class="library-file-name" @click="openLibraryFile(file)">
                  <span class="file-type" v-text="file.extension || 'file'"></span
                  ><span><b v-text="file.name"></b><small v-text="file.path"></small></span>
                </button>
              </td>
              <td class="library-agent-cell">
                <span class="agent-avatar" v-text="initials(file.agent_name || 'Unknown')"></span>
                <span v-text="file.agent_name || 'Unknown'"></span>
              </td>
              <td v-text="formatBytes(file.size)"></td>
              <td v-text="formatDateTime(file.generated_at)"></td>
              <td>
                <div class="library-actions">
                  <button
                    class="btn btn-sm btn-ghost"
                    @click="openLibraryFile(file)"
                    title="Open file"
                    aria-label="Open file"
                  >
                    <OmaIcon name="file-text" aria-hidden="true" /></button
                  ><a
                    class="btn btn-sm btn-ghost"
                    :href="downloadUrl(file)"
                    :download="file.name"
                    title="Download file"
                    aria-label="Download file"
                    ><OmaIcon name="download" aria-hidden="true" /></a
                  ><button
                    class="btn btn-sm btn-ghost"
                    @click="openLibraryChat(file)"
                    title="View chat"
                    aria-label="View chat"
                  >
                    <OmaIcon name="message-square-text" aria-hidden="true" />
                  </button>
                </div>
              </td></tr
          ></template>
        </tbody>
      </table>
    </div>
    <div class="library-pagination" v-show="libraryPages > 1">
      <button class="btn btn-sm btn-ghost" @click="loadLibrary(libraryPage - 1)" :disabled="libraryPage <= 1">
        Previous</button
      ><span v-text="libraryPage + ' / ' + libraryPages"></span
      ><button
        class="btn btn-sm btn-ghost"
        @click="loadLibrary(libraryPage + 1)"
        :disabled="libraryPage >= libraryPages"
      >
        Next
      </button>
    </div>
  </section>
</template>
