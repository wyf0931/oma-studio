import { strict as assert } from "node:assert";
import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";

const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

test("session lifecycle owns initialization, cleanup and stale response isolation", async () => {
  const output = mkdtempSync(join(tmpdir(), "oma-lifecycle-"));
  const old = { location: globalThis.location, window: globalThis.window, history: globalThis.history };
  globalThis.location = { origin: "http://localhost", pathname: "/chat", search: "" };
  globalThis.window = new EventTarget();
  window.location = location;
  globalThis.history = { replaceState() {}, pushState() {} };
  try {
    await build({
      configFile: false,
      logLevel: "silent",
      build: {
        outDir: output,
        lib: {
          entry: {
            shell: "frontend/src/app/actions.ts",
            chat: "frontend/src/features/chat/actions.ts",
            api: "frontend/src/shared/api.ts",
          },
          formats: ["es"],
          fileName: (_f, n) => `${n}.mjs`,
        },
      },
    });
    const { createShell } = await import(pathToFileURL(join(output, "shell.mjs")));
    const { createChat } = await import(pathToFileURL(join(output, "chat.mjs")));
    const { createApi } = await import(pathToFileURL(join(output, "api.mjs")));
    const chat = createChat({ shell: { showError() {} } });
    chat.state.messages = [
      { role: "assistant", content: [{ type: "text", text: "keep this answer" }], _streaming: true },
    ];
    const identity = {
      state: { authChecked: true, authUser: null, sessionExpired: false },
      loadSession: async () => {},
      closeProfileMenu() {},
    };
    let healthLoads = 0,
      ended = 0;
    const shell = createShell({
      identity,
      chat,
      settings: {
        state: { settingsOpen: false },
        initializeThemePreference() {},
        resetAccountPassword() {},
        closeSettings() {},
      },
      shares: {
        state: { sharedMode: false },
        setSharedMode(value) {
          this.state.sharedMode = value;
        },
      },
      dom: { observeIcons() {}, observeImageArtifacts() {}, renderIconsSoon() {} },
      i18n: { initI18n: async () => {}, localizedMessage: (x) => x },
      agents: {
        state: { agents: [], resources: { mode: "production" } },
        loadAgents: async () => {},
        loadResources: async () => {},
      },
      artifacts: { setUploadLimits() {} },
      api: {
        client: {
          GET: async () => {
            healthLoads++;
            return { data: { active_processes: 0 } };
          },
        },
      },
      onSessionEnded: () => {
        ended++;
        chat.resetSession();
        identity.state.authUser = null;
      },
    });
    await shell.init();
    assert.equal(shell.state.healthTimer, null);
    identity.state.authUser = { id: "test" };
    await shell.startSession();
    const timer = shell.state.healthTimer;
    assert.ok(timer);
    await shell.startSession();
    assert.equal(shell.state.healthTimer, timer);
    assert.equal(healthLoads, 1);
    chat.state.messages = [{ role: "assistant", content: [{ type: "text", text: "saved" }], _streaming: true }];
    shell.showError(new Error("settings failed"));
    assert.equal(chat.state.messages[0].content[0].text, "saved");
    assert.equal(chat.state.messages[0]._streaming, true);
    assert.equal(chat.state.runError, "");
    chat.failCurrentTurn(new Error("turn failed"));
    assert.equal(chat.state.messages[0].content[0].text, "saved");
    assert.equal(chat.state.messages[0]._streaming, false);
    assert.equal(chat.state.runError, "turn failed");
    shell.state.page = "agents";
    window.dispatchEvent(new Event("popstate"));
    await Promise.resolve();
    assert.equal(shell.state.page, "chat", "popstate listener must exist after initial anonymous boot/login");
    shell.stopSession();
    assert.equal(ended, 1);
    assert.equal(chat.state.messages.length, 0);
    assert.equal(shell.state.healthTimer, null);
    for (const cleanup of shell.state.cleanups) cleanup();
    const pending = deferred();
    let signal;
    const api = createApi({
      baseUrl: "http://localhost",
      fetch: (request) => {
        signal = request.signal;
        return pending.promise;
      },
      i18n: { t: (x) => x },
      onUnauthorized() {},
    });
    const request = api.request("/api/chats");
    api.resetSession();
    assert.equal(signal.aborted, true);
    pending.resolve(new Response("{}", { headers: { "content-type": "application/json" } }));
    await assert.rejects(request, { name: "AbortError" });
  } finally {
    Object.assign(globalThis, old);
    rmSync(output, { recursive: true, force: true });
  }
});
