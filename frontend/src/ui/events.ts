import { onBeforeUnmount } from "vue";
import type { ObjectDirective } from "vue";

const outsideHandlers = new WeakMap<HTMLElement, (event: MouseEvent) => void>();
export const vOutside: ObjectDirective<HTMLElement, () => void> = {
  mounted(el, binding) {
    const handler = (event: MouseEvent) => {
      if (event.target instanceof Node && !el.contains(event.target) && el.getClientRects().length) binding.value();
    };
    outsideHandlers.set(el, handler);
    document.addEventListener("click", handler);
  },
  unmounted(el) {
    const handler = outsideHandlers.get(el);
    if (handler) document.removeEventListener("click", handler);
    outsideHandlers.delete(el);
  },
};

// Escape-key close for modal dialogs. A single document-level listener closes only
// the topmost visible dialog, so stacked modals (e.g. a confirm over a list) dismiss
// one layer at a time instead of collapsing the whole stack.
const escapeHandlers = new WeakMap<HTMLElement, () => void>();
const escapeDialogs = new Set<HTMLElement>();
function handleDocumentEscape(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  const visible = [...escapeDialogs].filter((el) => el.getClientRects().length > 0);
  if (!visible.length) return;
  visible.sort((a, b) => {
    if (a === b) return 0;
    return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });
  const top = visible[visible.length - 1];
  if (top) escapeHandlers.get(top)?.();
}
export const vEscape: ObjectDirective<HTMLElement, () => void> = {
  mounted(el, binding) {
    escapeDialogs.add(el);
    escapeHandlers.set(el, binding.value);
    if (escapeDialogs.size === 1) document.addEventListener("keydown", handleDocumentEscape);
  },
  updated(el, binding) {
    escapeHandlers.set(el, binding.value);
  },
  unmounted(el) {
    escapeDialogs.delete(el);
    escapeHandlers.delete(el);
    if (!escapeDialogs.size) document.removeEventListener("keydown", handleDocumentEscape);
  },
};
export function useDebouncedCallback(callback: () => void, delay = 300): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  onBeforeUnmount(() => clearTimeout(timer));
  return () => {
    clearTimeout(timer);
    timer = setTimeout(callback, delay);
  };
}
