import { inject, toRef } from "vue";
import type { InjectionKey, Ref } from "vue";
import type { Workspace } from "./workspace";
export const workspaceKey: InjectionKey<Workspace> = Symbol("workspace");
// Views declare their dependency surface; no application object is exposed to templates.
export function useWorkspaceScope<K extends keyof Workspace>(
  keys: readonly K[],
  source?: Workspace,
): { [P in K]: Ref<Workspace[P]> } {
  const workspace = source ?? inject(workspaceKey);
  if (!workspace) throw new Error("Workspace provider missing");
  return Object.fromEntries(keys.map((key) => [key, toRef(workspace, key)])) as unknown as {
    [P in K]: Ref<Workspace[P]>;
  };
}
