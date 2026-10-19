import { strict as assert } from "node:assert";
import { test } from "node:test";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

test("typecheck rejects broken templates, props, API fields and imports", () => {
  const directory = mkdtempSync(resolve("frontend/src/typecheck-probe-"));
  try {
    writeFileSync(
      join(directory, "Broken.vue"),
      `<script setup lang="ts">
import OmaIcon from "../ui/Icon.vue";
import type { Agent } from "../shared/types";
import type {Dependencies as SettingsDependencies} from "../features/settings/actions";
function mutatePeer(deps: SettingsDependencies) {deps.identity.state.authUser = null;}
void mutatePeer;
import type {HttpClient} from "../shared/api";
function invalidRequests(client:HttpClient) {client.GET("/api/not-a-route",{});client.POST("/api/agents",{body:{name:"Missing instruction"}});}
void invalidRequests;
import missing from "./missing-module";
const agent = {} as Agent;
void agent.notAnAgentField;
void missing;
</script>
<template><OmaIcon :name="123" /><button @click="missingTemplateAction()">Fail</button></template>`,
    );
    const result = spawnSync(
      process.execPath,
      ["node_modules/vue-tsc/bin/vue-tsc.js", "--noEmit", "--pretty", "false"],
      { encoding: "utf8" },
    );
    assert.notEqual(result.status, 0);
    for (const text of [
      "notAnAgentField",
      "missingTemplateAction",
      "missing-module",
      "number",
      "read-only",
      "not-a-route",
      "instruction",
    ])
      assert.match(result.stdout + result.stderr, new RegExp(text));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
