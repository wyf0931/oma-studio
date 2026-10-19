import { strict as assert } from "node:assert";
import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { build } from "vite";
import { validateMessagesResponse, validateStreamEnvelope } from "../frontend/src/generated/validators.mjs";

const chat = {
  id: "fixture",
  session_id: "fixture",
  agent_id: "agent",
  title: "fixture",
  status: "ready",
  created_at: "now",
  updated_at: "now",
  last_activity_at: "now",
};
test("generated guards preserve Pi extensions and reject malformed known events", () => {
  assert(
    validateMessagesResponse({
      messages: [{ role: "assistant", content: [{ type: "text", text: "hello" }], futureField: { nested: true } }],
    }),
  );
  assert(!validateMessagesResponse({ messages: [{ content: [] }] }));
  assert(!validateStreamEnvelope({ type: "delta", delta: 42 }));
  assert(!validateStreamEnvelope({ type: "complete", chat: { id: "missing metadata" } }));
  assert(validateStreamEnvelope({ type: "complete", chat, messages: [] }));
});

test("typed transport validates responses, keeps request IDs and handles auth failures", async () => {
  const output = mkdtempSync(join(tmpdir(), "oma-contract-tests-"));
  try {
    await build({
      configFile: false,
      logLevel: "silent",
      build: {
        outDir: output,
        lib: {
          entry: { api: "frontend/src/shared/api.ts", messages: "frontend/src/features/chat/messages.ts" },
          formats: ["es"],
          fileName: (_format, name) => `${name}.mjs`,
        },
      },
    });
    const { createApi, unwrap } = await import(pathToFileURL(join(output, "api.mjs")));
    const { parseStreamEvent, decodeMessages } = await import(pathToFileURL(join(output, "messages.mjs")));
    const ids = [],
      unauthorized = [];
    let payload = { ok: true, active_processes: 0, upload_limits: { max_files: 100, max_bytes: 1000 } },
      status = 200;
    const api = createApi({
      baseUrl: "http://unit.invalid",
      i18n: { t: (_key, options) => options.defaultValue },
      onUnauthorized: (_response, path, error) => unauthorized.push({ path, error }),
      fetch: async (request) => {
        ids.push(request.headers.get("X-Request-ID"));
        return Response.json(payload, { status, headers: { "X-Request-ID": "server-contract-request" } });
      },
    });
    assert.equal(unwrap(await api.client.GET("/api/health")).active_processes, 0);
    assert.match(ids[0], /^[0-9a-f-]{36}$/);
    payload = { ok: true };
    await assert.rejects(
      api.client.GET("/api/health"),
      (error) => error.requestId === "server-contract-request" && error.message.includes("contract"),
    );
    status = 401;
    payload = { detail: "Sign in", code: "auth.required", params: {} };
    await assert.rejects(api.client.GET("/api/agents"), (error) => error.status === 401);
    assert.equal(unauthorized[0].path, "/api/agents");
    assert.equal(parseStreamEvent(JSON.stringify({ type: "future_pi_event", anything: true })), null);
    assert.throws(() => parseStreamEvent(JSON.stringify({ type: "delta", delta: 123 })), /Invalid streamed event/);
    const complete = parseStreamEvent(
      JSON.stringify({
        type: "complete",
        chat,
        messages: [{ role: "assistant", content: "hello", usage: { input: "42" } }],
      }),
    );
    const messages = decodeMessages(complete.messages);
    assert.equal(messages[0].content[0].text, "hello");
    assert.equal(messages[0].usage.input, 42);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
