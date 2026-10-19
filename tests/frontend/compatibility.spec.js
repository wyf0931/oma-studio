import { test, expect } from "@playwright/test";

async function login(page) {
  await page.goto("/chat");
  await page.locator('[x-model="loginUsername"]').fill("admin");
  await page.locator('[x-model="loginPassword"]').fill("frontend-test-admin-password");
  await page.locator(".login-submit").click();
  await expect(page.locator(".app-shell")).toBeVisible();
}

async function settings(page) {
  // On mobile the existing navigation is behind the existing sidebar toggle.
  if (await page.locator(".mobile-topbar").isVisible()) {
    await page.locator(".mobile-topbar button").first().click();
  }
  await page.locator(".sidebar-profile-trigger").click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
}

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
  const requests = await page.evaluate(() => window.omaPlatform.authUser?.username);
  expect(requests).toBe("admin");
  expect(externalDependencies).toEqual([]);
  expect(errors).toEqual([]);
});

test("existing settings, themes and language work on desktop and mobile", async ({ page }) => {
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
  expect(errors).toEqual([]);
});

test("sanitized Markdown, highlighting and Mermaid render from local chunks", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await page.evaluate(() => {
    const source =
      "# Preview\n\n<script>window.markdownXSS = true</script>\n\n```javascript\nconst value = 42;\n```\n\n```mermaid\ngraph LR\nA[Start] --> B[Finish]\n```";
    const container = document.createElement("div");
    container.className = "file-markdown";
    container.innerHTML = window.omaPlatform.renderMarkdown(source);
    document.body.append(container);
    window.omaPlatform.renderMermaidDiagrams();
  });
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
  await page.evaluate(() => window.omaPlatform.loadHealth());
  expect((await uuidHeader).headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
});

test("file selection and existing navigation remain usable", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await page.locator('input[x-ref="uploadInput"]').setInputFiles({
    name: "compatibility-note.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("A browser-compatibility fixture."),
  });
  await expect
    .poll(() => page.evaluate(() => window.omaPlatform.uploadSelection[0]?.name))
    .toBe("compatibility-note.txt");
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
  await page.evaluate(() => {
    const button = document.createElement("button");
    button.id = "clipboard-compatibility-fixture";
    button.textContent = "Copy browser fixture";
    button.style.cssText = "position:fixed;top:0;right:0;z-index:9999";
    button.onclick = () =>
      window.omaPlatform.copyMessage({
        _key: "clipboard-fixture",
        content: [{ type: "text", text: "Clipboard compatibility fixture" }],
      });
    document.body.append(button);
  });
  await page.locator("#clipboard-compatibility-fixture").click();
  await expect.poll(() => page.evaluate(() => window.omaPlatform.copiedKey)).toBe("clipboard-fixture");
  expect(errors).toEqual([]);
});
