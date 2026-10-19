import type * as DTO from "../../shared/types";

export function createPresentationState() {
  return {
    linkDrawerOpen: false,
    linkDrawerTitle: "",
    linkDrawerItems: [] as DTO.WebItem[],
    webActivities: {} as Record<string, { kind: string; items: DTO.WebItem[] }>,
    sessionUsage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cost: 0,
      search: 0,
      fetch: 0,
    },
    reasoningOpen: {} as Record<string, boolean>,
  };
}
