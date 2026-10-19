import { ApiError, asError } from "../../shared/types";
import type { Workspace } from "../../app/workspace";
import { nextTick } from "vue";

import type * as DTO from "../../shared/types";

// Explicit dependency contract for this feature; the composition root supplies it.
type Context = Pick<
  Workspace,
  | "agentModelConfigPayload"
  | "agentPickerOpen"
  | "agentSearch"
  | "agentSkillSearch"
  | "agentWizardStep"
  | "agents"
  | "api"
  | "avatarUrl"
  | "chats"
  | "confirmTarget"
  | "createDialog"
  | "creating"
  | "defaultAgentTools"
  | "defaultModelFor"
  | "defaultResources"
  | "defaultThinkingLevel"
  | "dialog"
  | "draft"
  | "editingAgent"
  | "escape"
  | "generatingInstruction"
  | "hasAgentDraft"
  | "initials"
  | "marketAgentAvatarUrl"
  | "marketPublishTarget"
  | "marketPublishVersion"
  | "modelName"
  | "modelsFor"
  | "newAgentAvatarFile"
  | "newAgentAvatarPreview"
  | "newAgentDescription"
  | "newAgentExtensions"
  | "newAgentInstruction"
  | "newAgentMcpServers"
  | "newAgentModel"
  | "newAgentName"
  | "newAgentProvider"
  | "newAgentQuickstarts"
  | "newAgentSkills"
  | "newAgentTags"
  | "newAgentThinkingLevel"
  | "newAgentTools"
  | "newChat"
  | "normalizeResourcePath"
  | "page"
  | "profileQuickstarts"
  | "profileTags"
  | "providerName"
  | "refreshAgents"
  | "refreshResources"
  | "request"
  | "resizeAgentTextareas"
  | "resourcePath"
  | "resources"
  | "responseData"
  | "selectedAgentId"
  | "setAgentWizardStep"
  | "showError"
  | "showToast"
  | "thinkingLevelsFor"
  | "toolCatalog"
  | "toolGroupState"
  | "toolGroupStateFor"
  | "toolGroupTools"
  | "toolGroups"
  | "uploadAvatarFile"
  | "usesAutoModelConfig"
