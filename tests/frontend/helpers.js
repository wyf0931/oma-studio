import { expect } from "@playwright/test";

export async function login(page) {
  await page.goto("/chat");
  await page.locator('.login-card input[autocomplete="username"]').fill("admin");
  await page.locator('.login-card input[autocomplete="current-password"]').fill("frontend-test-admin-password");
  await page.locator(".login-submit").click();
  await expect(page.locator(".app-shell")).toBeVisible();
}

export async function settings(page) {
  // On mobile the existing navigation is behind the existing sidebar toggle.
  if (await page.locator(".mobile-topbar").isVisible()) {
    await page.locator(".mobile-topbar button").first().click();
  }
  await page.locator(".sidebar-profile-trigger").click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
}
