import { inject } from "vue";
import type { InjectionKey } from "vue";
import type { Feature } from "./actions";
export const settingsKey: InjectionKey<Feature> = Symbol("settings");
export function useSettings(): Feature {
  const feature = inject(settingsKey);
  if (!feature) throw new Error("Settings provider missing");
  return feature;
}
