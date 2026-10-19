import { inject } from "vue";
import type { InjectionKey } from "vue";
import type { Feature } from "./api";
export const apiKey: InjectionKey<Feature> = Symbol("api");
export function useApi(): Feature {
  const feature = inject(apiKey);
  if (!feature) throw new Error("Api provider missing");
  return feature;
}
