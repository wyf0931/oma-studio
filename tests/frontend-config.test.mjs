import { strict as assert } from "node:assert";
import { test } from "node:test";
import { ESLint } from "eslint";

test("browser compatibility lint flags a known API outside the configured baseline", async () => {
  const eslint = new ESLint();
  const [result] = await eslint.lintText("new VideoEncoder({});", {
    filePath: "frontend/src/compatibility-policy-probe.ts",
  });
  assert(result.messages.some((message) => message.ruleId === "compat/compat"));
});

test("browser compatibility lint also covers Vue script blocks", async () => {
  const eslint = new ESLint();
  const [result] = await eslint.lintText(
    '<script setup lang="ts">new VideoEncoder({});</script><template><div /></template>',
    { filePath: "frontend/src/compatibility-policy-probe.vue" },
  );
  assert(result.messages.some((message) => message.ruleId === "compat/compat"));
});

test("shared capabilities cannot import feature implementations", async () => {
  const eslint = new ESLint();
  const [result] = await eslint.lintText('import "../features/chat/actions";', {
    filePath: "frontend/src/shared/dependency-policy-probe.ts",
  });
  assert(result.messages.some((message) => message.ruleId === "no-restricted-imports"));
});
