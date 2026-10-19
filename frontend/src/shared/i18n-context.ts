import { inject } from "vue";
import type { InjectionKey } from "vue";
import type { Feature } from "./i18n";
export const i18nKey: InjectionKey<Feature> = Symbol("i18n");
export function useI18n(): Feature {
  const feature = inject(i18nKey);
  if (!feature) throw new Error("I18n provider missing");
  return feature;
}
