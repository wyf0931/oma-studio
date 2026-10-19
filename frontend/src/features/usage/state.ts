import type * as DTO from "../../shared/types";
export function createUsageState() {
  return {
    usageOpen: false,
    usageTab: "overview",
    usageRange: "7",
    usageLoading: false,
    usageError: "",
    usageData: {
      summary: { sessions: 0, input: 0, output: 0, cacheRead: 0, cost: 0, search: 0, fetch: 0, tools: 0 },
      daily: [] as DTO.UsageRow[],
      sessions: [] as DTO.UsageRow[],
      users: [] as DTO.UsageRow[],
      agents: [] as DTO.UsageRow[],
    },
  };
}