>;
export interface Actions {
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
  startQuickstart(agent: DTO.Agent, prompt: string): void;
  providerName(id: string): string;
  modelName(providerId: string, modelId: string): string;
  chooseAgent(id: string): void;
  chatCount(id: string): number;
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
  modelsFor(providerId?: string): DTO.Model[];
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
  publishAgent(agent: DTO.Agent): void;
  confirmDelete(): Promise<void>;
  editAgent(agent: DTO.Agent): void;
}
export const agentsActions: Actions = {
  async loadAgents(this: Context): Promise<void> {
    try {
      await this.refreshAgents();
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    }
  },
  async refreshAgents(this: Context): Promise<DTO.Agent[]> {
    const data = await this.api<{ agents: DTO.Agent[] }>("/api/agents");
    this.agents = data.agents || [];
    return this.agents;
  },
  agentItems(this: Context): DTO.Agent[] {
    const query = this.agentSearch.trim().toLowerCase();
    if (!query) return this.agents;
    return this.agents.filter((item) =>
      `${item.name || ""} ${item.description || ""} ${(item.tags || []).join(" ")}`.toLowerCase().includes(query),
    );
  },
  async loadResources(this: Context): Promise<void> {
    try {
      await this.refreshResources();
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    }
  },
  async refreshResources(this: Context): Promise<DTO.Resources> {
    this.resources = await this.api<DTO.Resources>("/api/resources");
    if (this.resources.tools?.length) this.toolCatalog = this.resources.tools;
    return this.resources;
  },
  agentAvatarMarkup(
    this: Context,
    agent: Partial<DTO.Agent> | null | undefined,
    size: string = "",
    market: boolean = false,
  ): string {
    const name = String(agent?.name || "Agent");
    const url = market ? (agent?.avatar_available ? this.marketAgentAvatarUrl(agent) : "") : this.avatarUrl(agent);
    const classes = ["agent-mark", size, "agent-avatar-image"].filter(Boolean).join(" ");
    return url
      ? `<img class="${classes}" src="${this.escape(url)}" alt="${this.escape(name)} avatar" />`
      : `<span class="${classes}" aria-hidden="true">${this.escape(this.initials(name))}</span>`;
  },
  agentTagsMarkup(this: Context, tags: string[], limit: number = 4): string {
    if (!Array.isArray(tags)) return "";
    return tags
      .slice(0, limit)
      .map((tag) => `<span class="badge badge-ghost">${this.escape(String(tag))}</span>`)
      .join("");
  },
  agentName(this: Context, id: string): string {
    return this.agents.find((a) => a.id === id)?.name || "unknown agent";
  },
  normalizeResourcePath(this: Context, path: string): string {
    const normalized = String(path || "").replaceAll("\\", "/");
    const marker = "/.pi/agent";
    const index = normalized.indexOf(marker);
    return index >= 0 ? normalized.slice(index) : normalized;
  },
  resourcePath(this: Context, kind: string, path: string): string {
    const catalog = kind === "extensions" ? this.resources.extensions : this.resources.skills;
    const normalized = this.normalizeResourcePath(path);
    return catalog.find((item) => this.normalizeResourcePath(item.path) === normalized)?.path || "";
  },
  resourceNames(this: Context, paths: string[], kind: string): string {
    if (!paths?.length) return "None";
    const catalog = kind === "extensions" ? this.resources.extensions : this.resources.skills;
    return paths
      .map(
        (path) =>
          catalog.find((item) => this.normalizeResourcePath(item.path) === this.normalizeResourcePath(path))?.name ||
          path.split(/[\\/]/).pop(),
      )
      .join(", ");
  },
  profileTags(this: Context, value: string): string[] {
    return value
      .split(/[\n,]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 5);
  },
  profileQuickstarts(this: Context, value: string): string[] {
    return value
      .split("\n")
      .map((prompt) => prompt.trim())
      .filter(Boolean)
      .slice(0, 5);
  },
  agentSkills(this: Context, agent: DTO.Agent): DTO.Resource[] {
    const enabled = agent?.skills || [];
    return this.resources.skills.filter((skill) =>
      enabled.some((path) => this.normalizeResourcePath(path) === this.normalizeResourcePath(skill.path)),
    );
  },
  startQuickstart(this: Context, agent: DTO.Agent, prompt: string): void {
    this.newChat();
    this.selectedAgentId = agent.id;
    this.draft = prompt;
    nextTick(() => document.getElementById("new-chat-message")?.focus());
  },
  providerName(this: Context, id: string): string {
    return this.resources.providers.find((item) => item.id === id)?.name || id || "";
  },
  modelName(this: Context, providerId: string, modelId: string): string {
    return this.modelsFor(providerId).find((item) => item.id === modelId)?.name || modelId || "";
  },
  chooseAgent(this: Context, id: string): void {
    this.selectedAgentId = id;
    this.agentPickerOpen = false;
  },
  chatCount(this: Context, id: string): number {
    return this.chats.filter((c) => c.agent_id === id).length;
  },
  defaultResources(this: Context, kind: "extensions" | "skills" | "mcp_servers"): string[] {
    const configKey = (
      {
        extensions: "default_extensions",
        skills: "default_skills",
        mcp_servers: "default_mcp_servers",
      } as const
    )[kind];
    const valueKey = kind === "mcp_servers" ? "id" : "path";
    const configured = this.resources[configKey] || [];
    return configured
      .map((value) =>
        kind === "mcp_servers"
          ? this.resources[kind].find((item) => [item.id, item.name, item.path].includes(value))?.[valueKey]
          : this.resourcePath(kind, value),
      )
      .filter((value): value is string => Boolean(value));
  },
  newAgent(this: Context): void {
    this.editingAgent = null;
    this.newAgentName = "";
    this.newAgentDescription = "";
    this.newAgentTags = "";
    this.newAgentQuickstarts = "";
    this.newAgentInstruction = "";
    this.newAgentAvatarFile = null;
    this.newAgentAvatarPreview = "";
    this.newAgentProvider = "";
    this.newAgentModel = "";
    this.newAgentThinkingLevel = "";
    this.newAgentTools = this.defaultAgentTools();
    this.newAgentExtensions = this.defaultResources("extensions");
    this.newAgentSkills = this.defaultResources("skills");
    this.newAgentMcpServers = this.defaultResources("mcp_servers");
    this.agentWizardStep = 1;
    this.agentSkillSearch = "";
    this.createDialog = true;
  },
  hasAgentDraft(this: Context): boolean {
    return Boolean(
      this.newAgentName.trim() ||
      this.newAgentDescription.trim() ||
      this.newAgentTags.trim() ||
      this.newAgentQuickstarts.trim() ||
      this.newAgentInstruction.trim() ||
      this.newAgentAvatarFile,
    );
  },
  dismissAgentDialogFromBackdrop(this: Context): void {
    if (!this.hasAgentDraft()) this.createDialog = false;
  },
  closeAgentDialog(this: Context): void {
    if (this.newAgentAvatarPreview) URL.revokeObjectURL(this.newAgentAvatarPreview);
    this.createDialog = false;
    this.editingAgent = null;
    this.newAgentAvatarFile = null;
    this.newAgentAvatarPreview = "";
    this.agentWizardStep = 1;
    this.agentSkillSearch = "";
  },
  setAgentWizardStep(this: Context, step: number): void {
    if (![1, 2, 3].includes(step)) return;
    this.agentWizardStep = step;
    nextTick(() => this.resizeAgentTextareas());
  },
  nextAgentWizardStep(this: Context): void {
    this.setAgentWizardStep(Math.min(3, this.agentWizardStep + 1));
  },
  previousAgentWizardStep(this: Context): void {
    this.setAgentWizardStep(Math.max(1, this.agentWizardStep - 1));
  },
  agentSkillItems(this: Context): DTO.Resource[] {
    const query = this.agentSkillSearch.trim().toLowerCase();
    if (!query) return this.resources.skills;
    return this.resources.skills.filter((item) =>
      `${item.name || ""} ${item.description || ""}`.toLowerCase().includes(query),
    );
  },
  async generateAgentInstruction(this: Context): Promise<void> {
    if (this.generatingInstruction) return;
    this.generatingInstruction = true;
    try {
      const data = await this.api<DTO.Agent>("/api/agents/instruction-draft", {
        method: "POST",
        body: JSON.stringify({
          name: this.newAgentName,
          instruction: this.newAgentInstruction,
          description: this.newAgentDescription,
          tags: this.profileTags(this.newAgentTags),
          quickstarts: this.profileQuickstarts(this.newAgentQuickstarts),
          ...this.agentModelConfigPayload(),
          tools: this.newAgentTools,
          extensions: this.newAgentExtensions,
          skills: this.newAgentSkills,
          mcp_servers: this.newAgentMcpServers,
        }),
      });
      this.newAgentInstruction = data.instruction || this.newAgentInstruction;
      this.newAgentDescription = data.description || this.newAgentDescription;
      if (Array.isArray(data.tags) && data.tags.length) this.newAgentTags = data.tags.join(", ");
      if (Array.isArray(data.quickstarts) && data.quickstarts.length)
        this.newAgentQuickstarts = data.quickstarts.join("\n");
      nextTick(() => this.resizeAgentTextareas());
      this.showToast("Agent profile optimized");
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    } finally {
      this.generatingInstruction = false;
    }
  },
  modelsFor(this: Context, providerId: string = this.newAgentProvider): DTO.Model[] {
    return this.resources.providers.find((item) => item.id === providerId)?.models || [];
  },
  thinkingLevelsFor(this: Context): string[] {
    if (!this.newAgentProvider || !this.newAgentModel) return [];
    const levels = this.modelsFor().find((item) => item.id === this.newAgentModel)?.thinking_levels || [];
    return levels.length ? levels : ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
  },
  defaultThinkingLevel(this: Context): string {
    const levels = this.thinkingLevelsFor();
    return levels.includes(this.resources.default_thinking_level)
      ? this.resources.default_thinking_level
      : levels.includes("low")
        ? "low"
        : levels[0] || "off";
  },
  defaultAgentTools(this: Context): string[] {
    const preferred = this.toolGroups.filter((group) => group.id !== "run_scripts").flatMap((group) => group.tools);
    return preferred.filter((name) => this.toolCatalog.some((tool) => tool.name === name));
  },
  defaultModelFor(this: Context, providerId: string): string {
    const models = this.modelsFor(providerId);
    if (
      providerId === this.resources.default_provider &&
      models.some((item) => item.id === this.resources.default_model)
    )
      return this.resources.default_model;
    return models[0]?.id || "";
  },
  changeAgentProvider(this: Context): void {
    if (!this.newAgentProvider) {
      this.newAgentModel = "";
      this.newAgentThinkingLevel = "";
      return;
    }
    this.newAgentModel = this.defaultModelFor(this.newAgentProvider);
    this.newAgentThinkingLevel = this.defaultThinkingLevel();
  },
  changeAgentModel(this: Context): void {
    if (!this.newAgentModel) {
      this.newAgentThinkingLevel = "";
      return;
    }
    if (!this.thinkingLevelsFor().includes(this.newAgentThinkingLevel))
      this.newAgentThinkingLevel = this.defaultThinkingLevel();
  },
  agentModelConfigPayload(this: Context): {
    provider: string | null;
    model: string | null;
    thinking_level: string | null;
  } {
    return {
      provider: this.newAgentProvider || null,
      model: this.newAgentModel || null,
      thinking_level: this.newAgentThinkingLevel || null,
    };
  },
  usesAutoModelConfig(this: Context): boolean {
    return !this.newAgentProvider && !this.newAgentModel && !this.newAgentThinkingLevel;
  },
  autoModelConfigLabel(this: Context): string {
    const provider = this.resources.default_provider || "not configured";
    const model = this.resources.default_model || "not configured";
    const thinking = this.resources.default_thinking_level || "not configured";
    return `${this.providerName(provider) || provider} / ${this.modelName(provider, model) || model} / ${thinking}`;
  },
  async submitAgent(this: Context): Promise<void> {
    const validModelConfig =
      this.usesAutoModelConfig() || (this.newAgentProvider && this.newAgentModel && this.newAgentThinkingLevel);
    if (!this.newAgentName.trim() || !this.newAgentInstruction.trim() || !validModelConfig) return;
    this.creating = true;
    try {
      const editing = Boolean(this.editingAgent);
      const avatarFile = this.newAgentAvatarFile;
      const payload = {
        name: this.newAgentName,
        description: this.newAgentDescription.trim() || null,
        tags: this.profileTags(this.newAgentTags),
        quickstarts: this.profileQuickstarts(this.newAgentQuickstarts),
        instruction: this.newAgentInstruction,
        ...this.agentModelConfigPayload(),
        tools: this.newAgentTools,
        extensions: this.newAgentExtensions,
        skills: this.newAgentSkills,
        mcp_servers: this.newAgentMcpServers,
      };
      const agent = this.editingAgent
        ? await this.api<DTO.Agent>(`/api/agents/${this.editingAgent.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await this.api<DTO.Agent>("/api/agents", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      if (!editing && avatarFile) await this.uploadAvatarFile(agent.id, avatarFile);
      await this.refreshAgents();
      this.createDialog = false;
      this.dialog = null;
      this.editingAgent = null;
      this.page = "agents";
      this.showToast(editing ? "Agent updated" : "Agent created");
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    } finally {
      this.creating = false;
    }
  },
  toggleAgentTool(this: Context, name: string): void {
    this.newAgentTools = this.newAgentTools.includes(name)
      ? this.newAgentTools.filter((tool) => tool !== name)
      : [...this.newAgentTools, name];
  },
  toolGroupTools(this: Context, group: DTO.ToolGroup): string[] {
    return group.tools.filter((name) => this.toolCatalog.some((tool) => tool.name === name));
  },
  toolGroupState(this: Context, group: DTO.ToolGroup): string {
    return this.toolGroupStateFor(group, this.newAgentTools);
  },
  toolGroupStateFor(this: Context, group: DTO.ToolGroup, selectedTools: string[] = []): string {
    const tools = this.toolGroupTools(group);
    const selected = tools.filter((name) => selectedTools.includes(name)).length;
    return selected === 0 ? "none" : selected === tools.length ? "all" : "partial";
  },
  dialogToolGroupState(this: Context, group: DTO.ToolGroup): string {
    return this.toolGroupStateFor(group, this.dialog?.tools || []);
  },
  toggleToolGroup(this: Context, group: DTO.ToolGroup): void {
    const tools = this.toolGroupTools(group);
    if (this.toolGroupState(group) === "all") {
      this.newAgentTools = this.newAgentTools.filter((name) => !tools.includes(name));
    } else {
      this.newAgentTools = [...new Set([...this.newAgentTools, ...tools])];
    }
  },
  avatarUrl(this: Context, agent: Partial<DTO.Agent> | null | undefined): string {
    if (!agent?.avatar_path || !agent.id) return "";
    return `/api/agents/${encodeURIComponent(agent.id)}/avatar?v=${encodeURIComponent(agent.updated_at || agent.avatar_path)}`;
  },
  marketAgentAvatarUrl(this: Context, agent: Partial<DTO.Agent> | null | undefined): string {
    return agent?.id ? `/api/market/agents/${encodeURIComponent(agent.id)}/avatar` : "";
  },
  async uploadAvatarFile(this: Context, agentId: string, file: File): Promise<DTO.Agent> {
    const requestPath = `/api/agents/${encodeURIComponent(agentId)}/avatar`;
    const { response, requestId } = await this.request(requestPath, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });
    const { data } = await this.responseData<DTO.Agent>(response, requestId, requestPath);
    return data;
  },
  async uploadAgentAvatar(this: Context, event: Event): Promise<void> {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      this.showError(new ApiError("Avatar must be an image file"));
      input.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.showError(new ApiError("Avatar must be 5 MB or smaller"));
      input.value = "";
      return;
    }
    if (this.newAgentAvatarPreview) URL.revokeObjectURL(this.newAgentAvatarPreview);
    this.newAgentAvatarFile = file;
    this.newAgentAvatarPreview = URL.createObjectURL(file);
    if (!this.editingAgent) return;
    this.creating = true;
    try {
      const updated = await this.uploadAvatarFile(this.editingAgent.id, file);
      Object.assign(this.editingAgent, updated);
      this.dialog = updated;
      this.newAgentAvatarFile = null;
      this.newAgentAvatarPreview = "";
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    } finally {
      this.creating = false;
    }
  },
  toggleResource(this: Context, kind: string, path: string): void {
    const key =
      kind === "extensions" ? "newAgentExtensions" : kind === "skills" ? "newAgentSkills" : "newAgentMcpServers";
    this[key] = this[key].includes(path) ? this[key].filter((item) => item !== path) : [...this[key], path];
  },
  deleteAgent(this: Context, agent: DTO.Agent): void {
    if (!agent.protected) this.confirmTarget = agent;
  },
  publishAgent(this: Context, agent: DTO.Agent): void {
    this.marketPublishTarget = agent;
    this.marketPublishVersion = "v1.0.0";
  },
  async confirmDelete(this: Context): Promise<void> {
    const agent = this.confirmTarget;
    if (!agent) return;
    try {
      await this.api(`/api/agents/${agent.id}`, { method: "DELETE" });
      await this.refreshAgents();
      if (this.dialog?.id === agent.id) this.dialog = null;
      this.confirmTarget = null;
      this.showToast(`Agent ${agent.name} deleted`);
    } catch (cause) {
      const e = asError(cause);
      this.showError(e);
    }
  },
  editAgent(this: Context, agent: DTO.Agent): void {
    this.editingAgent = agent;
    this.newAgentName = agent.name;
    this.newAgentDescription = agent.description || "";
    this.newAgentTags = (agent.tags || []).join(", ");
    this.newAgentQuickstarts = (agent.quickstarts || []).join("\n");
    this.newAgentInstruction = agent.instruction;
    this.newAgentAvatarFile = null;
    this.newAgentAvatarPreview = "";
    this.newAgentProvider = agent.provider || "";
    this.newAgentModel = agent.model || "";
    this.newAgentThinkingLevel = agent.thinking_level || "";
    this.newAgentTools = [...(agent.tools || [])];
    this.newAgentExtensions = (agent.extensions || [])
      .map((path) => this.resourcePath("extensions", path))
      .filter((value): value is string => Boolean(value));
    this.newAgentSkills = (agent.skills || [])
      .map((path) => this.resourcePath("skills", path))
      .filter((value): value is string => Boolean(value));
    this.newAgentMcpServers = [...(agent.mcp_servers || [])];
    this.agentWizardStep = 1;
    this.agentSkillSearch = "";
    this.dialog = null;
    this.createDialog = true;
    nextTick(() => this.resizeAgentTextareas());
  },
};
