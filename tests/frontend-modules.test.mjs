import { strict as assert } from "node:assert";
import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { build } from "vite";

test("feature factories own independent state and consume only declared capabilities", async () => {
  const output = mkdtempSync(join(tmpdir(), "oma-feature-tests-"));
  try {
    await build({
      configFile: false,
      logLevel: "silent",
      build: {
        outDir: output,
        lib: {
          entry: { usage: "frontend/src/features/usage/actions.ts", chat: "frontend/src/features/chat/actions.ts" },
          formats: ["es"],
          fileName: (_format, name) => `${name}.mjs`,
        },
      },
    });
    const { createUsage } = await import(pathToFileURL(join(output, "usage.mjs")));
    const { createChat } = await import(pathToFileURL(join(output, "chat.mjs")));
    const first = createUsage({
      api: { client: { GET: async () => ({ data: { summary: { input_tokens: 1234, cost: 0.5 } } }) } },
    });
    const second = createUsage({ api: { client: { GET: async () => ({ data: {} }) } } });
    await first.loadUsage();
    assert.equal(first.state.usageData.summary.input, 1234);
    assert.equal(second.state.usageData.summary.input, 0);
    const chat = createChat({ presentation: { partsText: (parts) => parts.map((part) => part.text || "").join("") } });
    chat.state.messages = [{ role: "assistant", content: [], _reasoningParts: [], _streaming: true }];
    chat.updateStreamingThinking("first");
    chat.markStreamingAssistantMessageEnd();
    chat.updateStreamingThinking("second");
    chat.updateStreamingAssistant("answer", true);
    assert.equal(chat.state.messages[0]._reasoningParts.length, 2);
    assert.equal(chat.state.messages[0].content[0].text, "answer");
    assert.equal(createChat({}).state.messages.length, 0);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
