import { asError } from "../../shared/types";
import type { Workspace } from "../../app/workspace";

import type * as DTO from "../../shared/types";

// Explicit dependency contract for this feature; the composition root supplies it.
type Context = Pick<
  Workspace,
  | "agents"
  | "api"
  | "autopilotAgentFilter"
  | "autopilotAgentId"
  | "autopilotCron"
  | "autopilotDeleteTarget"
  | "autopilotDialog"
  | "autopilotEditing"
  | "autopilotEndsAt"
  | "autopilotInstruction"
  | "autopilotLoading"
  | "autopilotName"
  | "autopilotRuns"
  | "autopilotRunsItem"
  | "autopilotRunsOpen"
  | "autopilotSaving"
  | "autopilotSearch"
  | "autopilotStartsAt"
  | "autopilots"
  | "buildCron"
  | "cronBuilderOpen"
  | "cronDay"
  | "cronDayOfMonth"
  | "cronFrequency"
  | "cronHour"
  | "cronMinute"
  | "cronMonth"
  | "loadAutopilotRuns"
  | "showError"
  | "syncCronBuilder"
>;
export interface Actions {
  openCronBuilder(): void;
  syncCronBuilder(): void;
  setCronFrequency(value: string): void;
  toggleCronDay(day: string): void;
  cronHours(): string[];
  cronDaysOfMonth(): string[];
  cronMonths(): string[];
  buildCron(): string;
  applyCronBuilder(): void;
  loadAutopilots(): Promise<void>;
  newAutopilot(): void;
  editAutopilot(item: DTO.Autopilot): void;
  saveAutopilot(): Promise<void>;
  toggleAutopilot(item: DTO.Autopilot): Promise<void>;
  deleteAutopilot(item: DTO.Autopilot): void;
  confirmDeleteAutopilot(): Promise<void>;
  runAutopilot(item: DTO.Autopilot): Promise<void>;
  loadAutopilotRuns(item: DTO.Autopilot): Promise<void>;
}
export const autopilotsActions: Actions = {
  openCronBuilder(this: Context): void {
    this.syncCronBuilder();
    this.cronBuilderOpen = true;
  },
  syncCronBuilder(this: Context): void {
    const parts = this.autopilotCron.trim().split(/\s+/);
    if (parts.length !== 5) return;
    const [minute = "*", hour = "*", dom = "*", month = "*", dow = "*"] = parts;
    this.cronMinute = minute === "*" ? "0" : minute;
    this.cronHour = hour === "*" ? "9" : hour;
    this.cronDay = dow === "*" ? ["1"] : dow.split(",");
    this.cronDayOfMonth = dom === "*" ? "1" : dom;
    this.cronMonth = month === "*" ? "1" : month;
    if (minute !== "*" && hour === "*") this.cronFrequency = "hourly";
    else if (dow !== "*") this.cronFrequency = "weekly";
    else if (dom !== "*" && month === "*") this.cronFrequency = "monthly";
    else if (dom !== "*" && month !== "*") this.cronFrequency = "yearly";
    else this.cronFrequency = "daily";
  },
  setCronFrequency(this: Context, value: string): void {
    this.cronFrequency = value;
    this.autopilotCron = this.buildCron();
  },
  toggleCronDay(this: Context, day: string): void {
    this.cronDay = this.cronDay.includes(day)
      ? this.cronDay.length > 1
        ? this.cronDay.filter((item) => item !== day)
        : this.cronDay
      : [...this.cronDay, day];
    this.autopilotCron = this.buildCron();
  },
  cronHours(this: Context): string[] {
    return Array.from({ length: 24 }, (_, index) => String(index));
  },
  cronDaysOfMonth(this: Context): string[] {
    return Array.from({ length: 31 }, (_, index) => String(index + 1));
  },
  cronMonths(this: Context): string[] {
    return Array.from({ length: 12 }, (_, index) => String(index + 1));
  },
  buildCron(this: Context): string {
    const m = this.cronMinute,
      h = this.cronHour;
    if (this.cronFrequency === "hourly") return `${m} * * * *`;
    if (this.cronFrequency === "weekly")
      return `${m} ${h} * * ${this.cronDay
        .slice()
        .sort((a, b) => Number(a) - Number(b))
        .join(",")}`;
    if (this.cronFrequency === "monthly") return `${m} ${h} ${this.cronDayOfMonth} * *`;
    if (this.cronFrequency === "yearly") return `${m} ${h} ${this.cronDayOfMonth} ${this.cronMonth} *`;
    return `${m} ${h} * * *`;
  },
  applyCronBuilder(this: Context): void {
    this.autopilotCron = this.buildCron();
    this.cronBuilderOpen = false;
  },
  async loadAutopilots(this: Context): Promise<void> {
    this.autopilotLoading = true;
    try {
      const params = new URLSearchParams();
      if (this.autopilotSearch.trim()) params.set("search", this.autopilotSearch.trim());
      if (this.autopilotAgentFilter) params.set("agent_id", this.autopilotAgentFilter);
      this.autopilots = (await this.api<{ autopilots: DTO.Autopilot[] }>(`/api/autopilots?${params}`)).autopilots;
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    } finally {
      this.autopilotLoading = false;
    }
  },
  newAutopilot(this: Context): void {
    this.autopilotEditing = null;
    this.autopilotName = "";
    this.autopilotInstruction = "";
    this.autopilotAgentId = this.agents[0]?.id || "";
    this.autopilotCron = "0 * * * *";
    this.autopilotStartsAt = "";
    this.autopilotEndsAt = "";
    this.autopilotDialog = true;
  },
  editAutopilot(this: Context, item: DTO.Autopilot): void {
    this.autopilotEditing = item;
    this.autopilotName = item.name;
    this.autopilotInstruction = item.instruction;
    this.autopilotAgentId = item.agent_id;
    this.autopilotCron = item.cron;
    this.autopilotStartsAt = item.starts_at || "";
    this.autopilotEndsAt = item.ends_at || "";
    this.autopilotDialog = true;
  },
  async saveAutopilot(this: Context): Promise<void> {
    if (!this.autopilotName.trim() || !this.autopilotInstruction.trim() || !this.autopilotAgentId) return;
    this.autopilotSaving = true;
    try {
      const payload = {
        name: this.autopilotName,
        instruction: this.autopilotInstruction,
        agent_id: this.autopilotAgentId,
        cron: this.autopilotCron,
        starts_at: this.autopilotStartsAt || null,
        ends_at: this.autopilotEndsAt || null,
      };
      const item = this.autopilotEditing
        ? await this.api<DTO.Autopilot>(`/api/autopilots/${this.autopilotEditing.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await this.api<DTO.Autopilot>("/api/autopilots", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      const index = this.autopilots.findIndex((row) => row.id === item.id);
      if (index >= 0) this.autopilots[index] = item;
      else this.autopilots.unshift(item);
      this.autopilotDialog = false;
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    } finally {
      this.autopilotSaving = false;
    }
  },
  async toggleAutopilot(this: Context, item: DTO.Autopilot): Promise<void> {
    try {
      const updated = await this.api<DTO.Autopilot>(`/api/autopilots/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !item.enabled }),
      });
      Object.assign(item, updated);
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    }
  },
  deleteAutopilot(this: Context, item: DTO.Autopilot): void {
    this.autopilotDeleteTarget = item;
  },
  async confirmDeleteAutopilot(this: Context): Promise<void> {
    const item = this.autopilotDeleteTarget;
    if (!item) return;
    try {
      await this.api(`/api/autopilots/${item.id}`, { method: "DELETE" });
      this.autopilots = this.autopilots.filter((row) => row.id !== item.id);
      this.autopilotDeleteTarget = null;
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    }
  },
  async runAutopilot(this: Context, item: DTO.Autopilot): Promise<void> {
    try {
      await this.api(`/api/autopilots/${item.id}/run`, { method: "POST" });
      this.loadAutopilotRuns(item);
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    }
  },
  async loadAutopilotRuns(this: Context, item: DTO.Autopilot): Promise<void> {
    this.autopilotRunsOpen = true;
    this.autopilotRuns = [];
    this.autopilotRunsItem = item;
    try {
      this.autopilotRuns = (await this.api<{ runs: DTO.Run[] }>(`/api/autopilots/${item.id}/runs`)).runs;
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    }
  },
};
