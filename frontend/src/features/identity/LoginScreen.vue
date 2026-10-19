<script setup lang="ts">
import { toRefs } from "vue";
import { useIdentity } from "./context";
import { useShares } from "../shares/context";
import { useI18n } from "../../shared/i18n-context";

const identityFeature = useIdentity();
const { authChecked, authUser, loginError, loginLoading, loginPassword, loginUsername } = toRefs(identityFeature.state);
const { login } = identityFeature;
const sharesFeature = useShares();
const { sharedMode } = toRefs(sharesFeature.state);
const i18nFeature = useI18n();
const { t } = i18nFeature;
</script>
<template>
  <main class="login-screen" v-show="authChecked && !authUser && !sharedMode">
    <form class="card login-card" @submit.prevent="login()">
      <div class="login-brand">
        <img :src="'/static/oma-logo-transparent.png'" alt="OMA studio" />
        <span>OMA studio</span>
      </div>
      <h1 v-text="t('auth.welcomeBack')"></h1>
      <p v-text="t('auth.signInContinue')"></p>
      <label class="form-field">
        <span v-text="t('auth.username')"></span>
        <input class="input input-bordered" v-model="loginUsername" autocomplete="username" required />
      </label>
      <label class="form-field">
        <span v-text="t('auth.password')"></span>
        <input
          class="input input-bordered"
          type="password"
          v-model="loginPassword"
          autocomplete="current-password"
          required
        />
      </label>
      <div class="alert alert-error" v-show="loginError" v-text="loginError"></div>
      <button class="btn btn-primary login-submit" type="submit" :disabled="loginLoading">
        <span v-show="!loginLoading" v-text="t('auth.signIn')"></span>
        <span v-show="loginLoading" class="loading loading-spinner loading-sm"></span>
      </button>
    </form>
  </main>
</template>
