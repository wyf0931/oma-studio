import { inject } from "vue";
import type { InjectionKey } from "vue";
import type { Feature } from "./actions";
export const usageKey: InjectionKey<Feature> = Symbol("usage");
export function useUsage(): Feature {
  const feature = inject(usageKey);
  if (!feature) throw new Error("Usage provider missing");
  return feature;
}
