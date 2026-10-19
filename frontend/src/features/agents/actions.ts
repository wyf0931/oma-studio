import type { Actions as ShellActions } from "../../app/actions";
import type { Actions as ApiActions } from "../../shared/api";
import type { Actions as FormatActions } from "../../shared/format";
import type { Actions as DomActions } from "../../shared/dom";
import { validateAgentResponse } from "../../generated/validators.mjs";
import { unwrap } from "../../shared/api";
import { reactive, nextTick } from "vue";
import type * as DTO from "../../shared/types";
import { ApiError, asError } from "../../shared/types";

import { createAgentsState } from "./state";
export type State = ReturnType<typeof createAgentsState>;
export interface Actions {
  resetSession(): void;
  replaceResources(resources: DTO.Resources): void;
  loadAgents(): Promise<void>;
  refreshAgents(): Promise<DTO.Agent[]>;
  agentItems(): DTO.Agent[];
  loadResources(): Promise<void>;
  refreshResources(): Promise<DTO.Resources>;
  agentAvatarMarkup(agent: Partial<DTO.Agent> | null | undefined, size?: string, market?: boolean): string;
  agentTagsMarkup(tags: string[], limit?: number): string;
  agentName(id: string): string;
  normalizeResourcePath(path: string): string;
  resourcePath(kind: string, path: string): string;
  resourceNames(paths: string[], kind: string): string;
  profileTags(value: string): string[];
  profileQuickstarts(value: string): string[];
  agentSkills(agent: DTO.Agent): DTO.Resource[];
  providerName(id: string | null | undefined): string;
  modelName(providerId: string | null | undefined, modelId: string | null | undefined): string;
  defaultResources(kind: "extensions" | "skills" | "mcp_servers"): string[];
  newAgent(): void;
  hasAgentDraft(): boolean;
  dismissAgentDialogFromBackdrop(): void;
  closeAgentDialog(): void;
  setAgentWizardStep(step: number): void;
  nextAgentWizardStep(): void;
  previousAgentWizardStep(): void;
  agentSkillItems(): DTO.Resource[];
  generateAgentInstruction(): Promise<void>;
  modelsFor(providerId?: string | null): DTO.Model[];
  thinkingLevelsFor(): string[];
  defaultThinkingLevel(): string;
  defaultAgentTools(): string[];
  defaultModelFor(providerId: string): string;
  changeAgentProvider(): void;
  changeAgentModel(): void;
  agentModelConfigPayload(): {
    provider: string | null;
    model: string | null;
    thinking_level: string | null;
  };
  usesAutoModelConfig(): boolean;
  autoModelConfigLabel(): string;
  submitAgent(): Promise<void>;
  toggleAgentTool(name: string): void;
  toolGroupTools(group: DTO.ToolGroup): string[];
  toolGroupState(group: DTO.ToolGroup): string;
  toolGroupStateFor(group: DTO.ToolGroup, selectedTools?: string[]): string;
  dialogToolGroupState(group: DTO.ToolGroup): string;
  toggleToolGroup(group: DTO.ToolGroup): void;
  avatarUrl(agent: Partial<DTO.Agent> | null | undefined): string;
  marketAgentAvatarUrl(agent: Partial<DTO.Agent> | null | undefined): string;
  uploadAvatarFile(agentId: string, file: File): Promise<DTO.Agent>;
  uploadAgentAvatar(event: Event): Promise<void>;
  toggleResource(kind: string, path: string): void;
  deleteAgent(agent: DTO.Agent): void;
  confirmDelete(): Promise<void>;
  editAgent(agent: DTO.Agent): void;
}
export interface Feature extends Actions {
  state: State;
}
export interface Dependencies {
  shell: Pick<ShellActions, "showError" | "showPage" | "showToast">;
  api: Pick<ApiActions, "client" | "invalidResponse" | "request" | "responseData">;
  format: Pick<FormatActions, "escape" | "initials">;
  dom: Pick<DomActions, "resizeAgentTextareas">;
}
export function createAgents(deps: Dependencies): Feature {
  const state = reactive(createAgentsState());
  async function loadAgents(): Promise<void> {
    try {
      await refreshAgents();
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    }
  }
  async function refreshAgents(): Promise<DTO.Agent[]> {
    const data = unwrap(await deps.api.client.GET("/api/agents"));
    state.agents = data.agents || [];
    return state.agents;
  }
  function agentItems(): DTO.Agent[] {
    const query = state.agentSearch.trim().toLowerCase();
    if (!query) return state.agents;
    return state.agents.filter((item) =>
      `${item.name || ""} ${item.description || ""} ${(item.tags || []).join(" ")}`.toLowerCase().includes(query),
    );
  }
  async function loadResources(): Promise<void> {
    try {
      await refreshResources();
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    }
  }
  async function refreshResources(): Promise<DTO.Resources> {
    state.resources = unwrap(await deps.api.client.GET("/api/resources"));
    if (state.resources.tools?.length) state.toolCatalog = state.resources.tools;
    return state.resources;
  }
  function agentAvatarMarkup(
    agent: Partial<DTO.Agent> | null | undefined,
    size: string = "",
    market: boolean = false,
  ): string {
    const name = String(agent?.name || "Agent");
    const url = market ? (agent?.avatar_available ? marketAgentAvatarUrl(agent) : "") : avatarUrl(agent);
    const classes = ["agent-mark", size, "agent-avatar-image"].filter(Boolean).join(" ");
    return url
      ? `<img class="${classes}" src="${deps.format.escape(url)}" alt="${deps.format.escape(name)} avatar" />`
      : `<span class="${classes}" aria-hidden="true">${deps.format.escape(deps.format.initials(name))}</span>`;
  }
  function agentTagsMarkup(tags: string[], limit: number = 4): string {
    if (!Array.isArray(tags)) return "";
    return tags
      .slice(0, limit)
      .map((tag) => `<span class="badge badge-ghost">${deps.format.escape(String(tag))}</span>`)
      .join("");
  }
  function agentName(id: string): string {
    return state.agents.find((a) => a.id === id)?.name || "unknown agent";
  }
  function normalizeResourcePath(path: string): string {
    const normalized = String(path || "").replaceAll("\\", "/");
    const marker = "/.pi/agent";
    const index = normalized.indexOf(marker);
    return index >= 0 ? normalized.slice(index) : normalized;
  }
  function resourcePath(kind: string, path: string): string {
    const catalog = kind === "extensions" ? state.resources.extensions : state.resources.skills;
    const normalized = normalizeResourcePath(path);
    return catalog.find((item) => normalizeResourcePath(item.path) === normalized)?.path || "";
  }
  function resourceNames(paths: string[], kind: string): string {
    if (!paths?.length) return "None";
    const catalog = kind === "extensions" ? state.resources.extensions : state.resources.skills;
    return paths
      .map(
        (path) =>
          catalog.find((item) => normalizeResourcePath(item.path) === normalizeResourcePath(path))?.name ||
          path.split(/[\\/]/).pop(),
      )
      .join(", ");
  }
  function profileTags(value: string): string[] {
    return value
      .split(/[\n,]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 5);
  }
  function profileQuickstarts(value: string): string[] {
    return value
      .split("\n")
      .map((prompt) => prompt.trim())
      .filter(Boolean)
      .slice(0, 5);
  }
  function agentSkills(agent: DTO.Agent): DTO.Resource[] {
    const enabled = agent?.skills || [];
    return state.resources.skills.filter((skill) =>
      enabled.some((path) => normalizeResourcePath(path) === normalizeResourcePath(skill.path)),
    );
  }
  function providerName(id: string | null | undefined): string {
    return state.resources.providers.find((item) => item.id === id)?.name || id || "";
  }
  function modelName(providerId: string | null | undefined, modelId: string | null | undefined): string {
    return modelsFor(providerId).find((item) => item.id === modelId)?.name || modelId || "";
  }

  function defaultResources(kind: "extensions" | "skills" | "mcp_servers"): string[] {
    const configKey = (
      {
        extensions: "default_extensions",
        skills: "default_skills",
        mcp_servers: "default_mcp_servers",
      } as const
    )[kind];
    const valueKey = kind === "mcp_servers" ? "id" : "path";
    const configured = state.resources[configKey] || [];
    return configured
      .map((value) =>
        kind === "mcp_servers"
          ? state.resources[kind].find((item) => [item.id, item.name, item.path].includes(value))?.[valueKey]
          : resourcePath(kind, value),
      )
      .filter((value): value is string => Boolean(value));
  }
  function newAgent(): void {
    state.editingAgent = null;
    state.newAgentName = "";
    state.newAgentDescription = "";
    state.newAgentTags = "";
    state.newAgentQuickstarts = "";
    state.newAgentInstruction = "";
    state.newAgentAvatarFile = null;
    state.newAgentAvatarPreview = "";
    state.newAgentProvider = "";
    state.newAgentModel = "";
    state.newAgentThinkingLevel = "";
    state.newAgentTools = defaultAgentTools();
    state.newAgentExtensions = defaultResources("extensions");
    state.newAgentSkills = defaultResources("skills");
    state.newAgentMcpServers = defaultResources("mcp_servers");
    state.agentWizardStep = 1;
    state.agentSkillSearch = "";
    state.createDialog = true;
  }
  function hasAgentDraft(): boolean {
    return Boolean(
      state.newAgentName.trim() ||
      state.newAgentDescription.trim() ||
      state.newAgentTags.trim() ||
      state.newAgentQuickstarts.trim() ||
      state.newAgentInstruction.trim() ||
      state.newAgentAvatarFile,
    );
  }
  function dismissAgentDialogFromBackdrop(): void {
    if (!hasAgentDraft()) state.createDialog = false;
  }
  function closeAgentDialog(): void {
    if (state.newAgentAvatarPreview) URL.revokeObjectURL(state.newAgentAvatarPreview);
    state.createDialog = false;
    state.editingAgent = null;
    state.newAgentAvatarFile = null;
    state.newAgentAvatarPreview = "";
    state.agentWizardStep = 1;
    state.agentSkillSearch = "";
  }
  function setAgentWizardStep(step: number): void {
    if (![1, 2, 3].includes(step)) return;
    state.agentWizardStep = step;
    nextTick(() => deps.dom.resizeAgentTextareas());
  }
  function nextAgentWizardStep(): void {
    setAgentWizardStep(Math.min(3, state.agentWizardStep + 1));
  }
  function previousAgentWizardStep(): void {
    setAgentWizardStep(Math.max(1, state.agentWizardStep - 1));
  }
  function agentSkillItems(): DTO.Resource[] {
    const query = state.agentSkillSearch.trim().toLowerCase();
    if (!query) return state.resources.skills;
    return state.resources.skills.filter((item) =>
      `${item.name || ""} ${item.description || ""}`.toLowerCase().includes(query),
    );
  }
  async function generateAgentInstruction(): Promise<void> {
    if (state.generatingInstruction) return;
    state.generatingInstruction = true;
    try {
      const data = unwrap(
        await deps.api.client.POST("/api/agents/instruction-draft", {
          body: {
            name: state.newAgentName,
            instruction: state.newAgentInstruction,
            description: state.newAgentDescription,
            tags: profileTags(state.newAgentTags),
            quickstarts: profileQuickstarts(state.newAgentQuickstarts),
            ...agentModelConfigPayload(),
            tools: state.newAgentTools,
            extensions: state.newAgentExtensions,
            skills: state.newAgentSkills,
            mcp_servers: state.newAgentMcpServers,
          },
        }),
      );
      state.newAgentInstruction = data.instruction || state.newAgentInstruction;
      state.newAgentDescription = data.description || state.newAgentDescription;
      if (Array.isArray(data.tags) && data.tags.length) state.newAgentTags = data.tags.join(", ");
      if (Array.isArray(data.quickstarts) && data.quickstarts.length)
        state.newAgentQuickstarts = data.quickstarts.join("\n");
      nextTick(() => deps.dom.resizeAgentTextareas());
      deps.shell.showToast("Agent profile optimized");
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    } finally {
      state.generatingInstruction = false;
    }
  }
  function modelsFor(providerId: string | null = state.newAgentProvider): DTO.Model[] {
    return state.resources.providers.find((item) => item.id === providerId)?.models || [];
  }
  function thinkingLevelsFor(): string[] {
    if (!state.newAgentProvider || !state.newAgentModel) return [];
    const levels = modelsFor().find((item) => item.id === state.newAgentModel)?.thinking_levels || [];
    return levels.length ? levels : ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
  }
  function defaultThinkingLevel(): string {
    const levels = thinkingLevelsFor();
    return levels.includes(state.resources.default_thinking_level)
      ? state.resources.default_thinking_level
      : levels.includes("low")
        ? "low"
        : levels[0] || "off";
  }
  function defaultAgentTools(): string[] {
    const preferred = state.toolGroups.filter((group) => group.id !== "run_scripts").flatMap((group) => group.tools);
    return preferred.filter((name) => state.toolCatalog.some((tool) => tool.name === name));
  }
  function defaultModelFor(providerId: string): string {
    const models = modelsFor(providerId);
    return models[0]?.id || "";
  }
  function changeAgentProvider(): void {
    if (!state.newAgentProvider) {
      state.newAgentModel = "";
      state.newAgentThinkingLevel = "";
      return;
    }
    state.newAgentModel = defaultModelFor(state.newAgentProvider);
    state.newAgentThinkingLevel = defaultThinkingLevel();
  }
  function changeAgentModel(): void {
    if (!state.newAgentModel) {
      state.newAgentThinkingLevel = "";
      return;
    }
    if (!thinkingLevelsFor().includes(state.newAgentThinkingLevel))
      state.newAgentThinkingLevel = defaultThinkingLevel();
  }
  function agentModelConfigPayload(): {
    provider: string | null;
    model: string | null;
    thinking_level: string | null;
  } {
    return {
      provider: state.newAgentProvider || null,
      model: state.newAgentModel || null,
      thinking_level: state.newAgentThinkingLevel || null,
    };
  }
  function usesAutoModelConfig(): boolean {
    return !state.newAgentProvider && !state.newAgentModel && !state.newAgentThinkingLevel;
  }
  function autoModelConfigLabel(): string {
    const provider = "not configured";
    const model = "not configured";
    const thinking = state.resources.default_thinking_level || "not configured";
    return `${providerName(provider) || provider} / ${modelName(provider, model) || model} / ${thinking}`;
  }
  async function submitAgent(): Promise<void> {
    const validModelConfig =
      usesAutoModelConfig() || (state.newAgentProvider && state.newAgentModel && state.newAgentThinkingLevel);
    if (!state.newAgentName.trim() || !state.newAgentInstruction.trim() || !validModelConfig) return;
    state.creating = true;
    try {
      const editing = Boolean(state.editingAgent);
      const avatarFile = state.newAgentAvatarFile;
      const payload = {
        name: state.newAgentName,
        description: state.newAgentDescription.trim() || null,
        tags: profileTags(state.newAgentTags),
        quickstarts: profileQuickstarts(state.newAgentQuickstarts),
        instruction: state.newAgentInstruction,
        ...agentModelConfigPayload(),
        tools: state.newAgentTools,
        extensions: state.newAgentExtensions,
        skills: state.newAgentSkills,
        mcp_servers: state.newAgentMcpServers,
      };
      const agent = state.editingAgent
        ? unwrap(
            await deps.api.client.PATCH("/api/agents/{agent_id}", {
              params: { path: { agent_id: state.editingAgent.id } },
              body: payload,
            }),
          )
        : unwrap(await deps.api.client.POST("/api/agents", { body: payload }));
      if (!editing && avatarFile) await uploadAvatarFile(agent.id, avatarFile);
      await refreshAgents();
      state.createDialog = false;
      state.dialog = null;
      state.editingAgent = null;
      deps.shell.showPage("agents");
      deps.shell.showToast(editing ? "Agent updated" : "Agent created");
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    } finally {
      state.creating = false;
    }
  }
  function toggleAgentTool(name: string): void {
    state.newAgentTools = state.newAgentTools.includes(name)
      ? state.newAgentTools.filter((tool) => tool !== name)
      : [...state.newAgentTools, name];
  }
  function toolGroupTools(group: DTO.ToolGroup): string[] {
    return group.tools.filter((name) => state.toolCatalog.some((tool) => tool.name === name));
  }
  function toolGroupState(group: DTO.ToolGroup): string {
    return toolGroupStateFor(group, state.newAgentTools);
  }
  function toolGroupStateFor(group: DTO.ToolGroup, selectedTools: string[] = []): string {
    const tools = toolGroupTools(group);
    const selected = tools.filter((name) => selectedTools.includes(name)).length;
    return selected === 0 ? "none" : selected === tools.length ? "all" : "partial";
  }
  function dialogToolGroupState(group: DTO.ToolGroup): string {
    return toolGroupStateFor(group, state.dialog?.tools || []);
  }
  function toggleToolGroup(group: DTO.ToolGroup): void {
    const tools = toolGroupTools(group);
    if (toolGroupState(group) === "all") {
      state.newAgentTools = state.newAgentTools.filter((name) => !tools.includes(name));
    } else {
      state.newAgentTools = [...new Set([...state.newAgentTools, ...tools])];
    }
  }
  function avatarUrl(agent: Partial<DTO.Agent> | null | undefined): string {
    if (!agent?.avatar_path || !agent.id) return "";
    return `/api/agents/${encodeURIComponent(agent.id)}/avatar?v=${encodeURIComponent(agent.updated_at || agent.avatar_path)}`;
  }
  function marketAgentAvatarUrl(agent: Partial<DTO.Agent> | null | undefined): string {
    return agent?.id ? `/api/market/agents/${encodeURIComponent(agent.id)}/avatar` : "";
  }
  async function uploadAvatarFile(agentId: string, file: File): Promise<DTO.Agent> {
    const requestPath = `/api/agents/${encodeURIComponent(agentId)}/avatar`;
    const { response, requestId } = await deps.api.request(requestPath, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });
    const { data } = await deps.api.responseData(response, requestId, requestPath);
    if (!validateAgentResponse(data)) throw deps.api.invalidResponse(requestPath, requestId);
    return data;
  }
  async function uploadAgentAvatar(event: Event): Promise<void> {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      deps.shell.showError(new ApiError("Avatar must be an image file"));
      input.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      deps.shell.showError(new ApiError("Avatar must be 5 MB or smaller"));
      input.value = "";
      return;
    }
    if (state.newAgentAvatarPreview) URL.revokeObjectURL(state.newAgentAvatarPreview);
    state.newAgentAvatarFile = file;
    state.newAgentAvatarPreview = URL.createObjectURL(file);
    if (!state.editingAgent) return;
    state.creating = true;
    try {
      const updated = await uploadAvatarFile(state.editingAgent.id, file);
      Object.assign(state.editingAgent, updated);
      state.dialog = updated;
      state.newAgentAvatarFile = null;
      state.newAgentAvatarPreview = "";
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    } finally {
      state.creating = false;
    }
  }
  function toggleResource(kind: string, path: string): void {
    const key =
      kind === "extensions" ? "newAgentExtensions" : kind === "skills" ? "newAgentSkills" : "newAgentMcpServers";
    state[key] = state[key].includes(path) ? state[key].filter((item) => item !== path) : [...state[key], path];
  }
  function deleteAgent(agent: DTO.Agent): void {
    if (!agent.protected) state.confirmTarget = agent;
  }

  async function confirmDelete(): Promise<void> {
    const agent = state.confirmTarget;
    if (!agent) return;
    try {
      unwrap(await deps.api.client.DELETE("/api/agents/{agent_id}", { params: { path: { agent_id: agent.id } } }));
      await refreshAgents();
      if (state.dialog?.id === agent.id) state.dialog = null;
      state.confirmTarget = null;
      deps.shell.showToast(`Agent ${agent.name} deleted`);
    } catch (cause) {
      const e = asError(cause);
      deps.shell.showError(e);
    }
  }
  function editAgent(agent: DTO.Agent): void {
    state.editingAgent = agent;
    state.newAgentName = agent.name;
    state.newAgentDescription = agent.description || "";
    state.newAgentTags = (agent.tags || []).join(", ");
    state.newAgentQuickstarts = (agent.quickstarts || []).join("\n");
    state.newAgentInstruction = agent.instruction;
    state.newAgentAvatarFile = null;
    state.newAgentAvatarPreview = "";
    state.newAgentProvider = agent.provider || "";
    state.newAgentModel = agent.model || "";
    state.newAgentThinkingLevel = agent.thinking_level || "";
    state.newAgentTools = [...(agent.tools || [])];
    state.newAgentExtensions = (agent.extensions || [])
      .map((path) => resourcePath("extensions", path))
      .filter((value): value is string => Boolean(value));
    state.newAgentSkills = (agent.skills || [])
      .map((path) => resourcePath("skills", path))
      .filter((value): value is string => Boolean(value));
    state.newAgentMcpServers = [...(agent.mcp_servers || [])];
    state.agentWizardStep = 1;
    state.agentSkillSearch = "";
    state.dialog = null;
    state.createDialog = true;
    nextTick(() => deps.dom.resizeAgentTextareas());
  }
  function replaceResources(resources: DTO.Resources): void {
    state.resources = resources;
    if (resources.tools?.length) state.toolCatalog = resources.tools;
  }
  function resetSession(): void {
    Object.assign(state, createAgentsState());
  }
  return {
    resetSession,
    state,
    loadAgents,
    refreshAgents,
    agentItems,
    loadResources,
    refreshResources,
    agentAvatarMarkup,
    agentTagsMarkup,
    agentName,
    normalizeResourcePath,
    resourcePath,
    resourceNames,
    profileTags,
    profileQuickstarts,
    agentSkills,
    providerName,
    modelName,
    defaultResources,
    newAgent,
    hasAgentDraft,
    dismissAgentDialogFromBackdrop,
    closeAgentDialog,
    setAgentWizardStep,
    nextAgentWizardStep,
    previousAgentWizardStep,
    agentSkillItems,
    generateAgentInstruction,
    modelsFor,
    thinkingLevelsFor,
    defaultThinkingLevel,
    defaultAgentTools,
    defaultModelFor,
    changeAgentProvider,
    changeAgentModel,
    agentModelConfigPayload,
    usesAutoModelConfig,
    autoModelConfigLabel,
    submitAgent,
    toggleAgentTool,
    toolGroupTools,
    toolGroupState,
    toolGroupStateFor,
    dialogToolGroupState,
    toggleToolGroup,
    avatarUrl,
    marketAgentAvatarUrl,
    uploadAvatarFile,
    uploadAgentAvatar,
    toggleResource,
    deleteAgent,
    confirmDelete,
    editAgent,
    replaceResources,
  };
}
