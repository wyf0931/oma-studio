import { inject } from "vue";
import type { InjectionKey } from "vue";
import type { Feature } from "./content";
export const contentKey: InjectionKey<Feature> = Symbol("content");
export function useContent(): Feature {
  const feature = inject(contentKey);
  if (!feature) throw new Error("Content provider missing");
  return feature;
}
