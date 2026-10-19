import type { Actions as ApiActions } from "../../shared/api";
import { unwrap } from "../../shared/api";
import { reactive } from "vue";
import type * as DTO from "../../shared/types";
import { asError, toRecord } from "../../shared/types";

import { createUsageState } from "./state";
export type State = ReturnType<typeof createUsageState>;
export interface Actions {
  resetSession(): void;
  openUsage(): Promise<void>;
  setUsageRange(range: string): Promise<void>;
  loadUsage(): Promise<void>;
  usageNumber(value: unknown): number;
  usagePick(item: DTO.UsageInput, keys: string[]): unknown;
  normalizeUsageSummary(value?: DTO.UsageInput): DTO.UsageSummary;
  normalizeUsageRow(input?: unknown): DTO.UsageRow;
  normalizeUsageData(input?: unknown): DTO.UsageData;
  usageMetricValue(row: DTO.UsageRow, metric?: string): number;
  usageChartPoints(metric?: string): string;
  usageChartAreaPoints(metric?: string): string;
  usageChartLabels(): { id: string; label: string }[];
  usageDateLabel(value: string): string;
  usageCost(value: unknown): string;
}
export interface Feature extends Actions {
  state: State;
}
export interface Dependencies {
  api: Pick<ApiActions, "client">;
}
export function createUsage(deps: Dependencies): Feature {
  const state = reactive(createUsageState());
  async function openUsage(): Promise<void> {
    state.usageOpen = true;
    state.usageTab = "overview";
    await loadUsage();
  }
  async function setUsageRange(range: string): Promise<void> {
    if (!["1", "7", "30"].includes(range) || range === state.usageRange) return;
    state.usageRange = range;
    await loadUsage();
  }
  async function loadUsage(): Promise<void> {
    if (state.usageLoading) return;
    state.usageLoading = true;
    state.usageError = "";
    try {
      const payload = unwrap(
        await deps.api.client.GET("/api/usage", { params: { query: { days: Number(state.usageRange) } } }),
      );
      state.usageData = normalizeUsageData(payload);
    } catch (cause) {
      const error = asError(cause);
      state.usageError = error.message || "Unable to load usage statistics.";
    } finally {
      state.usageLoading = false;
    }
  }
  function usageNumber(value: unknown): number {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }
  function usagePick(item: DTO.UsageInput, keys: string[]): unknown {
    for (const key of keys) {
      if (item && item[key] !== undefined && item[key] !== null) return item[key];
    }
    return 0;
  }
  function normalizeUsageSummary(value: DTO.UsageInput = {}): DTO.UsageSummary {
    const source = value || {};
    return {
      sessions: usageNumber(usagePick(source, ["sessions", "session_count", "sessionCount"])),
      input: usageNumber(usagePick(source, ["input", "input_tokens", "inputTokens"])),
      output: usageNumber(usagePick(source, ["output", "output_tokens", "outputTokens"])),
      cacheRead: usageNumber(
        usagePick(source, ["cacheRead", "cache_read", "cache_read_tokens", "cached_tokens", "cachedTokens"]),
      ),
      cost: usageNumber(usagePick(source, ["cost", "total_cost", "totalCost"])),
      search: usageNumber(usagePick(source, ["search", "web_search", "webSearch"])),
      fetch: usageNumber(usagePick(source, ["fetch", "web_fetch", "webFetch"])),
      tools: usageNumber(usagePick(source, ["tool_calls", "toolCalls", "tools"])),
    };
  }
  function normalizeUsageRow(input: unknown = {}): DTO.UsageRow {
    const row = toRecord(input);
    const text = (...keys: string[]) => String(keys.map((key) => row[key]).find(Boolean) || "");
    return {
      ...normalizeUsageSummary(row),
      id: text(
        "id",
        "session_id",
        "sessionId",
        "chat_id",
        "chatId",
        "user_id",
        "userId",
        "agent_id",
        "agentId",
        "name",
      ),
      title: text("title", "session_name", "sessionName", "name") || "Untitled session",
      username: text("username", "user_name", "userName", "user") || "—",
      agent:
        typeof row.agent === "string"
          ? row.agent
          : String(toRecord(row.agent).name || text("agent_name", "agentName", "name") || "—"),
      createdAt: text("createdAt", "created_at", "created", "date"),
      date: text("date"),
      name: text("name"),
      agent_id: text("agent_id"),
    };
  }
  function normalizeUsageData(input: unknown = {}): DTO.UsageData {
    const source = toRecord(input);
    const rows = (value: unknown): DTO.UsageRow[] =>
      Array.isArray(value) ? value.map((row) => normalizeUsageRow(row)) : [];
    return {
      summary: normalizeUsageSummary(toRecord(source.summary || source.totals || source.overview)),
      daily: rows(source.daily || source.series || source.daily_series || source.dailySeries),
      sessions: rows(source.sessions || source.details || source.session_details || source.sessionDetails),
      users: rows(source.users || source.by_user || source.byUser),
      agents: rows(source.agents || source.by_agent || source.byAgent),
    };
  }
  function usageMetricValue(row: DTO.UsageRow, metric: string = "cost"): number {
    if (metric === "tokens") return row.input + row.output + row.cacheRead;
    if (metric === "sessions") return row.sessions;
    return row.cost;
  }
  function usageChartPoints(metric: string = "cost"): string {
    const rows = state.usageData.daily || [];
    if (!rows.length) return "24,188 736,188";
    const values = rows.map((row) => usageMetricValue(row, metric));
    const max = Math.max(...values, 1);
    const left = 24;
    const right = 736;
    const baseline = 188;
    const top = 18;
    const span = Math.max(1, values.length - 1);
    return values
      .map((value, index) => {
        const x = left + ((right - left) * index) / span;
        const y = baseline - ((baseline - top) * value) / max;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }
  function usageChartAreaPoints(metric: string = "cost"): string {
    const points = usageChartPoints(metric);
    return `24,188 ${points} 736,188`;
  }
  function usageChartLabels(): { id: string; label: string }[] {
    return (state.usageData.daily || []).map((row) => ({
      id: row.id || row.createdAt || row.date,
      label: usageDateLabel(row.createdAt || row.date),
    }));
  }
  function usageDateLabel(value: string): string {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  function usageCost(value: unknown): string {
    return `¥${usageNumber(value).toFixed(4)}`;
  }
  function resetSession(): void {
    Object.assign(state, createUsageState());
  }
  return {
    resetSession,
    state,
    openUsage,
    setUsageRange,
    loadUsage,
    usageNumber,
    usagePick,
    normalizeUsageSummary,
    normalizeUsageRow,
    normalizeUsageData,
    usageMetricValue,
    usageChartPoints,
    usageChartAreaPoints,
    usageChartLabels,
    usageDateLabel,
    usageCost,
  };
}
