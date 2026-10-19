import { test, expect } from "@playwright/test";
import { login, settings } from "./helpers.js";

test("Agent wizard edits persist through the existing API", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  const name = `Vue fixture ${Date.now()}`;
  const response = await page.request.post("/api/agents", {
    data: { name, instruction: "A disposable browser fixture." },
  });
  expect(response.ok()).toBe(true);
  const agent = await response.json();
  try {
    await page.goto("/agents");
    const card = page.locator(".agent-card").filter({ hasText: name });
    await card.hover();
    await card.getByRole("button", { name: "Edit agent", exact: true }).click();
    await page.locator("#new-agent-name").fill(`${name} edited`);
    await page.locator("#new-agent-description").fill("Saved by the Vue wizard");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator(".agent-card").filter({ hasText: `${name} edited` })).toBeVisible();
    expect((await (await page.request.get(`/api/agents/${agent.id}`)).json()).description).toBe(
      "Saved by the Vue wizard",
    );
    expect(errors).toEqual([]);
  } finally {
    await page.request.delete(`/api/agents/${agent.id}`);
  }
});

test("chat streaming completes, reasoning toggles and history survives navigation", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const chat = { id: "vue-stream-fixture", agent_id: "default", title: "Vue stream fixture", status: "ready" };
  let completed = false;
  const messages = [
    {
      id: "thinking",
      role: "assistant",
      content: [
        { type: "thinking", thinking: "Check the fixture" },
        {
          type: "toolCall",
          name: "web_fetch",
          arguments: {
            url: "https://example.com/fixture",
            _webResult: {
              content: [{ type: "text", text: "Title: Fixture source" }],
              details: { sourceUrl: "https://example.com/fixture" },
            },
          },
        },
      ],
      stopReason: "toolUse",
    },
    { id: "answer", role: "assistant", content: [{ type: "text", text: "A streamed **answer**" }], stopReason: "stop" },
  ];
  await page.route("**/api/chats", (route) => route.fulfill({ json: { chats: [chat] } }));
  await page.route("**/api/chats/vue-stream-fixture", (route) => route.fulfill({ json: chat }));
  await page.route("**/api/chats/vue-stream-fixture/messages*", async (route) => {
    if (route.request().method() !== "POST") return route.fulfill({ json: { messages: completed ? messages : [] } });
    completed = true;
    await route.fulfill({
      contentType: "text/event-stream",
      body: [
        { type: "thinking_delta", delta: "Check the fixture" },
        { type: "assistant_message_end" },
        { type: "delta", delta: "A streamed **answer**" },
        { type: "complete", chat, messages },
      ]
        .map((event) => `data: ${JSON.stringify(event)}\n\n`)
        .join(""),
    });
  });
  await login(page);
  await page.goto("/chat/vue-stream-fixture");
  await page.locator("#conversation-message").fill("Test a stream");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".message-list strong")).toHaveText("answer");
  const thinking = page.locator(".reasoning-collapse input");
  await expect(thinking).not.toBeChecked();
  await thinking.check();
  await expect(thinking).toBeChecked();
  await page.locator(".web-activity-arrow").click();
  await expect(page.locator(".link-drawer")).toHaveCount(1);
  await expect(page.locator(".link-drawer")).toBeVisible();
  await expect(page.locator(".link-drawer")).toContainText("Fixture source");
  await page.goto("/agents");
  await page.goBack();
  await expect(page.locator(".message-list strong")).toHaveText("answer");
  expect(errors).toEqual([]);
});

test("settings Escape and usage queries retain their lifecycle", async ({ page }) => {
  await page.route("**/api/usage?days=*", (route) =>
    route.fulfill({
      json: {
        summary: { session_count: 3, input_tokens: 1234, total_cost: 0.25 },
        daily: [{ date: "2026-10-19", total_cost: 0.25 }],
      },
    }),
  );
  await login(page);
  await settings(page);
  await page.keyboard.press("Escape");
  await expect(page.locator(".settings-dialog")).not.toBeVisible();
  if (
    (await page.locator(".mobile-topbar").isVisible()) &&
    !(await page.getByRole("button", { name: "Close chat history", exact: true }).isVisible())
  )
    await page.locator(".mobile-topbar button").first().click();
  await page.locator(".sidebar-profile-trigger").click();
  const query = page.waitForRequest((request) => request.url().includes("/api/usage?days="));
  await page.getByRole("button", { name: "Usage", exact: true }).click();
  await query;
  await expect(page.locator(".usage-dialog")).toBeVisible();
  await expect(page.locator(".usage-stat-card .stat-value").nth(1)).toHaveText("1.2k");
  await expect(page.locator(".usage-cost-card .stat-value")).toHaveText("¥0.2500");
});
