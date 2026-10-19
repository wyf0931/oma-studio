import { inject } from "vue";
import type { InjectionKey } from "vue";
import type { Feature } from "./presentation";
export const presentationKey: InjectionKey<Feature> = Symbol("presentation");
export function usePresentation(): Feature {
  const feature = inject(presentationKey);
  if (!feature) throw new Error("Presentation provider missing");
  return feature;
}
