<script setup lang="ts">
import { toRefs } from "vue";
import { useFormat } from "../../shared/format-context";
import { useIdentity } from "./context";
import { useI18n } from "../../shared/i18n-context";

import OmaIcon from "../../ui/Icon.vue";
const formatFeature = useFormat();
const { formatDateTime, statusLabel } = formatFeature;
const identityFeature = useIdentity();
const { users, usersLoading, usersOpen } = toRefs(identityFeature.state);
const { openAddUser, requestDeleteUser, toggleManagedUser } = identityFeature;
const i18nFeature = useI18n();
const { t } = i18nFeature;
</script>
<template>
  <dialog
    class="modal modal-middle users-dialog"
    :open="Boolean(usersOpen)"
    v-show="usersOpen"
    @click.self="usersOpen = false"
  >
    <div class="modal-box usage-modal-box users-modal-box">
      <div class="usage-header">
        <div>
          <div class="eyebrow" v-text="t('users.eyebrow')"></div>
          <h2 v-text="t('users.title')"></h2>
          <p v-text="t('users.subtitle')"></p>
        </div>
        <button type="button" class="icon-btn" @click="usersOpen = false" :aria-label="t('users.close')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <div class="usage-toolbar users-toolbar">
        <button type="button" class="btn btn-soft btn-primary" @click="openAddUser()">
          <OmaIcon name="plus" aria-hidden="true" /><span v-text="t('users.new')"></span>
        </button>
      </div>
      <div class="usage-body users-body">
        <div class="users-table-wrap overflow-x-auto">
          <div class="users-loading" v-show="usersLoading"><span class="loading loading-dots loading-sm"></span></div>
          <table class="table" v-show="!usersLoading">
            <thead>
              <tr>
                <th v-text="t('users.name')"></th>
                <th v-text="t('users.username')"></th>
                <th v-text="t('users.email')"></th>
                <th v-text="t('users.status')"></th>
                <th v-text="t('users.created')"></th>
                <th v-text="t('users.lastLogin')"></th>
                <th v-text="t('users.actions')"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="user in users" :key="user.id">
                <tr class="bg-base-200">
                  <td v-text="user.nickname || user.username"></td>
                  <td><code v-text="user.username"></code></td>
                  <td v-text="user.email || '—'"></td>
                  <td>
                    <span
                      class="badge badge-soft"
                      :class="user.status === 'active' ? 'badge-success' : 'badge-ghost'"
                      v-text="statusLabel(user.status)"
                    ></span>
                  </td>
                  <td v-text="formatDateTime(user.created_at)"></td>
                  <td v-text="user.last_login_at ? formatDateTime(user.last_login_at) : t('users.never')"></td>
                  <td>
                    <div class="users-actions">
                      <input
                        type="checkbox"
                        class="toggle toggle-sm toggle-success"
                        :checked="user.status === 'active'"
                        :disabled="user.role === 'admin'"
                        @change="toggleManagedUser(user)"
                        :aria-label="
                          (user.status === 'active' ? t('users.disable') : t('users.enable')) + ' ' + user.username
                        "
                      />
                      <button
                        type="button"
                        class="btn btn-ghost btn-error btn-sm btn-square"
                        v-show="user.role !== 'admin'"
                        @click="requestDeleteUser(user)"
                        :aria-label="t('users.delete') + ' ' + user.username"
                        :title="t('users.delete')"
                      >
                        <OmaIcon name="trash-2" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </dialog>
</template>
