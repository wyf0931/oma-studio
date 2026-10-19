import { inject } from "vue";
import type { InjectionKey } from "vue";
import type { Feature } from "./actions";
export const shellKey: InjectionKey<Feature> = Symbol("shell");
export function useShell(): Feature {
  const feature = inject(shellKey);
  if (!feature) throw new Error("Shell provider missing");
  return feature;
}
