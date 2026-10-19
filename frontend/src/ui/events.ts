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
export function useDebouncedCallback(callback: () => void, delay = 300): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  onBeforeUnmount(() => clearTimeout(timer));
  return () => {
    clearTimeout(timer);
    timer = setTimeout(callback, delay);
  };
}
