import { expect, test } from "@playwright/test";
import { login } from "./helpers.js";

const records = {
  shares: [
    {
      token: "UtQ32tYz0hw_wz3-F",
      chat_id: "chat-1",
      title: "youtube-transcripts/YBh8rQv4aTQ/summary.md",
      created_at: "2026-09-22T09:58:00Z",
      kind: "artifact",
      url: "/share/UtQ32tYz0hw_wz3-F?share=UtQ32tYz0hw_wz3-F&path=summary.md&from=chat",
      artifact_type: "markdown",
      path: "youtube-transcripts/YBh8rQv4aTQ/summary.md",
    },
    {
      token: "WQeZP_4odWmJH6eb",
      chat_id: "chat-2",
      title: "Quarterly research summary",
      created_at: "2026-09-22T09:51:00Z",
      kind: "session",
      url: "/share/WQeZP_4odWmJH6eb",
      artifact_type: null,
      path: null,
    },
  ],
};

async function openShareRecords(page) {
  // On mobile the existing navigation is behind the existing sidebar toggle.
  if (await page.locator(".mobile-topbar").isVisible()) {
    const closeHistory = page.getByRole("button", { name: "Close chat history", exact: true });
    if (!(await closeHistory.isVisible())) await page.locator(".mobile-topbar button").first().click();
  }
  await page.locator(".sidebar-profile-trigger").click();
  await page.getByRole("button", { name: "Share records", exact: true }).click();
  await expect(page.locator(".share-records-dialog")).toBeVisible();
}

test("share records open a read-only view without triggering revoke", async ({ page }) => {
  await page.route("**/api/shares", (route) => route.fulfill({ json: records }));
  await login(page);
  await openShareRecords(page);

  const rows = page.locator(".share-record-row");
  await expect(rows).toHaveCount(2);

  // The row is a click target; the actions column is not.
  await expect(rows.first()).toHaveCSS("cursor", "pointer");
  await expect(rows.first().locator("td").last()).toHaveCSS("cursor", "default");

  // A data cell opens the share page in a new tab.
  const [rowTab] = await Promise.all([page.context().waitForEvent("page"), rows.first().locator("td").first().click()]);
  expect(new URL(rowTab.url()).pathname).toBe("/share/UtQ32tYz0hw_wz3-F");
  await rowTab.close();

  // The actions column exposes the same read-only view through the eye button.
  const eye = rows.first().locator(".share-record-actions a");
  await expect(eye).toHaveAttribute("target", "_blank");
  await expect(eye).toHaveAttribute("rel", "noopener noreferrer");
  const [eyeTab] = await Promise.all([page.context().waitForEvent("page"), eye.click()]);
  expect(new URL(eyeTab.url()).pathname).toBe("/share/UtQ32tYz0hw_wz3-F");
  await eyeTab.close();

  // Revoking must stay inside the dialog instead of opening the share page.
  const revoke = rows.first().locator(".share-record-actions button");
  await revoke.click();
  await expect(page.locator(".confirm-box")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".confirm-box")).not.toBeVisible();
  await expect(page.locator(".share-records-dialog")).toBeVisible();
});
