import { inject } from "vue";
import type { InjectionKey } from "vue";
import type { Feature } from "./actions";
export const sharesKey: InjectionKey<Feature> = Symbol("shares");
export function useShares(): Feature {
  const feature = inject(sharesKey);
  if (!feature) throw new Error("Shares provider missing");
  return feature;
}
