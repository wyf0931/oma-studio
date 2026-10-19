import { defineConfig, devices } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const runtime = mkdtempSync(join(tmpdir(), "oma-frontend-tests-"));
const baseURL = "http://127.0.0.1:8172";

export default defineConfig({
  testDir: "./tests/frontend",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "firefox", use: { ...devices["Desktop Firefox"], viewport: { width: 1440, height: 1000 } } },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 1000 } } },
    { name: "webkit-mobile", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    stdout: "ignore",
    stderr: "ignore",
    command: "uv run uvicorn app.main:app --host 127.0.0.1 --port 8172",
    url: `${baseURL}/api/health`,
    timeout: 60000,
    reuseExistingServer: false,
    env: {
      PI_PLATFORM_DATA_DIR: join(runtime, "data"),
      PI_SESSION_DIR: join(runtime, "sessions"),
      PI_CWD: join(runtime, "workspace"),
      PI_LOG_DIR: join(runtime, "logs"),
      PI_HOME: join(runtime, "pi"),
      PI_AGENTS_HOME: join(runtime, "agents"),
      OMA_ADMIN_PASSWORD: "frontend-test-admin-password",
      OMA_DEFAULT_USER_PASSWORD: "frontend-test-member-password",
    },
  },
});
