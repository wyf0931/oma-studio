import { expect, test } from "@playwright/test";
import { login } from "./helpers.js";

// The new-task composer paints its text through a highlight mirror layered over a
// transparent textarea. Vue's v-model does not track uncommitted IME text, so the
// composer must hand rendering back to the textarea while composing — otherwise the
// pinyin buffer is drawn nowhere and the field looks empty.
test("in-progress IME composition stays visible in the new-task composer", async ({ page }) => {
  await login(page);
  const box = page.locator("#new-chat-message");
  const editor = page.locator(".skill-command-editor");
  const mirror = page.locator(".skill-command-highlight");
  await expect(box).toBeVisible();
  await box.click();

  // Composition input carries isComposing; that is the only event with the live text.
  await box.evaluate((el) => {
    const field = el;
    field.value = "jieshao";
    field.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    field.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true }));
  });

  await expect(editor).toHaveClass(/is-composing/);
  await expect(mirror).toHaveCSS("visibility", "hidden");
  // The textarea must render its own text instead of remaining transparent.
  await expect(box).not.toHaveCSS("-webkit-text-fill-color", "rgba(0, 0, 0, 0)");
  await expect(box).toHaveJSProperty("value", "jieshao");

  // Committing the candidate returns the composer to the highlight mirror.
  await box.evaluate((el) => {
    const field = el;
    field.value = "介绍";
    field.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "介绍" }));
    field.dispatchEvent(new InputEvent("input", { bubbles: true }));
  });

  await expect(editor).not.toHaveClass(/is-composing/);
  await expect(mirror).toHaveCSS("visibility", "visible");
  await expect(mirror).toHaveText("介绍");
  await expect(box).toHaveCSS("-webkit-text-fill-color", "rgba(0, 0, 0, 0)");
});
