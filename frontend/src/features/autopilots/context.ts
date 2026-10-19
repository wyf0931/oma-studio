import { inject } from "vue";
import type { InjectionKey } from "vue";
import type { Feature } from "./actions";
export const autopilotsKey: InjectionKey<Feature> = Symbol("autopilots");
export function useAutopilots(): Feature {
  const feature = inject(autopilotsKey);
  if (!feature) throw new Error("Autopilots provider missing");
  return feature;
}
