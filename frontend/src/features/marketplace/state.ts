import type * as DTO from "../../shared/types";

export function createMarketplaceState() {
  return {
    marketTab: "skills",
    marketAgents: [] as DTO.Agent[],
    marketAgentsLoading: false,
    marketPublishTarget: null as DTO.Agent | null,
    marketPublishVersion: "v1.0.0",
    marketPublishing: false,
    marketDeleteAgentTarget: null as DTO.Agent | null,
    marketDeletingAgent: false,
    marketInstallAgentTarget: null as DTO.Agent | null,
    marketInstallingAgent: false,
    marketUpdateAgentTarget: null as DTO.Agent | null,
    marketUpdatingAgent: false,
    marketCatalogSearch: "",
    marketInstallOpen: false,
    marketMcpAddOpen: false,
    marketMcpConfig:
      '{\n  "mcpServers": {\n    "server-name": {\n      "type": "http",\n      "url": "https://example.com/mcp"\n    }\n  }\n}',
    marketMcpAction: false,
    marketSearch: "",
    marketOwner: "",
    marketSearchResults: [] as DTO.SkillResult[],
    marketSearchLoading: false,
    marketSearchError: "",
    marketInstallingSkills: [] as string[],
    marketExtensionPackage: "",
    marketExtensionAction: false,
    marketUninstallTarget: null as { kind: string; item: DTO.Resource } | null,
  };
}
