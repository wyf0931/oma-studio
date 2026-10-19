import { test, expect } from "@playwright/test";

import { login, settings } from "./helpers.js";

test("bundled app boots offline from CDNs, with stable icons and platform APIs", async ({ page, baseURL }) => {
  const errors = [];
  const externalDependencies = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["script", "stylesheet"].includes(request.resourceType()) && !request.url().startsWith(baseURL)) {
      externalDependencies.push(request.url());
      await route.abort();
    } else {
      await route.continue();
    }
  });
  await page.addInitScript(() => {
    // Web Crypto's UUID convenience API is absent in some embedded contexts.
    Object.defineProperty(crypto, "randomUUID", { configurable: true, value: undefined });
  });
  await login(page);
  await expect(page.locator("svg.lucide").first()).toBeAttached();
  await expect(page.locator(".sidebar-profile-trigger")).toContainText("admin");
  expect(await page.evaluate(() => "Alpine" in window || "omaPlatform" in window)).toBe(false);
  expect(externalDependencies).toEqual([]);
  expect(errors).toEqual([]);
});

test("existing settings, themes and language work on desktop and mobile", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await settings(page);
  await page.getByRole("button", { name: "Account", exact: true }).click();
  await expect(page.locator("#account-nickname")).toBeVisible();
  await expect(page.locator("#account-email")).toBeVisible();
  if (page.viewportSize().width === 1440) {
    // Measured pre-migration desktop geometry, independent of bundle/CSS internals.
    const box = await page.locator(".settings-modal-box").boundingBox();
    expect(box.width).toBe(920);
    expect(box.height).toBe(764);
    expect((await page.locator("#account-nickname").boundingBox()).height).toBe(40);
  }
  await page.getByRole("button", { name: "Change password", exact: true }).click();
  await expect(page.locator("#account-current-password")).toBeVisible();
  await page.locator("#account-current-password").fill("browser-test-only");
  await page.getByRole("button", { name: "Show current password", exact: true }).click();
  await expect(page.locator("#account-current-password")).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "General", exact: true }).click();
  await page.locator('input[name="settings-theme"][value="dark"]').check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator("#settings-language").selectOption("zh-CN");
  await page.getByRole("button", { name: "账号", exact: true }).click();
  await expect(page.locator("#account-email")).toBeVisible();
  const noOverflow = await page.locator(".settings-modal-box").evaluate((el) => el.scrollWidth <= el.clientWidth);
  expect(noOverflow).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("settings.png") });
  expect(errors).toEqual([]);
});

test("sanitized Markdown, highlighting and Mermaid render from local chunks", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await page.route("**/api/chats/preview-fixture/files/content?*", (route) =>
    route.fulfill({
      json: {
        content:
          "# Preview\n\n<script>window.markdownXSS = true</script>\n\n```javascript\nconst value = 42;\n```\n\n```mermaid\ngraph LR\nA[Start] --> B[Finish]\n```",
      },
    }),
  );
  await page.goto("/file-view?chat_id=preview-fixture&path=preview.md");
  await expect(page.locator(".file-markdown h1")).toHaveText("Preview");
  await expect(page.locator(".file-markdown code.hljs")).toBeVisible();
  await expect(page.locator(".file-markdown .mermaid svg")).toBeVisible();
  expect(await page.evaluate(() => window.markdownXSS)).toBeUndefined();
  expect(errors).toEqual([]);
});

test("deep links, build cache headers and upload controls preserve the same origin", async ({ page, request }) => {
  const shell = await request.get("/share/invalid-share-token");
  expect(shell.status()).toBe(200);
  expect(shell.headers()["cache-control"]).toBe("no-cache");
  const html = await shell.text();
  expect(html).not.toContain("cdn.jsdelivr.net");
  expect(html).toContain("/static/assets/");
  const script = html.match(/src="(\/static\/assets\/[^\"]+\.js)"/)[1];
  const asset = await request.get(script);
  expect(asset.status()).toBe(200);
  expect(asset.headers()["cache-control"]).toContain("immutable");
  await login(page);
  const file = page.locator('input[type="file"]').first();
  await expect(file).toBeAttached();
  await expect(file).toBeHidden();
  const uuidHeader = page.waitForRequest((req) => req.url().includes("/api/health"));
  await page.reload();
  expect((await uuidHeader).headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
});

test("file selection and existing navigation remain usable", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await page.locator('input[data-ref="uploadInput"]').setInputFiles({
    name: "compatibility-note.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("A browser-compatibility fixture."),
  });
  await expect(page.locator(".composer-attachment").first()).toContainText("compatibility-note.txt");
  for (const [label, route] of [
    ["Agents", "agents"],
    ["Marketplace", "market"],
    ["Autopilots", "autopilots"],
    ["Library", "library"],
  ]) {
    if (
      (await page.locator(".mobile-topbar").isVisible()) &&
      !(await page.getByRole("button", { name: "Close chat history", exact: true }).isVisible())
    ) {
      await page.locator(".mobile-topbar button").first().click();
    }
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${route}$`));
  }
  await page.reload();
  await expect(page.locator(".app-shell")).toBeVisible();
  expect(errors).toEqual([]);
});

test("clipboard compatibility preserves copy feedback without the native API", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
  });
  await login(page);
  await page.route("**/api/chats/copy-fixture/files/content?*", (route) =>
    route.fulfill({ json: { content: "Clipboard compatibility fixture" } }),
  );
  await page.goto("/file-view?chat_id=copy-fixture&path=fixture.py");
  await page.locator(".code-copy-btn").click();
  await expect(page.locator(".code-copy-btn")).toHaveClass(/copied/);
  expect(errors).toEqual([]);
});
