import { inject } from "vue";
import type { InjectionKey } from "vue";
import type { Feature } from "./format";
export const formatKey: InjectionKey<Feature> = Symbol("format");
export function useFormat(): Feature {
  const feature = inject(formatKey);
  if (!feature) throw new Error("Format provider missing");
  return feature;
}
