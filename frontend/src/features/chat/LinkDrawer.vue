<script setup lang="ts">
import { toRefs } from "vue";
import { usePresentation } from "./presentation-context";
import { useFormat } from "../../shared/format-context";
import { useI18n } from "../../shared/i18n-context";

import OmaIcon from "../../ui/Icon.vue";
const presentationFeature = usePresentation();
const { linkDrawerItems, linkDrawerOpen, linkDrawerTitle } = toRefs(presentationFeature.state);
const formatFeature = useFormat();
const { resourceCountLabel } = formatFeature;
const i18nFeature = useI18n();
const { t } = i18nFeature;
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
