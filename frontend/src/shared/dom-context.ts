import { inject } from "vue";
import type { InjectionKey } from "vue";
import type { Feature } from "./dom";
export const domKey: InjectionKey<Feature> = Symbol("dom");
export function useDom(): Feature {
  const feature = inject(domKey);
  if (!feature) throw new Error("Dom provider missing");
  return feature;
}
