import type { Workspace } from "../app/workspace";
// Dynamic sanitized HTML is not compiled as a Vue template. Delegate only known controls.
export function installContentEvents(
  actions: Pick<Workspace, "copyCodeBlock" | "openWebActivity" | "setReasoningOpen">,
): () => void {
  const click = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const container = event.target.closest("[data-rendered-content]");
    if (!container) return;
    const copy = event.target.closest<HTMLElement>("[data-copy-code]");
    if (copy) {
      void actions.copyCodeBlock(copy);
      return;
    }
    if (event.target.closest("a")) return;
    const activity = event.target.closest<HTMLElement>("[data-web-activity-id]");
    if (activity) {
      event.stopPropagation();
      actions.openWebActivity(activity);
    }
  };
  const change = (event: Event) => {
    if (
      event.target instanceof HTMLInputElement &&
      event.target.matches("[data-rendered-content] [data-reasoning-key]")
    )
      actions.setReasoningOpen(event.target);
  };
  const keydown = (event: KeyboardEvent) => {
    if (
      !(event.target instanceof HTMLElement) ||
      !event.target.matches("[data-rendered-content] [data-web-activity-id]")
    )
      return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      actions.openWebActivity(event.target);
    }
  };
  document.addEventListener("click", click);
  document.addEventListener("change", change);
  document.addEventListener("keydown", keydown);
  return () => {
    document.removeEventListener("click", click);
    document.removeEventListener("change", change);
    document.removeEventListener("keydown", keydown);
  };
}
