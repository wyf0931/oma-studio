import { strict as assert } from "node:assert";
import { test } from "node:test";
import { ESLint } from "eslint";

test("browser compatibility lint flags a known API outside the configured baseline", async () => {
  const eslint = new ESLint();
  const [result] = await eslint.lintText("new VideoEncoder({});", {
    filePath: "frontend/src/compatibility-policy-probe.js",
  });
  assert(result.messages.some((message) => message.ruleId === "compat/compat"));
});
