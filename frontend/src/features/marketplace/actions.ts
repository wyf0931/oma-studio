import type { Actions as AgentsActions, State as AgentsState } from "../agents/actions";
import type { State as IdentityState } from "../identity/actions";
import type { Actions as ApiActions } from "../../shared/api";
import type { Actions as ShellActions } from "../../app/actions";
import type { Actions as I18nActions } from "../../shared/i18n";
import { unwrap } from "../../shared/api";
import { reactive } from "vue";
import type * as DTO from "../../shared/types";
import { ApiError, asError } from "../../shared/types";

import { createMarketplaceState } from "./state";
export type State = ReturnType<typeof createMarketplaceState>;
export interface Actions {
  resetSession(): void;
  publishAgent(agent: DTO.Agent): void;
  loadMarketAgents(): Promise<void>;
  marketAgentItems(): DTO.Agent[];
  marketCatalogItems(kind: string): DTO.Resource[];
  searchMarketSkills(): Promise<void>;
  marketSkillGitHubSource(value: string): string;
  openMarketInstall(): void;
  closeMarketInstall(): void;
  openMarketMcpAdd(): void;
  closeMarketMcpAdd(): void;
  marketMcpNames(): string[];
  addMarketMcpServers(): Promise<void>;
  marketSkillInstalled(result: DTO.SkillResult): boolean;
  marketSkillSourceKey(source: string): string;
  marketSkillResultKey(result: DTO.SkillResult): string;
  installMarketSkill(result: DTO.SkillResult): Promise<void>;
  installMarketExtension(): Promise<void>;
  marketResourceSource(kind: string, item: DTO.Resource): string;
  marketResourceAuthor(kind: string, item: DTO.Resource): string;
  marketSearchPlaceholder(): string;
  openMarketUninstall(kind: string, item: DTO.Resource): void;
  confirmMarketUninstall(): Promise<void>;
  confirmPublishAgent(): Promise<void>;
  installMarketAgent(agent: DTO.Agent): void;
  requestMarketplaceAgentUpdate(agent: DTO.Agent): void;
  requestMarketListingUpdate(item: DTO.Agent): void;
  deleteMarketAgent(agent: DTO.Agent): void;
  confirmDeleteMarketAgent(): Promise<void>;
  confirmInstallMarketAgent(): Promise<void>;
  confirmMarketplaceAgentUpdate(): Promise<void>;
}
export interface Feature extends Actions {
  state: State;
}
export interface Dependencies {
  agents: Pick<AgentsActions, "refreshAgents" | "refreshResources" | "replaceResources"> & {
    state: Readonly<Pick<AgentsState, "agents" | "resources">>;
  };
  identity: { state: Readonly<Pick<IdentityState, "authUser">> };
  api: Pick<ApiActions, "client">;
  shell: Pick<ShellActions, "showError" | "showToast">;
  i18n: Pick<I18nActions, "t">;
}
export function createMarketplace(deps: Dependencies): Feature {
  const state = reactive(createMarketplaceState());
  async function loadMarketAgents(): Promise<void> {
    state.marketAgentsLoading = true;
    try {
      state.marketAgents = unwrap(await deps.api.client.GET("/api/market/agents")).agents || [];
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    } finally {
      state.marketAgentsLoading = false;
    }
  }
  function marketAgentItems(): DTO.Agent[] {
    const query = state.marketCatalogSearch.trim().toLowerCase();
    if (!query) return state.marketAgents;
    return state.marketAgents.filter((item) =>
      `${item.name || ""} ${item.description || ""} ${item.instruction || ""} ${item.author || ""} ${(item.tags || []).join(" ")}`
        .toLowerCase()
        .includes(query),
    );
  }
  function marketCatalogItems(kind: string): DTO.Resource[] {
    const items = deps.agents.state.resources[kind as "extensions" | "skills" | "mcp_servers"] || [];
    const query = state.marketCatalogSearch.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => `${item.name || ""} ${item.description || ""}`.toLowerCase().includes(query));
  }
  async function searchMarketSkills(): Promise<void> {
    const query = state.marketSearch.trim();
    if (!query) {
      state.marketSearchResults = [];
      state.marketSearchError = "Enter a skill or topic to search.";
      return;
    }
    state.marketSearchLoading = true;
    state.marketSearchError = "";
    try {
      const githubSource = marketSkillGitHubSource(query);
      const data = githubSource
        ? unwrap(await deps.api.client.POST("/api/market/skills/preview", { body: { source: githubSource } }))
        : unwrap(
            await deps.api.client.POST("/api/market/skills/search", {
              body: { query, owner: state.marketOwner.trim() || null },
            }),
          );
      state.marketSearchResults = data.results || [];
    } catch (cause) {
      const error = asError(cause);
      state.marketSearchResults = [];
      state.marketSearchError = error.message;
    } finally {
      state.marketSearchLoading = false;
    }
  }
  function marketSkillGitHubSource(value: string): string {
    const source = value.trim().replace(/\/$/, "");
    return /^(?:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?(?:\/tree\/[^/]+(?:\/.*)?)?|git@github\.com:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?|ssh:\/\/git@github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?)$/i.test(
      source,
    )
      ? source
      : "";
  }
  function openMarketInstall(): void {
    state.marketSearch = "";
    state.marketOwner = "";
    state.marketSearchResults = [];
    state.marketSearchError = "";
    state.marketExtensionPackage = "";
    state.marketInstallOpen = true;
  }
  function closeMarketInstall(): void {
    if (state.marketInstallingSkills.length || state.marketExtensionAction) return;
    state.marketInstallOpen = false;
    state.marketSearchError = "";
  }
  function openMarketMcpAdd(): void {
    state.marketMcpConfig =
      '{\n  "mcpServers": {\n    "server-name": {\n      "type": "http",\n      "url": "https://example.com/mcp"\n    }\n  }\n}';
    state.marketMcpAddOpen = true;
  }
  function closeMarketMcpAdd(): void {
    if (!state.marketMcpAction) state.marketMcpAddOpen = false;
  }
  function marketMcpNames(): string[] {
    try {
      const servers = JSON.parse(state.marketMcpConfig)?.mcpServers;
      return servers && typeof servers === "object" && !Array.isArray(servers) ? Object.keys(servers) : [];
    } catch {
      return [];
    }
  }
  async function addMarketMcpServers(): Promise<void> {
    state.marketMcpAction = true;
    try {
      const data = unwrap(
        await deps.api.client.POST("/api/market/mcp-servers", { body: { config: state.marketMcpConfig } }),
      );
      deps.agents.replaceResources(data.resources);
      state.marketMcpAddOpen = false;
      deps.shell.showToast(`MCP server${data.servers.length === 1 ? "" : "s"} added`);
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    } finally {
      state.marketMcpAction = false;
    }
  }
  function marketSkillInstalled(result: DTO.SkillResult): boolean {
    const sourceKey = marketSkillSourceKey(result.repo);
    return deps.agents.state.resources.skills.some(
      (item) =>
        item.name === result.skill && (!sourceKey || !item.source || marketSkillSourceKey(item.source) === sourceKey),
    );
  }
  function marketSkillSourceKey(source: string): string {
    return String(source || "")
      .trim()
      .replace(/^https:\/\/github\.com\//i, "")
      .replace(/\.git\/?$/i, "")
      .replace(/\/$/, "")
      .toLowerCase();
  }
  function marketSkillResultKey(result: DTO.SkillResult): string {
    return `${result.repo || ""}:${result.skill}`;
  }
  async function installMarketSkill(result: DTO.SkillResult): Promise<void> {
    const resultKey = marketSkillResultKey(result);
    if (state.marketInstallingSkills.includes(resultKey) || marketSkillInstalled(result)) return;
    state.marketInstallingSkills.push(resultKey);
    state.marketSearchError = "";
    try {
      unwrap(
        await deps.api.client.POST("/api/market/skills/install", {
          body: { source: result.repo, skill: result.skill },
        }),
      );
      await deps.agents.refreshResources();
      deps.shell.showToast(`Skill ${result.skill} installed`);
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    } finally {
      state.marketInstallingSkills = state.marketInstallingSkills.filter((key) => key !== resultKey);
    }
  }
  async function installMarketExtension(): Promise<void> {
    const packageInput = state.marketExtensionPackage.trim();
    if (!packageInput) {
      deps.shell.showError(new ApiError("Enter an npm package id"));
      return;
    }
    state.marketExtensionAction = true;
    try {
      const data = unwrap(
        await deps.api.client.POST("/api/market/extensions/install", { body: { package: packageInput } }),
      );
      await deps.agents.refreshResources();
      const installed = data.package?.replace(/^npm:/, "") || packageInput;
      state.marketInstallOpen = false;
      state.marketExtensionPackage = "";
      deps.shell.showToast(`Extension ${installed} installed`);
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    } finally {
      state.marketExtensionAction = false;
    }
  }
  function marketResourceSource(kind: string, item: DTO.Resource): string {
    if (item?.source) return item.source;
    if (kind === "extensions" && item?.path?.includes("/npm/node_modules/")) return `npm:${item.name}`;
    if (kind === "extensions" && item?.path) return item.path;
    if (kind === "skills" && item?.name) return item.name;
    return "";
  }
  function marketResourceAuthor(kind: string, item: DTO.Resource): string {
    const author = typeof item?.author === "string" ? item.author.trim() : "";
    const sourceAuthor = kind === "skills" && item?.source ? (item.source.split("/", 1)[0] || "").trim() : "";
    return (author || sourceAuthor || "admin").slice(0, 10);
  }
  function marketSearchPlaceholder(): string {
    const key = {
      skills: "marketplace.searchSkills",
      extensions: "marketplace.searchExtensions",
      mcp_servers: "marketplace.searchMcpServers",
      agents: "marketplace.searchAgents",
      agent_teams: "marketplace.searchAgentTeams",
    }[state.marketTab];
    return deps.i18n.t(key || "marketplace.searchResources");
  }
  function openMarketUninstall(kind: string, item: DTO.Resource): void {
    if (!marketResourceSource(kind, item)) return;
    state.marketUninstallTarget = { kind, item };
  }
  async function confirmMarketUninstall(): Promise<void> {
    const target = state.marketUninstallTarget;
    if (!target) return;
    const { kind, item } = target;
    if (kind === "mcp_servers") {
      try {
        const data = unwrap(
          await deps.api.client.DELETE("/api/market/mcp-servers/{name}", { params: { path: { name: item.name } } }),
        );
        deps.agents.replaceResources(data.resources);
        state.marketUninstallTarget = null;
        deps.shell.showToast(`MCP server ${item.name} deleted`);
      } catch (cause) {
        const error = asError(cause);
        deps.shell.showError(error);
      }
      return;
    }
    const packageSource = marketResourceSource(kind, item);
    try {
      if (kind === "extensions") {
        unwrap(
          await deps.api.client.POST("/api/market/extensions/uninstall", {
            body: packageSource.startsWith("npm:") ? { package: packageSource } : { path: packageSource },
          }),
        );
      } else {
        unwrap(
          await deps.api.client.POST("/api/market/skills/uninstall", {
            body: { source: item.source || null, skill: item.name },
          }),
        );
      }
      await deps.agents.refreshResources();
      state.marketUninstallTarget = null;
      deps.shell.showToast(`${kind === "extensions" ? "Extension" : "Skill"} ${item.name} uninstalled`);
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    }
  }
  async function confirmPublishAgent(): Promise<void> {
    const agent = state.marketPublishTarget;
    if (!agent || state.marketPublishing) return;
    state.marketPublishing = true;
    try {
      const data = unwrap(
        await deps.api.client.POST("/api/agents/{agent_id}/publish", {
          params: { path: { agent_id: agent.id } },
          body: { version: state.marketPublishVersion },
        }),
      );
      state.marketPublishTarget = null;
      await loadMarketAgents();
      deps.shell.showToast(`Agent ${data.agent.name} ${data.agent.version} published`);
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    } finally {
      state.marketPublishing = false;
    }
  }
  function installMarketAgent(agent: DTO.Agent): void {
    state.marketInstallAgentTarget = agent;
  }
  function requestMarketplaceAgentUpdate(agent: DTO.Agent): void {
    if (!agent?.marketplace_update_available) return;
    state.marketUpdateAgentTarget = agent;
  }
  function requestMarketListingUpdate(item: DTO.Agent): void {
    const agent = deps.agents.state.agents.find(
      (candidate) => candidate.marketplace_update_available && item.installed_agent_ids?.includes(candidate.id),
    );
    if (agent) requestMarketplaceAgentUpdate(agent);
  }
  function deleteMarketAgent(agent: DTO.Agent): void {
    if (deps.identity.state.authUser?.role === "admin") state.marketDeleteAgentTarget = agent;
  }
  async function confirmDeleteMarketAgent(): Promise<void> {
    const agent = state.marketDeleteAgentTarget;
    if (!agent || state.marketDeletingAgent) return;
    state.marketDeletingAgent = true;
    try {
      unwrap(
        await deps.api.client.DELETE("/api/market/agents/{publication_id}", {
          params: { path: { publication_id: agent.id } },
        }),
      );
      state.marketAgents = state.marketAgents.filter((item) => item.id !== agent.id);
      state.marketDeleteAgentTarget = null;
      deps.shell.showToast(`Agent ${agent.name} removed from Marketplace`);
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    } finally {
      state.marketDeletingAgent = false;
    }
  }
  async function confirmInstallMarketAgent(): Promise<void> {
    const agent = state.marketInstallAgentTarget;
    if (!agent || state.marketInstallingAgent) return;
    state.marketInstallingAgent = true;
    try {
      const data = unwrap(
        await deps.api.client.POST("/api/market/agents/{publication_id}/install", {
          params: { path: { publication_id: agent.id } },
          body: { version: agent.version },
        }),
      );
      await deps.agents.refreshAgents();
      state.marketInstallAgentTarget = null;
      deps.shell.showToast(`Agent ${data.agent.name} installed`);
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    } finally {
      state.marketInstallingAgent = false;
    }
  }
  async function confirmMarketplaceAgentUpdate(): Promise<void> {
    const agent = state.marketUpdateAgentTarget;
    if (!agent || state.marketUpdatingAgent) return;
    state.marketUpdatingAgent = true;
    try {
      const updated = unwrap(
        await deps.api.client.POST("/api/agents/{agent_id}/market-update", {
          params: { path: { agent_id: agent.id } },
        }),
      );
      await Promise.all([deps.agents.refreshAgents(), loadMarketAgents()]);
      state.marketUpdateAgentTarget = null;
      deps.shell.showToast(`Agent ${updated.name} updated`);
    } catch (cause) {
      const error = asError(cause);
      deps.shell.showError(error);
    } finally {
      state.marketUpdatingAgent = false;
    }
  }
  function publishAgent(agent: DTO.Agent): void {
    state.marketPublishTarget = agent;
    state.marketPublishVersion = "v1.0.0";
  }
  function resetSession(): void {
    Object.assign(state, createMarketplaceState());
  }
  return {
    resetSession,
    state,
    loadMarketAgents,
    marketAgentItems,
    marketCatalogItems,
    searchMarketSkills,
    marketSkillGitHubSource,
    openMarketInstall,
    closeMarketInstall,
    openMarketMcpAdd,
    closeMarketMcpAdd,
    marketMcpNames,
    addMarketMcpServers,
    marketSkillInstalled,
    marketSkillSourceKey,
    marketSkillResultKey,
    installMarketSkill,
    installMarketExtension,
    marketResourceSource,
    marketResourceAuthor,
    marketSearchPlaceholder,
    openMarketUninstall,
    confirmMarketUninstall,
    confirmPublishAgent,
    installMarketAgent,
    requestMarketplaceAgentUpdate,
    requestMarketListingUpdate,
    deleteMarketAgent,
    confirmDeleteMarketAgent,
    confirmInstallMarketAgent,
    confirmMarketplaceAgentUpdate,
    publishAgent,
  };
}
