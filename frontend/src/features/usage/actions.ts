import { toRecord } from "../../shared/types";
import { asError } from "../../shared/types";
import type { Workspace } from "../../app/workspace";

import type * as DTO from "../../shared/types";

// Explicit dependency contract for this feature; the composition root supplies it.
type Context = Pick<
  Workspace,
  | "api"
  | "loadUsage"
  | "normalizeUsageData"
  | "normalizeUsageRow"
  | "normalizeUsageSummary"
  | "usageChartPoints"
  | "usageData"
  | "usageDateLabel"
  | "usageError"
  | "usageLoading"
  | "usageMetricValue"
  | "usageNumber"
  | "usageOpen"
  | "usagePick"
  | "usageRange"
  | "usageTab"
>;
export interface Actions {
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
export const usageActions: Actions = {
  async openUsage(this: Context): Promise<void> {
    this.usageOpen = true;
    this.usageTab = "overview";
    await this.loadUsage();
  },
  async setUsageRange(this: Context, range: string): Promise<void> {
    if (!["1", "7", "30"].includes(range) || range === this.usageRange) return;
    this.usageRange = range;
    await this.loadUsage();
  },
  async loadUsage(this: Context): Promise<void> {
    if (this.usageLoading) return;
    this.usageLoading = true;
    this.usageError = "";
    try {
      const payload = await this.api(`/api/usage?days=${encodeURIComponent(this.usageRange)}`);
      this.usageData = this.normalizeUsageData(payload);
    } catch (cause) {
      const error = asError(cause);
      this.usageError = error.message || "Unable to load usage statistics.";
    } finally {
      this.usageLoading = false;
    }
  },
  usageNumber(this: Context, value: unknown): number {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  },
  usagePick(this: Context, item: DTO.UsageInput, keys: string[]): unknown {
    for (const key of keys) {
      if (item && item[key] !== undefined && item[key] !== null) return item[key];
    }
    return 0;
  },
  normalizeUsageSummary(this: Context, value: DTO.UsageInput = {}): DTO.UsageSummary {
    const source = value || {};
    return {
      sessions: this.usageNumber(this.usagePick(source, ["sessions", "session_count", "sessionCount"])),
      input: this.usageNumber(this.usagePick(source, ["input", "input_tokens", "inputTokens"])),
      output: this.usageNumber(this.usagePick(source, ["output", "output_tokens", "outputTokens"])),
      cacheRead: this.usageNumber(
        this.usagePick(source, ["cacheRead", "cache_read", "cache_read_tokens", "cached_tokens", "cachedTokens"]),
      ),
      cost: this.usageNumber(this.usagePick(source, ["cost", "total_cost", "totalCost"])),
      search: this.usageNumber(this.usagePick(source, ["search", "web_search", "webSearch"])),
      fetch: this.usageNumber(this.usagePick(source, ["fetch", "web_fetch", "webFetch"])),
      tools: this.usageNumber(this.usagePick(source, ["tool_calls", "toolCalls", "tools"])),
    };
  },
  normalizeUsageRow(this: Context, input: unknown = {}): DTO.UsageRow {
    const row = toRecord(input);
    const text = (...keys: string[]) => String(keys.map((key) => row[key]).find(Boolean) || "");
    return {
      ...this.normalizeUsageSummary(row),
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
  },
  normalizeUsageData(this: Context, input: unknown = {}): DTO.UsageData {
    const source = toRecord(input);
    const rows = (value: unknown): DTO.UsageRow[] =>
      Array.isArray(value) ? value.map((row) => this.normalizeUsageRow(row)) : [];
    return {
      summary: this.normalizeUsageSummary(toRecord(source.summary || source.totals || source.overview)),
      daily: rows(source.daily || source.series || source.daily_series || source.dailySeries),
      sessions: rows(source.sessions || source.details || source.session_details || source.sessionDetails),
      users: rows(source.users || source.by_user || source.byUser),
      agents: rows(source.agents || source.by_agent || source.byAgent),
    };
  },
  usageMetricValue(this: Context, row: DTO.UsageRow, metric: string = "cost"): number {
    if (metric === "tokens") return row.input + row.output + row.cacheRead;
    if (metric === "sessions") return row.sessions;
    return row.cost;
  },
  usageChartPoints(this: Context, metric: string = "cost"): string {
    const rows = this.usageData.daily || [];
    if (!rows.length) return "24,188 736,188";
    const values = rows.map((row) => this.usageMetricValue(row, metric));
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
  },
  usageChartAreaPoints(this: Context, metric: string = "cost"): string {
    const points = this.usageChartPoints(metric);
    return `24,188 ${points} 736,188`;
  },
  usageChartLabels(this: Context): { id: string; label: string }[] {
    return (this.usageData.daily || []).map((row) => ({
      id: row.id || row.createdAt || row.date,
      label: this.usageDateLabel(row.createdAt || row.date),
    }));
  },
  usageDateLabel(this: Context, value: string): string {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  },
  usageCost(this: Context, value: unknown): string {
    return `¥${this.usageNumber(value).toFixed(4)}`;
  },
};
