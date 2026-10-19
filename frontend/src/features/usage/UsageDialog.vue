<script setup lang="ts">
import OmaIcon from "../../ui/Icon.vue";
import { useWorkspaceScope } from "../../app/scope";
const {
  authUser,
  formatCompactNumber,
  setUsageRange,
  t,
  usageChartAreaPoints,
  usageChartLabels,
  usageChartPoints,
  usageCost,
  usageData,
  usageDateLabel,
  usageError,
  usageLoading,
  usageOpen,
  usageRange,
  usageTab,
} = useWorkspaceScope([
  "authUser",
  "formatCompactNumber",
  "setUsageRange",
  "t",
  "usageChartAreaPoints",
  "usageChartLabels",
  "usageChartPoints",
  "usageCost",
  "usageData",
  "usageDateLabel",
  "usageError",
  "usageLoading",
  "usageOpen",
  "usageRange",
  "usageTab",
]);
</script>
<template>
  <dialog
    class="modal modal-middle usage-dialog"
    :open="Boolean(usageOpen)"
    v-show="usageOpen"
    @click.self="usageOpen = false"
  >
    <div class="modal-box usage-modal-box">
      <div class="usage-header">
        <div>
          <div class="eyebrow" v-text="t('usage.eyebrow')"></div>
          <h2 v-text="t('usage.title')"></h2>
          <p v-text="t('usage.subtitle')"></p>
        </div>
        <button type="button" class="icon-btn" @click="usageOpen = false" :aria-label="t('common.close')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <div class="usage-toolbar">
        <div class="join usage-range-tabs" role="tablist" :aria-label="t('usage.dateRange')">
          <button
            type="button"
            class="join-item btn btn-sm"
            :class="usageRange === '1' ? 'btn-primary' : 'btn-ghost'"
            @click="setUsageRange('1')"
          >
            <span v-text="t('usage.today')"></span>
          </button>
          <button
            type="button"
            class="join-item btn btn-sm"
            :class="usageRange === '7' ? 'btn-primary' : 'btn-ghost'"
            @click="setUsageRange('7')"
          >
            <span v-text="t('usage.last7Days')"></span>
          </button>
          <button
            type="button"
            class="join-item btn btn-sm"
            :class="usageRange === '30' ? 'btn-primary' : 'btn-ghost'"
            @click="setUsageRange('30')"
          >
            <span v-text="t('usage.last30Days')"></span>
          </button>
        </div>
      </div>
      <div class="tabs tabs-boxed usage-tabs" role="tablist" :aria-label="t('usage.sections')">
        <button
          type="button"
          class="tab"
          :class="{ 'tab-active': usageTab === 'overview' }"
          @click="usageTab = 'overview'"
        >
          <span v-text="t('usage.overview')"></span>
        </button>
        <button
          type="button"
          class="tab"
          :class="{ 'tab-active': usageTab === 'sessions' }"
          @click="usageTab = 'sessions'"
        >
          <span v-text="t('usage.sessions')"></span>
        </button>
        <button
          type="button"
          class="tab"
          v-show="authUser?.role === 'admin'"
          :class="{ 'tab-active': usageTab === 'users' }"
          @click="usageTab = 'users'"
        >
          <span v-text="t('nav.users')"></span>
        </button>
        <button
          type="button"
          class="tab"
          v-show="authUser?.role === 'admin'"
          :class="{ 'tab-active': usageTab === 'agents' }"
          @click="usageTab = 'agents'"
        >
          <span v-text="t('nav.agents')"></span>
        </button>
      </div>
      <div class="usage-body">
        <div class="usage-loading" v-show="usageLoading" role="status" aria-live="polite">
          <span class="loading loading-spinner loading-sm"></span>
          <span v-text="t('usage.loadingData')"></span>
        </div>
        <div class="alert alert-error usage-error" v-show="usageError" v-text="usageError"></div>
        <section class="usage-panel" v-show="usageTab === 'overview' && !usageLoading">
          <div class="usage-summary-grid">
            <div class="stat usage-stat-card">
              <div class="stat-title" v-text="t('usage.sessions')"></div>
              <div class="stat-value" v-text="usageData.summary.sessions"></div>
              <div class="stat-desc" v-text="t('usage.chatConversations')"></div>
            </div>
            <div class="stat usage-stat-card">
              <div class="stat-title" v-text="t('usage.inputTokens')"></div>
              <div class="stat-value" v-text="formatCompactNumber(usageData.summary.input)"></div>
              <div class="stat-desc" v-text="t('usage.promptContext')"></div>
            </div>
            <div class="stat usage-stat-card">
              <div class="stat-title" v-text="t('usage.outputTokens')"></div>
              <div class="stat-value" v-text="formatCompactNumber(usageData.summary.output)"></div>
              <div class="stat-desc" v-text="t('usage.generatedResponses')"></div>
            </div>
            <div class="stat usage-stat-card">
              <div class="stat-title" v-text="t('usage.cachedTokens')"></div>
              <div class="stat-value" v-text="formatCompactNumber(usageData.summary.cacheRead)"></div>
              <div class="stat-desc" v-text="t('usage.cacheReads')"></div>
            </div>
            <div class="stat usage-stat-card usage-cost-card">
              <div class="stat-title" v-text="t('usage.estimatedCost')"></div>
              <div class="stat-value" v-text="usageCost(usageData.summary.cost)"></div>
              <div
                class="stat-desc"
                v-text="
                  t('usage.toolCalls', {
                    count: usageData.summary.tools || usageData.summary.search + usageData.summary.fetch,
                  })
                "
              ></div>
            </div>
          </div>
          <div class="usage-chart-card card">
            <div class="usage-chart-heading">
              <div>
                <h3 v-text="t('usage.trend')"></h3>
                <p v-text="t('usage.trendHelp')"></p>
              </div>
              <span class="usage-chart-total" v-text="usageCost(usageData.summary.cost)"></span>
            </div>
            <div class="usage-chart" role="img" aria-label="Daily usage cost trend">
              <svg viewBox="0 0 760 220" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="usage-chart-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stop-color="var(--color-primary)" stop-opacity=".18"></stop>
                    <stop offset="1" stop-color="var(--color-primary)" stop-opacity="0"></stop>
                  </linearGradient>
                </defs>
                <line x1="24" y1="18" x2="736" y2="18" class="usage-grid-line"></line>
                <line x1="24" y1="103" x2="736" y2="103" class="usage-grid-line"></line>
                <line x1="24" y1="188" x2="736" y2="188" class="usage-grid-line"></line>
                <polygon :points="usageChartAreaPoints()" class="usage-chart-area"></polygon>
                <polyline :points="usageChartPoints()" class="usage-chart-line"></polyline>
              </svg>
            </div>
            <div class="usage-chart-labels">
              <span v-show="!usageData.daily.length" v-text="t('usage.noUsage')"></span>
              <template v-for="label in usageChartLabels()" :key="label.id">
                <span v-text="label.label"></span>
              </template>
            </div>
          </div>
        </section>
        <section class="usage-panel" v-show="usageTab === 'sessions' && !usageLoading">
          <div class="usage-section-heading">
            <div>
              <h3 v-text="t('usage.sessionDetails')"></h3>
              <p v-text="t('usage.sessionDetailsHelp')"></p>
            </div>
            <span class="usage-count" v-text="t('usage.sessionCount', { count: usageData.sessions.length })"></span>
          </div>
          <div class="usage-table-wrap overflow-x-auto">
            <table class="table usage-table">
              <thead>
                <tr>
                  <th class="usage-session-column" v-text="t('usage.session')"></th>
                  <th v-text="t('common.agent')"></th>
                  <th v-text="t('common.created')"></th>
                  <th v-text="t('usage.input')"></th>
                  <th v-text="t('usage.output')"></th>
                  <th v-text="t('usage.cached')"></th>
                  <th v-text="t('usage.cost')"></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="row in usageData.sessions" :key="row.id">
                  <tr>
                    <td class="usage-session-column">
                      <b class="usage-session-title" v-text="row.title"></b
                      ><small v-show="authUser?.role === 'admin'" v-text="row.username"></small>
                    </td>
                    <td v-text="row.agent"></td>
                    <td v-text="usageDateLabel(row.createdAt)"></td>
                    <td v-text="formatCompactNumber(row.input)"></td>
                    <td v-text="formatCompactNumber(row.output)"></td>
                    <td v-text="formatCompactNumber(row.cacheRead)"></td>
                    <td v-text="usageCost(row.cost)"></td>
                  </tr>
                </template>
              </tbody>
            </table>
            <div class="usage-empty" v-show="!usageData.sessions.length" v-text="t('usage.noSessions')"></div>
          </div>
        </section>
        <section class="usage-panel" v-show="usageTab === 'users' && authUser?.role === 'admin' && !usageLoading">
          <div class="usage-section-heading">
            <div>
              <h3 v-text="t('usage.byUser')"></h3>
              <p v-text="t('usage.workspaceGroupedUser')"></p>
            </div>
          </div>
          <div class="usage-table-wrap overflow-x-auto">
            <table class="table usage-table usage-aggregation-table">
              <thead>
                <tr>
                  <th v-text="t('nav.user')"></th>
                  <th v-text="t('usage.sessions')"></th>
                  <th v-text="t('usage.input')"></th>
                  <th v-text="t('usage.output')"></th>
                  <th v-text="t('usage.cached')"></th>
                  <th v-text="t('usage.cost')"></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="row in usageData.users" :key="row.id"
                  ><tr>
                    <td><b v-text="row.username"></b></td>
                    <td v-text="row.sessions"></td>
                    <td v-text="formatCompactNumber(row.input)"></td>
                    <td v-text="formatCompactNumber(row.output)"></td>
                    <td v-text="formatCompactNumber(row.cacheRead)"></td>
                    <td v-text="usageCost(row.cost)"></td></tr
                ></template>
              </tbody>
            </table>
            <div class="usage-empty" v-show="!usageData.users.length" v-text="t('usage.noUserUsage')"></div>
          </div>
        </section>
        <section class="usage-panel" v-show="usageTab === 'agents' && authUser?.role === 'admin' && !usageLoading">
          <div class="usage-section-heading">
            <div>
              <h3 v-text="t('usage.byAgent')"></h3>
              <p v-text="t('usage.workspaceGroupedAgent')"></p>
            </div>
          </div>
          <div class="usage-table-wrap overflow-x-auto">
            <table class="table usage-table usage-aggregation-table">
              <thead>
                <tr>
                  <th v-text="t('common.agent')"></th>
                  <th v-text="t('usage.sessions')"></th>
                  <th v-text="t('usage.input')"></th>
                  <th v-text="t('usage.output')"></th>
                  <th v-text="t('usage.cached')"></th>
                  <th v-text="t('usage.cost')"></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="row in usageData.agents" :key="row.id"
                  ><tr>
                    <td><b v-text="row.agent"></b></td>
                    <td v-text="row.sessions"></td>
                    <td v-text="formatCompactNumber(row.input)"></td>
                    <td v-text="formatCompactNumber(row.output)"></td>
                    <td v-text="formatCompactNumber(row.cacheRead)"></td>
                    <td v-text="usageCost(row.cost)"></td></tr
                ></template>
              </tbody>
            </table>
            <div class="usage-empty" v-show="!usageData.agents.length" v-text="t('usage.noAgentUsage')"></div>
          </div>
        </section>
      </div>
    </div>
  </dialog>
</template>
