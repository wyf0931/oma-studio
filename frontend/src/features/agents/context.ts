import { inject } from "vue";
import type { InjectionKey } from "vue";
import type { Feature } from "./actions";
export const agentsKey: InjectionKey<Feature> = Symbol("agents");
export function useAgents(): Feature {
  const feature = inject(agentsKey);
  if (!feature) throw new Error("Agents provider missing");
  return feature;
}
