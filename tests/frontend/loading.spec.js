import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { login } from "./helpers.js";
const manifest = JSON.parse(readFileSync("dist/.vite/manifest.json", "utf8"));
const view = manifest["src/features/agents/AgentsPage.vue"];
const usage = manifest["src/features/usage/UsageDialog.vue"];
const mermaid = Object.values(manifest).find((entry) => entry.name === "mermaid.core");

test("secondary views and diagrams load only when requested", async ({ page }) => {
  const initial = new Set();
  function visit(key) {
    if (initial.has(key)) return;
    initial.add(key);
    for (const dependency of manifest[key]?.imports || []) visit(dependency);
  }
  visit("index.html");
  for (const entry of [view, usage, mermaid]) {
    expect(entry.isDynamicEntry).toBe(true);
    expect([...initial].some((key) => manifest[key].file === entry.file)).toBe(false);
  }
  const requests = [];
  page.on("request", (request) => requests.push(new URL(request.url()).pathname));
  await login(page);
  for (const entry of [view, usage, mermaid]) expect(requests).not.toContain(`/static/${entry.file}`);
  await page.evaluate(() => {
    history.pushState({}, "", "/agents");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.locator(".agents-page")).toBeVisible();
  expect(requests).toContain(`/static/${view.file}`);
  expect(requests).not.toContain(`/static/${mermaid.file}`);
  await page.route("**/api/chats/lazy-fixture/files/content?*", (route) =>
    route.fulfill({ json: { content: "```mermaid\ngraph LR\nA --> B\n```" } }),
  );
  await page.goto("/file-view?chat_id=lazy-fixture&path=diagram.md");
  await expect(page.locator(".file-markdown .mermaid svg")).toBeVisible();
  expect(requests).toContain(`/static/${mermaid.file}`);
});

test("diagram loading failures retain text and report a safe error", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await page.route(`**/static/${mermaid.file}`, (route) => route.abort());
  await page.route("**/api/chats/lazy-fixture/files/content?*", (route) =>
    route.fulfill({ json: { content: "```mermaid\ngraph LR\nA --> B\n```" } }),
  );
  await page.goto("/file-view?chat_id=lazy-fixture&path=diagram.md");
  await expect(page.locator(".toast")).toContainText("Unable to render diagram.");
  await expect(page.locator(".file-markdown .mermaid")).toContainText("graph LR");
  expect(errors).toEqual([]);
});
