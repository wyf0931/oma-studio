import { ApiError, asError } from "../../shared/types";
import type { Workspace } from "../../app/workspace";

import type * as DTO from "../../shared/types";

// Explicit dependency contract for this feature; the composition root supplies it.
type Context = Pick<
  Workspace,
  | "agents"
  | "api"
  | "authUser"
  | "loadMarketAgents"
  | "marketAgents"
  | "marketAgentsLoading"
  | "marketCatalogSearch"
  | "marketDeleteAgentTarget"
  | "marketDeletingAgent"
  | "marketExtensionAction"
  | "marketExtensionPackage"
  | "marketInstallAgentTarget"
  | "marketInstallOpen"
  | "marketInstallingAgent"
  | "marketInstallingSkills"
  | "marketMcpAction"
  | "marketMcpAddOpen"
  | "marketMcpConfig"
  | "marketOwner"
  | "marketPublishTarget"
  | "marketPublishVersion"
  | "marketPublishing"
  | "marketResourceSource"
  | "marketSearch"
  | "marketSearchError"
  | "marketSearchLoading"
  | "marketSearchResults"
  | "marketSkillGitHubSource"
  | "marketSkillInstalled"
  | "marketSkillResultKey"
  | "marketSkillSourceKey"
  | "marketTab"
  | "marketUninstallTarget"
  | "marketUpdateAgentTarget"
  | "marketUpdatingAgent"
  | "refreshAgents"
  | "refreshResources"
  | "requestMarketplaceAgentUpdate"
  | "resources"
  | "showError"
  | "showToast"
  | "t"
