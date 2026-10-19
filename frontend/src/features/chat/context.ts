import { inject } from "vue";
import type { InjectionKey } from "vue";
import type { Feature } from "./actions";
export const chatKey: InjectionKey<Feature> = Symbol("chat");
export function useChat(): Feature {
  const feature = inject(chatKey);
  if (!feature) throw new Error("Chat provider missing");
  return feature;
}
