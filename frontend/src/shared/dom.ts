import type { Workspace } from "../app/workspace";
import { nextTick } from "vue";

// Explicit dependency contract for this feature; the composition root supplies it.
type Context = Pick<Workspace, "cleanups" | "_iconObserver" | "renderIcons" | "resizeAgentTextarea">;
export interface Actions {
  observeIcons(): void;
  observeImageArtifacts(): void;
  resizeStartInput(event: Event): void;
  resizeConversationInput(event: Event): void;
  resetConversationInput(): void;
  resizeAgentTextarea(target: Event | HTMLTextAreaElement): void;
  resizeAgentTextareas(): void;
  scrollMessagesToLatest(): void;
}
export const domActions: Actions = {
  observeIcons(this: Context): void {
    if (!window.MutationObserver) return;
    if (this._iconObserver) return;
    const observer = new MutationObserver((mutations) => {
      const hasIcons = mutations.some((mutation) =>
        [...mutation.addedNodes].some(
          (node) =>
            node instanceof Element &&
            node.tagName?.toLowerCase() !== "svg" &&
            (node.matches?.("[data-lucide]") || node.querySelector?.("[data-lucide]")),
        ),
      );
      if (hasIcons) this.renderIcons();
    });
    // Keep a reference: an unreferenced MutationObserver is garbage-collected
    // even while observing, which silently killed icon conversion after init.
    this._iconObserver = observer;
    observer.observe(document.body, { childList: true, subtree: true });
  },
  observeImageArtifacts(this: Context): void {
    const onImage = (event: Event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement)) return;
      if (event.type === "error" && image.matches(".web-activity-sites img")) image.hidden = true;
      const artifact = image.matches(".chat-image-artifact img") ? image.closest(".chat-image-artifact") : null;
      if (!artifact) return;
      artifact.classList.remove("skeleton");
      artifact.classList.add(event.type === "load" ? "is-loaded" : "is-error");
    };
    document.addEventListener("load", onImage, true);
    document.addEventListener("error", onImage, true);
    this.cleanups.push(() => {
      document.removeEventListener("load", onImage, true);
      document.removeEventListener("error", onImage, true);
    });
  },
  resizeStartInput(this: Context, event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLTextAreaElement)) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 320)}px`;
  },
  resizeConversationInput(this: Context, event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLTextAreaElement)) return;
    const styles = window.getComputedStyle(input);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
    const verticalPadding = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
    const maxHeight = lineHeight * 7 + verticalPadding;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`;
    input.style.overflowY = input.scrollHeight > maxHeight ? "auto" : "hidden";
  },
  resetConversationInput(this: Context): void {
    nextTick(() => {
      const input = document.querySelector<HTMLTextAreaElement>('[data-ref="conversationInput"]');
      if (!input) return;
      input.style.height = "";
      input.style.overflowY = "hidden";
    });
  },
  resizeAgentTextarea(this: Context, target: Event | HTMLTextAreaElement): void {
    const textarea = target instanceof Event ? target.target : target;
    if (!(textarea instanceof HTMLTextAreaElement)) return;
    if (!textarea) return;
    const styles = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
    const verticalPadding =
      (Number.parseFloat(styles.paddingTop) || 0) + (Number.parseFloat(styles.paddingBottom) || 0);
    const maxHeight = lineHeight * 5 + verticalPadding;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  },
  resizeAgentTextareas(this: Context): void {
    ["new-agent-description", "new-agent-quickstarts", "new-agent-instruction"].forEach((id) => {
      const textarea = document.querySelector<HTMLTextAreaElement>(`#${id}`);
      if (textarea) this.resizeAgentTextarea(textarea);
    });
  },
  scrollMessagesToLatest(this: Context): void {
    nextTick(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const chatContent = document.querySelector<HTMLElement>('[data-ref="chatContent"]');
          if (chatContent) chatContent.scrollTop = chatContent.scrollHeight;
        });
      });
    });
  },
};
