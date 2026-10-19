<script setup lang="ts">
import OmaIcon from "../../ui/Icon.vue";
import { useWorkspaceScope } from "../../app/scope";
const {
  accountCurrentPassword,
  accountNewPassword,
  accountPasswordErrors,
  accountPasswordOpen,
  accountPasswordSaved,
  accountPasswordSaving,
  accountProfile,
  accountProfileDirty,
  accountProfileError,
  accountProfileSaved,
  accountProfileSaving,
  accountShowCurrentPassword,
  accountShowNewPassword,
  applyThemePreference,
  authUser,
  formatDateTime,
  language,
  openAccountPassword,
  openSettingsTab,
  profileRoleLabel,
  resetAccountPassword,
  saveAccountPassword,
  saveAccountProfile,
  saveLanguage,
  saveSystemTimezone,
  settingsOpen,
  settingsTab,
  systemTimezone,
  t,
  themePreference,
} = useWorkspaceScope([
  "accountCurrentPassword",
  "accountNewPassword",
  "accountPasswordErrors",
  "accountPasswordOpen",
  "accountPasswordSaved",
  "accountPasswordSaving",
  "accountProfile",
  "accountProfileDirty",
  "accountProfileError",
  "accountProfileSaved",
  "accountProfileSaving",
  "accountShowCurrentPassword",
  "accountShowNewPassword",
  "applyThemePreference",
  "authUser",
  "formatDateTime",
  "language",
  "openAccountPassword",
  "openSettingsTab",
  "profileRoleLabel",
  "resetAccountPassword",
  "saveAccountPassword",
  "saveAccountProfile",
  "saveLanguage",
  "saveSystemTimezone",
  "settingsOpen",
  "settingsTab",
  "systemTimezone",
  "t",
  "themePreference",
]);
</script>
<template>
  <dialog
    class="modal modal-middle settings-dialog"
    :open="Boolean(settingsOpen)"
    v-show="settingsOpen"
    @click.self="settingsOpen = false"
  >
    <div class="modal-box settings-modal-box">
      <div class="settings-header">
        <h2 v-text="t('settings.title')"></h2>
        <button type="button" class="icon-btn" @click="settingsOpen = false" :aria-label="t('common.close')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <div class="settings-layout">
        <aside class="settings-menu menu" aria-label="Settings sections">
          <button type="button" :class="{ active: settingsTab === 'general' }" @click="openSettingsTab('general')">
            <OmaIcon name="settings" aria-hidden="true" /> <span v-text="t('settings.general')"></span>
          </button>
          <button
            type="button"
            :class="{ active: settingsTab === 'account' }"
            @click="openSettingsTab('account')"
            :aria-current="settingsTab === 'account' ? 'page' : undefined"
          >
            <OmaIcon name="user-round" aria-hidden="true" /> <span v-text="t('account.title')"></span>
          </button>
        </aside>
        <section class="settings-content" v-show="settingsTab === 'account'" :aria-label="t('account.title')">
          <div class="settings-title">
            <h3 v-text="t('account.title')"></h3>
            <p v-text="t('account.subtitle')"></p>
          </div>
          <div class="settings-section">
            <h4 class="account-section-title" v-text="t('account.info')"></h4>
            <dl class="account-info">
              <div>
                <dt v-text="t('account.username')"></dt>
                <dd><code v-text="authUser?.username"></code></dd>
              </div>
              <div>
                <dt v-text="t('account.role')"></dt>
                <dd v-text="profileRoleLabel()"></dd>
              </div>
              <div>
                <dt v-text="t('account.created')"></dt>
                <dd v-text="authUser?.created_at ? formatDateTime(authUser.created_at) : ''"></dd>
              </div>
            </dl>
            <p v-text="t('account.usernameHelp')"></p>
          </div>
          <form
            class="settings-section account-form"
            @submit.prevent="saveAccountProfile()"
            @input="
              accountProfileSaved = false;
              accountProfileError = '';
            "
            :aria-busy="accountProfileSaving"
          >
            <h4 class="account-section-title" v-text="t('account.profile')"></h4>
            <fieldset class="fieldset" :disabled="accountProfileSaving">
              <label for="account-nickname" v-text="t('account.nickname')"></label>
              <input
                id="account-nickname"
                class="input w-full"
                type="text"
                v-model="accountProfile.nickname"
                maxlength="80"
                autocomplete="nickname"
                aria-describedby="account-nickname-help"
              />
              <p id="account-nickname-help" v-text="t('account.nicknameHelp')"></p>
              <label class="mt-3" for="account-email" v-text="t('account.email')"></label>
              <input
                id="account-email"
                class="input w-full"
                type="email"
                v-model="accountProfile.email"
                maxlength="200"
                autocomplete="email"
                aria-describedby="account-email-help"
              />
              <p id="account-email-help" v-text="t('account.emailHelp')"></p>
            </fieldset>
            <p
              class="account-feedback text-error"
              role="alert"
              v-show="accountProfileError"
              v-text="accountProfileError"
            ></p>
            <p
              class="account-feedback text-success"
              role="status"
              v-show="accountProfileSaved"
              v-text="t('account.profileSaved')"
            ></p>
            <div class="account-actions">
              <button
                class="btn btn-soft btn-primary"
                type="submit"
                :disabled="accountProfileSaving || !accountProfileDirty()"
              >
                <span class="loading loading-spinner loading-xs" v-show="accountProfileSaving" aria-hidden="true"></span
                ><span v-text="t('account.saveProfile')"></span>
              </button>
            </div>
          </form>
          <div class="settings-section account-form">
            <h4 class="account-section-title" v-text="t('account.password')"></h4>
            <div v-show="!accountPasswordOpen">
              <p v-text="t('account.passwordSet')"></p>
              <div class="account-actions">
                <button
                  type="button"
                  class="btn btn-soft"
                  @click="openAccountPassword()"
                  :disabled="accountPasswordSaving"
                  v-text="t('account.changePassword')"
                ></button>
              </div>
            </div>
            <form
              v-show="accountPasswordOpen"
              @submit.prevent="saveAccountPassword()"
              :aria-busy="accountPasswordSaving"
            >
              <input type="text" name="username" :value="authUser?.username || ''" autocomplete="username" hidden />
              <p id="account-password-help" v-text="t('account.passwordHelp')"></p>
              <fieldset class="fieldset mt-3" :disabled="accountPasswordSaving">
                <label for="account-current-password" v-text="t('account.currentPassword')"></label>
                <div class="input w-full" :class="{ 'input-error': accountPasswordErrors.current }">
                  <input
                    id="account-current-password"
                    data-ref="accountCurrentPassword"
                    class="grow min-w-0"
                    :type="accountShowCurrentPassword ? 'text' : 'password'"
                    v-model="accountCurrentPassword"
                    @input="accountPasswordErrors.current = ''"
                    autocomplete="current-password"
                    spellcheck="false"
                    autocapitalize="off"
                    :aria-invalid="!!accountPasswordErrors.current"
                    aria-describedby="account-current-error"
                  />
                  <button
                    class="btn btn-ghost btn-sm btn-square"
                    type="button"
                    @click="accountShowCurrentPassword = !accountShowCurrentPassword"
                    :aria-label="
                      t(accountShowCurrentPassword ? 'account.hideCurrentPassword' : 'account.showCurrentPassword')
                    "
                    :aria-pressed="accountShowCurrentPassword"
                    aria-controls="account-current-password"
                  >
                    <OmaIcon name="eye" v-show="!accountShowCurrentPassword" aria-hidden="true" /><OmaIcon
                      name="eye-off"
                      v-show="accountShowCurrentPassword"
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <p
                  id="account-current-error"
                  class="account-feedback text-error"
                  role="alert"
                  v-show="accountPasswordErrors.current"
                  v-text="accountPasswordErrors.current"
                ></p>
                <label class="mt-3" for="account-new-password" v-text="t('account.newPassword')"></label>
                <div class="input w-full" :class="{ 'input-error': accountPasswordErrors.new }">
                  <input
                    id="account-new-password"
                    class="grow min-w-0"
                    :type="accountShowNewPassword ? 'text' : 'password'"
                    v-model="accountNewPassword"
                    @input="accountPasswordErrors.new = ''"
                    autocomplete="new-password"
                    spellcheck="false"
                    autocapitalize="off"
                    :aria-invalid="!!accountPasswordErrors.new"
                    aria-describedby="account-password-help account-new-error"
                  />
                  <button
                    class="btn btn-ghost btn-sm btn-square"
                    type="button"
                    @click="accountShowNewPassword = !accountShowNewPassword"
                    :aria-label="t(accountShowNewPassword ? 'account.hideNewPassword' : 'account.showNewPassword')"
                    :aria-pressed="accountShowNewPassword"
                    aria-controls="account-new-password"
                  >
                    <OmaIcon name="eye" v-show="!accountShowNewPassword" aria-hidden="true" /><OmaIcon
                      name="eye-off"
                      v-show="accountShowNewPassword"
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <p
                  id="account-new-error"
                  class="account-feedback text-error"
                  role="alert"
                  v-show="accountPasswordErrors.new"
                  v-text="accountPasswordErrors.new"
                ></p>
              </fieldset>
              <p
                class="account-feedback text-error"
                role="alert"
                v-show="accountPasswordErrors.form"
                v-text="accountPasswordErrors.form"
              ></p>
              <div class="account-actions">
                <button class="btn btn-soft btn-primary" type="submit" :disabled="accountPasswordSaving">
                  <span
                    class="loading loading-spinner loading-xs"
                    v-show="accountPasswordSaving"
                    aria-hidden="true"
                  ></span
                  ><span v-text="t('account.updatePassword')"></span>
                </button>
                <button
                  class="btn btn-ghost"
                  type="button"
                  @click="resetAccountPassword()"
                  :disabled="accountPasswordSaving"
                  v-text="t('common.cancel')"
                ></button>
              </div>
            </form>
            <p
              class="account-feedback text-success"
              role="status"
              v-show="accountPasswordSaved"
              v-text="t('account.passwordSaved')"
            ></p>
          </div>
        </section>
        <section class="settings-content" v-show="settingsTab === 'general'">
          <div class="settings-title">
            <h3 v-text="t('settings.general')"></h3>
            <p v-text="t('settings.customize')"></p>
          </div>
          <div class="settings-preference-grid">
            <div class="settings-section">
              <label for="settings-language" v-text="t('settings.language')"></label>
              <p v-text="t('settings.languageHelp')"></p>
              <select
                id="settings-language"
                class="select select-bordered settings-select"
                v-model="language"
                @change="saveLanguage()"
              >
                <option value="en" v-text="t('settings.english')"></option>
                <option value="zh-CN" v-text="t('settings.simplifiedChinese')"></option>
              </select>
            </div>
            <div class="settings-section" v-show="authUser?.role === 'admin'">
              <label for="settings-timezone" v-text="t('settings.timezone')"></label>
              <p v-text="t('settings.timezoneHelp')"></p>
              <select
                id="settings-timezone"
                class="select select-bordered settings-select"
                v-model="systemTimezone"
                @change="saveSystemTimezone()"
              >
                <option value="Asia/Shanghai">Shanghai (UTC+08:00)</option>
                <option value="Asia/Tokyo">Tokyo (UTC+09:00)</option>
                <option value="Asia/Singapore">Singapore (UTC+08:00)</option>
                <option value="Europe/London">London (UTC+00:00)</option>
                <option value="America/New_York">New York (UTC-05:00)</option>
                <option value="America/Chicago">Chicago (UTC-06:00)</option>
                <option value="America/Los_Angeles">Los Angeles (UTC-08:00)</option>
                <option value="Asia/Ho_Chi_Minh">Vietnam (UTC+07:00)</option>
              </select>
            </div>
          </div>
          <div class="settings-section">
            <label v-text="t('settings.theme')"></label>
            <p v-text="t('settings.themeHelp')"></p>
            <div class="theme-options">
              <label class="theme-option" :class="{ selected: themePreference === 'light' }"
                ><input
                  type="radio"
                  name="settings-theme"
                  value="light"
                  :checked="themePreference === 'light'"
                  @change="applyThemePreference('light')" /><span class="theme-option-icon"
                  ><OmaIcon name="sun-medium" aria-hidden="true" /></span
                ><b v-text="t('settings.light')"></b></label
              ><label class="theme-option" :class="{ selected: themePreference === 'dark' }"
                ><input
                  type="radio"
                  name="settings-theme"
                  value="dark"
                  :checked="themePreference === 'dark'"
                  @change="applyThemePreference('dark')" /><span class="theme-option-icon"
                  ><OmaIcon name="moon" aria-hidden="true" /></span
                ><b v-text="t('settings.dark')"></b></label
              ><label class="theme-option" :class="{ selected: themePreference === 'system' }"
                ><input
                  type="radio"
                  name="settings-theme"
                  value="system"
                  :checked="themePreference === 'system'"
                  @change="applyThemePreference('system')" /><span class="theme-option-icon"
                  ><OmaIcon name="laptop-minimal" aria-hidden="true" /></span
                ><b v-text="t('settings.system')"></b
              ></label>
            </div>
          </div>
        </section>
      </div>
    </div>
  </dialog>
</template>
