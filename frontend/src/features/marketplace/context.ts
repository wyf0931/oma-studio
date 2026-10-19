import { inject } from "vue";
import type { InjectionKey } from "vue";
import type { Feature } from "./actions";
export const marketplaceKey: InjectionKey<Feature> = Symbol("marketplace");
export function useMarketplace(): Feature {
  const feature = inject(marketplaceKey);
  if (!feature) throw new Error("Marketplace provider missing");
  return feature;
}
