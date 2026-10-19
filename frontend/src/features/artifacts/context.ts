import { inject } from "vue";
import type { InjectionKey } from "vue";
import type { Feature } from "./actions";
export const artifactsKey: InjectionKey<Feature> = Symbol("artifacts");
export function useArtifacts(): Feature {
  const feature = inject(artifactsKey);
  if (!feature) throw new Error("Artifacts provider missing");
  return feature;
}