>;
export interface Actions {
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
export const marketplaceActions: Actions = {
  async loadMarketAgents(this: Context): Promise<void> {
    this.marketAgentsLoading = true;
    try {
      this.marketAgents = (await this.api<{ agents: DTO.Agent[] }>("/api/market/agents")).agents || [];
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    } finally {
      this.marketAgentsLoading = false;
    }
  },
  marketAgentItems(this: Context): DTO.Agent[] {
    const query = this.marketCatalogSearch.trim().toLowerCase();
    if (!query) return this.marketAgents;
    return this.marketAgents.filter((item) =>
      `${item.name || ""} ${item.description || ""} ${item.instruction || ""} ${item.author || ""} ${(item.tags || []).join(" ")}`
        .toLowerCase()
        .includes(query),
    );
  },
  marketCatalogItems(this: Context, kind: string): DTO.Resource[] {
    const items = this.resources[kind as "extensions" | "skills" | "mcp_servers"] || [];
    const query = this.marketCatalogSearch.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => `${item.name || ""} ${item.description || ""}`.toLowerCase().includes(query));
  },
  async searchMarketSkills(this: Context): Promise<void> {
    const query = this.marketSearch.trim();
    if (!query) {
      this.marketSearchResults = [];
      this.marketSearchError = "Enter a skill or topic to search.";
      return;
    }
    this.marketSearchLoading = true;
    this.marketSearchError = "";
    try {
      const githubSource = this.marketSkillGitHubSource(query);
      const data = await this.api<{ results: DTO.SkillResult[] }>(
        githubSource ? "/api/market/skills/preview" : "/api/market/skills/search",
        {
          method: "POST",
          body: JSON.stringify(
            githubSource ? { source: githubSource } : { query, owner: this.marketOwner.trim() || null },
          ),
        },
      );
      this.marketSearchResults = data.results || [];
    } catch (cause) {
      const error = asError(cause);
      this.marketSearchResults = [];
      this.marketSearchError = error.message;
    } finally {
      this.marketSearchLoading = false;
    }
  },
  marketSkillGitHubSource(this: Context, value: string): string {
    const source = value.trim().replace(/\/$/, "");
    return /^(?:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?(?:\/tree\/[^/]+(?:\/.*)?)?|git@github\.com:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?|ssh:\/\/git@github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?)$/i.test(
      source,
    )
      ? source
      : "";
  },
  openMarketInstall(this: Context): void {
    this.marketSearch = "";
    this.marketOwner = "";
    this.marketSearchResults = [];
    this.marketSearchError = "";
    this.marketExtensionPackage = "";
    this.marketInstallOpen = true;
  },
  closeMarketInstall(this: Context): void {
    if (this.marketInstallingSkills.length || this.marketExtensionAction) return;
    this.marketInstallOpen = false;
    this.marketSearchError = "";
  },
  openMarketMcpAdd(this: Context): void {
    this.marketMcpConfig =
      '{\n  "mcpServers": {\n    "server-name": {\n      "type": "http",\n      "url": "https://example.com/mcp"\n    }\n  }\n}';
    this.marketMcpAddOpen = true;
  },
  closeMarketMcpAdd(this: Context): void {
    if (!this.marketMcpAction) this.marketMcpAddOpen = false;
  },
  marketMcpNames(this: Context): string[] {
    try {
      const servers = JSON.parse(this.marketMcpConfig)?.mcpServers;
      return servers && typeof servers === "object" && !Array.isArray(servers) ? Object.keys(servers) : [];
    } catch {
      return [];
    }
  },
  async addMarketMcpServers(this: Context): Promise<void> {
    this.marketMcpAction = true;
    try {
      const data = await this.api<{ servers: DTO.Resource[]; resources: DTO.Resources }>("/api/market/mcp-servers", {
        method: "POST",
        body: JSON.stringify({ config: this.marketMcpConfig }),
      });
      this.resources = data.resources;
      this.marketMcpAddOpen = false;
      this.showToast(`MCP server${data.servers.length === 1 ? "" : "s"} added`);
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    } finally {
      this.marketMcpAction = false;
    }
  },
  marketSkillInstalled(this: Context, result: DTO.SkillResult): boolean {
    const sourceKey = this.marketSkillSourceKey(result.repo);
    return this.resources.skills.some(
      (item) =>
        item.name === result.skill &&
        (!sourceKey || !item.source || this.marketSkillSourceKey(item.source) === sourceKey),
    );
  },
  marketSkillSourceKey(this: Context, source: string): string {
    return String(source || "")
      .trim()
      .replace(/^https:\/\/github\.com\//i, "")
      .replace(/\.git\/?$/i, "")
      .replace(/\/$/, "")
      .toLowerCase();
  },
  marketSkillResultKey(this: Context, result: DTO.SkillResult): string {
    return `${result.repo || ""}:${result.skill}`;
  },
  async installMarketSkill(this: Context, result: DTO.SkillResult): Promise<void> {
    const resultKey = this.marketSkillResultKey(result);
    if (this.marketInstallingSkills.includes(resultKey) || this.marketSkillInstalled(result)) return;
    this.marketInstallingSkills.push(resultKey);
    this.marketSearchError = "";
    try {
      await this.api("/api/market/skills/install", {
        method: "POST",
        body: JSON.stringify({ source: result.repo, skill: result.skill }),
      });
      await this.refreshResources();
      this.showToast(`Skill ${result.skill} installed`);
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    } finally {
      this.marketInstallingSkills = this.marketInstallingSkills.filter((key) => key !== resultKey);
    }
  },
  async installMarketExtension(this: Context): Promise<void> {
    const packageInput = this.marketExtensionPackage.trim();
    if (!packageInput) {
      this.showError(new ApiError("Enter an npm package id"));
      return;
    }
    this.marketExtensionAction = true;
    try {
      const data = await this.api<{ package: string }>("/api/market/extensions/install", {
        method: "POST",
        body: JSON.stringify({ package: packageInput }),
      });
      await this.refreshResources();
      const installed = data.package?.replace(/^npm:/, "") || packageInput;
      this.marketInstallOpen = false;
      this.marketExtensionPackage = "";
      this.showToast(`Extension ${installed} installed`);
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    } finally {
      this.marketExtensionAction = false;
    }
  },
  marketResourceSource(this: Context, kind: string, item: DTO.Resource): string {
    if (item?.source) return item.source;
    if (kind === "extensions" && item?.path?.includes("/npm/node_modules/")) return `npm:${item.name}`;
    if (kind === "extensions" && item?.path) return item.path;
    if (kind === "skills" && item?.name) return item.name;
    return "";
  },
  marketResourceAuthor(this: Context, kind: string, item: DTO.Resource): string {
    const author = typeof item?.author === "string" ? item.author.trim() : "";
    const sourceAuthor = kind === "skills" && item?.source ? (item.source.split("/", 1)[0] || "").trim() : "";
    return (author || sourceAuthor || "admin").slice(0, 10);
  },
  marketSearchPlaceholder(this: Context): string {
    const key = {
      skills: "marketplace.searchSkills",
      extensions: "marketplace.searchExtensions",
      mcp_servers: "marketplace.searchMcpServers",
      agents: "marketplace.searchAgents",
      agent_teams: "marketplace.searchAgentTeams",
    }[this.marketTab];
    return this.t(key || "marketplace.searchResources");
  },
  openMarketUninstall(this: Context, kind: string, item: DTO.Resource): void {
    if (!this.marketResourceSource(kind, item)) return;
    this.marketUninstallTarget = { kind, item };
  },
  async confirmMarketUninstall(this: Context): Promise<void> {
    const target = this.marketUninstallTarget;
    if (!target) return;
    const { kind, item } = target;
    if (kind === "mcp_servers") {
      try {
        const data = await this.api<{ servers: DTO.Resource[]; resources: DTO.Resources }>(
          `/api/market/mcp-servers/${encodeURIComponent(item.name)}`,
          { method: "DELETE" },
        );
        this.resources = data.resources;
        this.marketUninstallTarget = null;
        this.showToast(`MCP server ${item.name} deleted`);
      } catch (cause) {
        const error = asError(cause);
        this.showError(error);
      }
      return;
    }
    const path = kind === "extensions" ? "/api/market/extensions/uninstall" : "/api/market/skills/uninstall";
    const packageSource = this.marketResourceSource(kind, item);
    const payload =
      kind === "extensions"
        ? packageSource.startsWith("npm:")
          ? { package: packageSource }
          : { path: packageSource }
        : {
            source: item.source || null,
            skill: item.name,
          };
    try {
      await this.api(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await this.refreshResources();
      this.marketUninstallTarget = null;
      this.showToast(`${kind === "extensions" ? "Extension" : "Skill"} ${item.name} uninstalled`);
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    }
  },
  async confirmPublishAgent(this: Context): Promise<void> {
    const agent = this.marketPublishTarget;
    if (!agent || this.marketPublishing) return;
    this.marketPublishing = true;
    try {
      const data = await this.api<{ agent: DTO.Agent }>(`/api/agents/${agent.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ version: this.marketPublishVersion }),
      });
      this.marketPublishTarget = null;
      await this.loadMarketAgents();
      this.showToast(`Agent ${data.agent.name} ${data.agent.version} published`);
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    } finally {
      this.marketPublishing = false;
    }
  },
  installMarketAgent(this: Context, agent: DTO.Agent): void {
    this.marketInstallAgentTarget = agent;
  },
  requestMarketplaceAgentUpdate(this: Context, agent: DTO.Agent): void {
    if (!agent?.marketplace_update_available) return;
    this.marketUpdateAgentTarget = agent;
  },
  requestMarketListingUpdate(this: Context, item: DTO.Agent): void {
    const agent = this.agents.find(
      (candidate) => candidate.marketplace_update_available && item.installed_agent_ids?.includes(candidate.id),
    );
    if (agent) this.requestMarketplaceAgentUpdate(agent);
  },
  deleteMarketAgent(this: Context, agent: DTO.Agent): void {
    if (this.authUser?.role === "admin") this.marketDeleteAgentTarget = agent;
  },
  async confirmDeleteMarketAgent(this: Context): Promise<void> {
    const agent = this.marketDeleteAgentTarget;
    if (!agent || this.marketDeletingAgent) return;
    this.marketDeletingAgent = true;
    try {
      await this.api(`/api/market/agents/${agent.id}`, { method: "DELETE" });
      this.marketAgents = this.marketAgents.filter((item) => item.id !== agent.id);
      this.marketDeleteAgentTarget = null;
      this.showToast(`Agent ${agent.name} removed from Marketplace`);
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    } finally {
      this.marketDeletingAgent = false;
    }
  },
  async confirmInstallMarketAgent(this: Context): Promise<void> {
    const agent = this.marketInstallAgentTarget;
    if (!agent || this.marketInstallingAgent) return;
    this.marketInstallingAgent = true;
    try {
      const data = await this.api<{ agent: DTO.Agent }>(`/api/market/agents/${agent.id}/install`, {
        method: "POST",
        body: JSON.stringify({ version: agent.version }),
      });
      await this.refreshAgents();
      this.marketInstallAgentTarget = null;
      this.showToast(`Agent ${data.agent.name} installed`);
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    } finally {
      this.marketInstallingAgent = false;
    }
  },
  async confirmMarketplaceAgentUpdate(this: Context): Promise<void> {
    const agent = this.marketUpdateAgentTarget;
    if (!agent || this.marketUpdatingAgent) return;
    this.marketUpdatingAgent = true;
    try {
      const updated = await this.api<DTO.Agent>(`/api/agents/${agent.id}/market-update`, {
        method: "POST",
      });
      await Promise.all([this.refreshAgents(), this.loadMarketAgents()]);
      this.marketUpdateAgentTarget = null;
      this.showToast(`Agent ${updated.name} updated`);
    } catch (cause) {
      const error = asError(cause);
      this.showError(error);
    } finally {
      this.marketUpdatingAgent = false;
    }
  },
};
