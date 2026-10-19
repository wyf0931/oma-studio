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
const flush = () => new Promise((resolve) => setImmediate(resolve));

test("superseded reads cannot overwrite data, errors or loading; polling is serialized and bounded", async () => {
  const output = mkdtempSync(join(tmpdir(), "oma-async-"));
  try {
    await build({
      configFile: false,
      logLevel: "silent",
      build: {
        outDir: output,
        lib: {
          entry: {
            usage: "frontend/src/features/usage/actions.ts",
            artifacts: "frontend/src/features/artifacts/actions.ts",
            chat: "frontend/src/features/chat/actions.ts",
          },
          formats: ["es"],
          fileName: (_f, n) => `${n}.mjs`,
        },
      },
    });
    const { createUsage } = await import(pathToFileURL(join(output, "usage.mjs")));
    const { createArtifacts } = await import(pathToFileURL(join(output, "artifacts.mjs")));
    const { createChat } = await import(pathToFileURL(join(output, "chat.mjs")));
    const calls = [];
    const GET = (path, options) => {
      const pending = deferred();
      calls.push({ path, options, ...pending });
      return pending.promise;
    };
    const usage = createUsage({ api: { client: { GET } } });
    const first = usage.loadUsage();
    const second = usage.setUsageRange("30");
    assert.equal(calls[0].options.signal.aborted, true);
    assert.equal(calls[1].options.params.query.days, 30);
    calls[0].resolve({ data: { summary: { input_tokens: 7 } } });
    await first;
    assert.equal(usage.state.usageLoading, true);
    calls[1].resolve({ data: { summary: { input_tokens: 30 } } });
    await second;
    assert.equal(usage.state.usageData.summary.input, 30);
    assert.equal(usage.state.usageLoading, false);
    const errors = [];
    const artifacts = createArtifacts({ api: { client: { GET } }, shell: { showError: (e) => errors.push(e) } });
    calls.length = 0;
    const old = artifacts.loadLibrary(1);
    const latest = artifacts.loadLibrary(2);
    calls[1].resolve({ data: { files: [{ path: "new" }], pages: 2, total: 21 } });
    await latest;
    calls[0].resolve({ data: { files: [{ path: "old" }], pages: 1, total: 1 } });
    await old;
    assert.equal(artifacts.state.libraryFiles[0].path, "new");
    assert.equal(artifacts.state.libraryPage, 2);
    const stale = artifacts.loadLibrary(1);
    artifacts.resetSession();
    calls[2].resolve({ data: { files: [{ path: "private" }], pages: 1, total: 1 } });
    await stale;
    assert.deepEqual(artifacts.state.libraryFiles, []);
    assert.equal(errors.length, 0);
    // A second file-view navigation wins even when the first network request ignores abort.
    const oldLocation = globalThis.location,
      oldDocument = globalThis.document;
    globalThis.location = { search: "?chat_id=c&path=old.txt" };
    globalThis.document = { title: "test" };
    try {
      calls.length = 0;
      const firstView = artifacts.loadFileViewer();
      location.search = "?chat_id=c&path=new.txt";
      const secondView = artifacts.loadFileViewer();
      calls[1].resolve({ data: { content: "new" } });
      await secondView;
      calls[0].resolve({ data: { content: "old" } });
      await firstView;
      assert.equal(artifacts.state.fileViewer.content, "new");
      assert.equal(document.title, "new.txt");
      artifacts.resetSession();
    } finally {
      globalThis.location = oldLocation;
      globalThis.document = oldDocument;
    }
    const nativeSet = globalThis.setTimeout,
      nativeClear = globalThis.clearTimeout;
    const timers = new Map();
    let next = 0;
    globalThis.setTimeout = (callback, delay) => {
      const id = ++next;
      timers.set(id, { callback, delay });
      return id;
    };
    globalThis.clearTimeout = (id) => timers.delete(id);
    try {
      calls.length = 0;
      const chat = createChat({
        api: { client: { GET } },
        shell: { state: { mode: "production" }, showError: (e) => errors.push(e) },
        presentation: { normalizeMessages: (x) => x, messagesFingerprint: JSON.stringify },
        artifacts: { refreshOpenFiles: async () => {} },
      });
      chat.state.activeChat = { id: "c", status: "running" };
      chat.state.loading = true;
      const runNext = async () => {
        const [id, timer] = timers.entries().next().value;
        timers.delete(id);
        timer.callback();
        await flush();
      };
      chat.startPolling("c");
      await runNext();
      assert.equal(calls.length, 1);
      assert.equal(timers.size, 0, "slow request must not schedule overlapping work");
      chat.stopPolling();
      assert.equal(calls[0].options.signal.aborted, true);
      calls[0].resolve({ data: { id: "c", status: "running" } });
      await flush();
      assert.equal(timers.size, 0, "stopped loop must not reschedule itself");
      chat.startPolling("c");
      for (let i = 0; i < 3; i++) {
        await runNext();
        calls.at(-1).resolve({ error: "unavailable" });
        await flush();
      }
      assert.equal(timers.size, 0);
      assert.equal(chat.state.loading, false);
      assert.equal(errors.length, 1, "persistent failures must be visible exactly once");
    } finally {
      globalThis.setTimeout = nativeSet;
      globalThis.clearTimeout = nativeClear;
    }
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
