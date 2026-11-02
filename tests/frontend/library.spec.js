import { test, expect } from "@playwright/test";
import { login } from "./helpers.js";

test("library disables unsupported previews while keeping downloads available", async ({ page }) => {
  const unsupported = [
    "archive.zip",
    "archive.tar",
    "archive.tar.gz",
    "archive.tgz",
    "archive.tar.bz2",
    "archive.tar.xz",
    "archive.7z",
    "archive.rar",
    "report.docx",
  ];
  const supported = ["notes.md", "data.csv", "script.ts", "notes.TXT", "image.png", "report.pdf", "page.html"];
  const files = [...unsupported, ...supported].map((name) => ({
    id: name,
    name,
    path: name,
    extension: name.split(".").pop().toLowerCase(),
    size: 42,
    generated_at: "2026-11-02T00:00:00Z",
    chat_id: "library-fixture",
    agent_name: "Fixture",
  }));
  await page.route("**/api/library/files?*", (route) =>
    route.fulfill({ json: { files, total: files.length, page: 1, page_size: 20, pages: 1 } }),
  );
  await login(page);
  await page.goto("/library");
  for (const name of unsupported) {
    const row = page.locator(".library-table tbody tr").filter({ has: page.getByText(name, { exact: true }).first() });
    await expect(row.getByRole("button", { name: "Open file", exact: true })).toBeDisabled();
    await expect(row.locator(".library-file-name")).toBeDisabled();
    await expect(row.getByRole("link", { name: "Download file", exact: true })).toHaveAttribute(
      "href",
      `/api/chats/library-fixture/files/download?path=${encodeURIComponent(name)}`,
    );
  }
  for (const name of supported) {
    const row = page.locator(".library-table tbody tr").filter({ has: page.getByText(name, { exact: true }).first() });
    await expect(row.getByRole("button", { name: "Open file", exact: true })).toBeEnabled();
  }
  const popupPromise = page.waitForEvent("popup");
  await page
    .locator(".library-table tbody tr")
    .filter({ hasText: "notes.md" })
    .getByRole("button", { name: "Open file", exact: true })
    .click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(/\/file-view\?chat_id=library-fixture&path=notes.md&from=library/);
  await popup.close();
  await page.screenshot({ path: `test-results/library-${test.info().project.name}.png`, fullPage: true });
});
