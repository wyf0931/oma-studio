import { inject } from "vue";
import type { InjectionKey } from "vue";
import type { Feature } from "./actions";
export const identityKey: InjectionKey<Feature> = Symbol("identity");
export function useIdentity(): Feature {
  const feature = inject(identityKey);
  if (!feature) throw new Error("Identity provider missing");
  return feature;
}
