<script setup lang="ts">
import OmaIcon from "../../ui/Icon.vue";
import { useWorkspaceScope } from "../../app/scope";
const { linkDrawerItems, linkDrawerOpen, linkDrawerTitle, resourceCountLabel, t } = useWorkspaceScope([
  "linkDrawerItems",
  "linkDrawerOpen",
  "linkDrawerTitle",
  "resourceCountLabel",
  "t",
]);
</script>
<template>
  <aside class="files-drawer link-drawer" v-show="linkDrawerOpen" :aria-label="t('dialogs.webResults')">
    <div class="files-drawer-header">
      <div>
        <h2 v-text="linkDrawerTitle"></h2>
        <p v-text="resourceCountLabel(linkDrawerItems.length)"></p>
      </div>
      <button type="button" class="icon-btn" @click="linkDrawerOpen = false" :aria-label="t('dialogs.closeWebResults')">
        <OmaIcon name="x" aria-hidden="true" />
      </button>
    </div>
    <div class="files-drawer-body">
      <template v-for="item in linkDrawerItems" :key="item.url"
        ><a class="web-result-card" :href="item.url" target="_blank" rel="noopener noreferrer"
          ><template v-if="item.favicon"
            ><img class="web-result-favicon" :src="item.favicon" alt="" loading="lazy" /></template
          ><span class="web-result-copy"
            ><b v-text="item.title"></b><small v-text="item.url"></small
            ><small v-show="item.date" v-text="item.date"></small
            ><span v-show="item.snippet" v-text="item.snippet"></span></span
          ><span class="file-open"><OmaIcon name="external-link" aria-hidden="true" /></span></a
      ></template>
    </div>
  </aside>
</template>
