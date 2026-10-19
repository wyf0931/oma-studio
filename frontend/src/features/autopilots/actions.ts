import type { State as AgentsState } from "../agents/actions";
import type { Actions as ApiActions } from "../../shared/api";
import type { Actions as ShellActions } from "../../app/actions";
import { reactive } from "vue";
import type * as DTO from "../../shared/types";
import { asError } from "../../shared/types";

import { createAutopilotsState } from "./state";
export type State = ReturnType<typeof createAutopilotsState>;
export interface Actions {
  selectAutopilotAgent(agentId: string): void;
  selectAutopilotEditAgent(agentId: string): void;
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
export interface Feature extends Actions {
  state: State;
}
export interface Dependencies {
  agents: { state: Readonly<Pick<AgentsState, "agents">> };
  api: Pick<ApiActions, "api">;
  shell: Pick<ShellActions, "showError">;
}
export function createAutopilots(deps: Dependencies): Feature {
  const state = reactive(createAutopilotsState());
  function selectAutopilotAgent(agentId: string): void {
    state.autopilotAgentFilter = agentId;
    state.autopilotAgentPickerOpen = false;
    loadAutopilots();
  }
  function selectAutopilotEditAgent(agentId: string): void {
    state.autopilotAgentId = agentId;
    state.autopilotEditAgentPickerOpen = false;
  }
  function openCronBuilder(): void {
    syncCronBuilder();
    state.cronBuilderOpen = true;
  }
  function syncCronBuilder(): void {
    const parts = state.autopilotCron.trim().split(/\s+/);
    if (parts.length !== 5) return;
    const [minute = "*", hour = "*", dom = "*", month = "*", dow = "*"] = parts;
    state.cronMinute = minute === "*" ? "0" : minute;
    state.cronHour = hour === "*" ? "9" : hour;
    state.cronDay = dow === "*" ? ["1"] : dow.split(",");
    state.cronDayOfMonth = dom === "*" ? "1" : dom;
    state.cronMonth = month === "*" ? "1" : month;
    if (minute !== "*" && hour === "*") state.cronFrequency = "hourly";
    else if (dow !== "*") state.cronFrequency = "weekly";
    else if (dom !== "*" && month === "*") state.cronFrequency = "monthly";
    else if (dom !== "*" && month !== "*") state.cronFrequency = "yearly";
    else state.cronFrequency = "daily";
  }
  function setCronFrequency(value: string): void {
    state.cronFrequency = value;
    state.autopilotCron = buildCron();
  }
  function toggleCronDay(day: string): void {
    state.cronDay = state.cronDay.includes(day)
      ? state.cronDay.length > 1
        ? state.cronDay.filter((item) => item !== day)
        : state.cronDay
      : [...state.cronDay, day];
    state.autopilotCron = buildCron();
  }
  function cronHours(): string[] {
    return Array.from({ length: 24 }, (_, index) => String(index));
  }
  function cronDaysOfMonth(): string[] {
    return Array.from({ length: 31 }, (_, index) => String(index + 1));
  }
  function cronMonths(): string[] {
    return Array.from({ length: 12 }, (_, index) => String(index + 1));
  }
  function buildCron(): string {
    const m = state.cronMinute,
      h = state.cronHour;
    if (state.cronFrequency === "hourly") return `${m} * * * *`;
    if (state.cronFrequency === "weekly")
      return `${m} ${h} * * ${state.cronDay
        .slice()
        .sort((a, b) => Number(a) - Number(b))
        .join(",")}`;
    if (state.cronFrequency === "monthly") return `${m} ${h} ${state.cronDayOfMonth} * *`;
    if (state.cronFrequency === "yearly") return `${m} ${h} ${state.cronDayOfMonth} ${state.cronMonth} *`;
    return `${m} ${h} * * *`;
  }
  function applyCronBuilder(): void {
    state.autopilotCron = buildCron();
    state.cronBuilderOpen = false;
  }
  async function loadAutopilots(): Promise<void> {
    state.autopilotLoading = true;
    try {
      const params = new URLSearchParams();
      if (state.autopilotSearch.trim()) params.set("search", state.autopilotSearch.trim());
      if (state.autopilotAgentFilter) params.set("agent_id", state.autopilotAgentFilter);
      state.autopilots = (await deps.api.api<{ autopilots: DTO.Autopilot[] }>(`/api/autopilots?${params}`)).autopilots;
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    } finally {
      state.autopilotLoading = false;
    }
  }
  function newAutopilot(): void {
    state.autopilotEditing = null;
    state.autopilotName = "";
    state.autopilotInstruction = "";
    state.autopilotAgentId = deps.agents.state.agents[0]?.id || "";
    state.autopilotCron = "0 * * * *";
    state.autopilotStartsAt = "";
    state.autopilotEndsAt = "";
    state.autopilotDialog = true;
  }
  function editAutopilot(item: DTO.Autopilot): void {
    state.autopilotEditing = item;
    state.autopilotName = item.name;
    state.autopilotInstruction = item.instruction;
    state.autopilotAgentId = item.agent_id;
    state.autopilotCron = item.cron;
    state.autopilotStartsAt = item.starts_at || "";
    state.autopilotEndsAt = item.ends_at || "";
    state.autopilotDialog = true;
  }
  async function saveAutopilot(): Promise<void> {
    if (!state.autopilotName.trim() || !state.autopilotInstruction.trim() || !state.autopilotAgentId) return;
    state.autopilotSaving = true;
    try {
      const payload = {
        name: state.autopilotName,
        instruction: state.autopilotInstruction,
        agent_id: state.autopilotAgentId,
        cron: state.autopilotCron,
        starts_at: state.autopilotStartsAt || null,
        ends_at: state.autopilotEndsAt || null,
      };
      const item = state.autopilotEditing
        ? await deps.api.api<DTO.Autopilot>(`/api/autopilots/${state.autopilotEditing.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await deps.api.api<DTO.Autopilot>("/api/autopilots", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      const index = state.autopilots.findIndex((row) => row.id === item.id);
      if (index >= 0) state.autopilots[index] = item;
      else state.autopilots.unshift(item);
      state.autopilotDialog = false;
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    } finally {
      state.autopilotSaving = false;
    }
  }
  async function toggleAutopilot(item: DTO.Autopilot): Promise<void> {
    try {
      const updated = await deps.api.api<DTO.Autopilot>(`/api/autopilots/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !item.enabled }),
      });
      Object.assign(item, updated);
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    }
  }
  function deleteAutopilot(item: DTO.Autopilot): void {
    state.autopilotDeleteTarget = item;
  }
  async function confirmDeleteAutopilot(): Promise<void> {
    const item = state.autopilotDeleteTarget;
    if (!item) return;
    try {
      await deps.api.api(`/api/autopilots/${item.id}`, { method: "DELETE" });
      state.autopilots = state.autopilots.filter((row) => row.id !== item.id);
      state.autopilotDeleteTarget = null;
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    }
  }
  async function runAutopilot(item: DTO.Autopilot): Promise<void> {
    try {
      await deps.api.api(`/api/autopilots/${item.id}/run`, { method: "POST" });
      loadAutopilotRuns(item);
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    }
  }
  async function loadAutopilotRuns(item: DTO.Autopilot): Promise<void> {
    state.autopilotRunsOpen = true;
    state.autopilotRuns = [];
    state.autopilotRunsItem = item;
    try {
      state.autopilotRuns = (await deps.api.api<{ runs: DTO.Run[] }>(`/api/autopilots/${item.id}/runs`)).runs;
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    }
  }
  return {
    state,
    selectAutopilotAgent,
    selectAutopilotEditAgent,
    openCronBuilder,
    syncCronBuilder,
    setCronFrequency,
    toggleCronDay,
    cronHours,
    cronDaysOfMonth,
    cronMonths,
    buildCron,
    applyCronBuilder,
    loadAutopilots,
    newAutopilot,
    editAutopilot,
    saveAutopilot,
    toggleAutopilot,
    deleteAutopilot,
    confirmDeleteAutopilot,
    runAutopilot,
    loadAutopilotRuns,
  };
}
