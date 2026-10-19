<script setup lang="ts">
import OmaIcon from "../../ui/Icon.vue";
import { useWorkspaceScope } from "../../app/scope";
const {
  confirmDeleteUser,
  confirmLogout,
  createManagedUser,
  logoutConfirmOpen,
  newUserEmail,
  newUserUsername,
  t,
  userAddOpen,
  userCreating,
  userDeleteTarget,
} = useWorkspaceScope([
  "confirmDeleteUser",
  "confirmLogout",
  "createManagedUser",
  "logoutConfirmOpen",
  "newUserEmail",
  "newUserUsername",
  "t",
  "userAddOpen",
  "userCreating",
  "userDeleteTarget",
]);
</script>
<template>
  <dialog
    class="modal modal-middle user-add-dialog"
    :open="Boolean(userAddOpen)"
    v-show="userAddOpen"
    @click.self="userAddOpen = false"
  >
    <div class="modal-box">
      <div class="dialog-head">
        <div>
          <div class="eyebrow" v-text="t('dialogs.administration')"></div>
          <h2 v-text="t('dialogs.addUser')"></h2>
        </div>
        <button type="button" class="icon-btn" @click="userAddOpen = false" :aria-label="t('common.close')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <form @submit.prevent="createManagedUser()">
        <label class="form-field">
          <span v-text="t('auth.username')"></span>
          <input
            class="input input-bordered"
            v-model="newUserUsername"
            pattern="[A-Za-z0-9_.-]+"
            required
            autocomplete="off"
          />
        </label>
        <label class="form-field">
          <span>Email <small v-text="'(' + t('dialogs.optional') + ')'"></small></span>
          <input class="input input-bordered" type="email" v-model="newUserEmail" autocomplete="off" />
        </label>
        <p class="user-default-password"><span v-text="t('dialogs.defaultPassword')"></span> <code>OMA888</code></p>
        <div class="dialog-actions">
          <button type="button" class="btn btn-ghost" @click="userAddOpen = false" v-text="t('common.cancel')"></button>
          <button type="submit" class="btn btn-primary" :disabled="userCreating">
            <span v-show="!userCreating" v-text="t('dialogs.addUser')"></span>
            <span v-show="userCreating" class="loading loading-spinner loading-sm"></span>
          </button>
        </div>
      </form>
    </div>
  </dialog>
  <dialog
    class="modal modal-middle"
    :open="Boolean(!!userDeleteTarget)"
    v-show="userDeleteTarget"
    @click.self="userDeleteTarget = null"
  >
    <div class="modal-box confirm-box">
      <div class="dialog-head">
        <div>
          <div class="eyebrow" v-text="t('dialogs.administration')"></div>
          <h2><span v-text="t('common.delete')"></span> <span v-text="userDeleteTarget?.username"></span>?</h2>
        </div>
        <button type="button" class="icon-btn" @click="userDeleteTarget = null" :aria-label="t('common.close')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <p class="confirm-copy" v-text="t('dialogs.userCannotSignIn')"></p>
      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-ghost"
          @click="userDeleteTarget = null"
          v-text="t('common.cancel')"
        ></button>
        <button
          type="button"
          class="btn btn-error"
          @click="confirmDeleteUser()"
          v-text="t('dialogs.deleteUser')"
        ></button>
      </div>
    </div>
  </dialog>
  <dialog
    class="modal modal-middle"
    :open="Boolean(logoutConfirmOpen)"
    v-show="logoutConfirmOpen"
    @click.self="logoutConfirmOpen = false"
  >
    <div class="modal-box confirm-box">
      <div class="dialog-head">
        <div>
          <div class="eyebrow" v-text="t('dialogs.session')"></div>
          <h2 v-text="t('dialogs.logoutQuestion')"></h2>
        </div>
        <button type="button" class="icon-btn" @click="logoutConfirmOpen = false" :aria-label="t('common.close')">
          <OmaIcon name="x" aria-hidden="true" />
        </button>
      </div>
      <p class="confirm-copy" v-text="t('dialogs.signInAgain')"></p>
      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-ghost"
          @click="logoutConfirmOpen = false"
          v-text="t('common.cancel')"
        ></button>
        <button type="button" class="btn btn-error" @click="confirmLogout()" v-text="t('nav.logout')"></button>
      </div>
    </div>
  </dialog>
</template>
