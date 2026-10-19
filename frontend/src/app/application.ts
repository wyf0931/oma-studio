import { createShell } from "./actions";
import { createI18n } from "../shared/i18n";
import { createDom } from "../shared/dom";
import { createApi } from "../shared/api";
import { createFormat } from "../shared/format";
import { createContent } from "../shared/content";
import { createPresentation } from "../features/chat/presentation";
import { createAgents } from "../features/agents/actions";
import { createArtifacts } from "../features/artifacts/actions";
import { createAutopilots } from "../features/autopilots/actions";
import { createChat } from "../features/chat/actions";
import { createIdentity } from "../features/identity/actions";
import { createMarketplace } from "../features/marketplace/actions";
import { createSettings } from "../features/settings/actions";
import { createShares } from "../features/shares/actions";
import { createUsage } from "../features/usage/actions";
export function createApplication() {
  const shell = createShell({
    get settings() {
      return settings;
    },
    get identity() {
      return identity;
    },
    get shares() {
      return shares;
    },
    get agents() {
      return agents;
    },
    get chat() {
      return chat;
    },
    get artifacts() {
      return artifacts;
    },
    get presentation() {
      return presentation;
    },
    get dom() {
      return dom;
    },
    get i18n() {
      return i18n;
    },
    get api() {
      return api;
    },
    get autopilots() {
      return autopilots;
    },
    get marketplace() {
      return marketplace;
    },
  });
  const i18n = createI18n();
  const dom = createDom({
    onCleanup(cleanup) {
      shell.state.cleanups.push(cleanup);
    },
  });
  const api = createApi({
    baseUrl: location.origin,
    fetch: (request) => fetch(request),
    onUnauthorized: (...args) => shell.handleUnauthorizedResponse(...args),
    get i18n() {
      return i18n;
    },
  });
  const format = createFormat({
    get i18n() {
      return i18n;
    },
  });
  const content = createContent({
    getTheme: () => settings.state.theme,
    get format() {
      return format;
    },
    get i18n() {
      return i18n;
    },
  });
  const presentation = createPresentation({
    get shell() {
      return shell;
    },
    get shares() {
      return shares;
    },
    get chat() {
      return chat;
    },
    get agents() {
      return agents;
    },
    get settings() {
      return settings;
    },
    get format() {
      return format;
    },
    get artifacts() {
      return artifacts;
    },
    get content() {
      return content;
    },
    get i18n() {
      return i18n;
    },
  });
  const agents = createAgents({
    get shell() {
      return shell;
    },
    get api() {
      return api;
    },
    get format() {
      return format;
    },
    get dom() {
      return dom;
    },
  });
  const artifacts = createArtifacts({
    get chat() {
      return chat;
    },
    get shares() {
      return shares;
    },
    get presentation() {
      return presentation;
    },
    get api() {
      return api;
    },
    get shell() {
      return shell;
    },
    get i18n() {
      return i18n;
    },
    get content() {
      return content;
    },
  });
  const autopilots = createAutopilots({
    get agents() {
      return agents;
    },
    get api() {
      return api;
    },
    get shell() {
      return shell;
    },
  });
  const chat = createChat({
    get shares() {
      return shares;
    },
    get artifacts() {
      return artifacts;
    },
    get agents() {
      return agents;
    },
    get shell() {
      return shell;
    },
    get api() {
      return api;
    },
    get dom() {
      return dom;
    },
    get presentation() {
      return presentation;
    },
    get format() {
      return format;
    },
  });
  const identity = createIdentity({
    get api() {
      return api;
    },
    get settings() {
      return settings;
    },
    get shell() {
      return shell;
    },
    get format() {
      return format;
    },
    get i18n() {
      return i18n;
    },
    get usage() {
      return usage;
    },
    get shares() {
      return shares;
    },
    onAuthenticated: async () => {
      shell.setBootReady(false);
      await Promise.all([agents.loadAgents(), chat.loadChats(), shell.loadHealth(), agents.loadResources()]);
      const agent = agents.state.agents[0];
      if (agent) chat.chooseAgent(agent.id);
      shell.setBootReady(true);
      await shell.routeFromUrl();
      dom.renderIconsSoon();
    },
    onLoggedOut: () => {
      shell.setBootReady(true);
      shell.showPage("chat");
    },
  });
  const marketplace = createMarketplace({
    get agents() {
      return agents;
    },
    get identity() {
      return identity;
    },
    get api() {
      return api;
    },
    get shell() {
      return shell;
    },
    get i18n() {
      return i18n;
    },
  });
  const settings = createSettings({
    get identity() {
      return identity;
    },
    get i18n() {
      return i18n;
    },
    get api() {
      return api;
    },
    get shell() {
      return shell;
    },
    onCleanup(cleanup) {
      shell.state.cleanups.push(cleanup);
    },
  });
  const shares = createShares({
    get chat() {
      return chat;
    },
    get identity() {
      return identity;
    },
    get api() {
      return api;
    },
    get shell() {
      return shell;
    },
    get artifacts() {
      return artifacts;
    },
    get i18n() {
      return i18n;
    },
    get presentation() {
      return presentation;
    },
    get dom() {
      return dom;
    },
  });
  const usage = createUsage({
    get api() {
      return api;
    },
  });
  function dispose() {
    chat.stopWatching();
    chat.abortChatReads();
    if (shell.state.healthTimer) clearInterval(shell.state.healthTimer);
    for (const cleanup of shell.state.cleanups.splice(0)) cleanup();
  }
  return {
    shell,
    i18n,
    dom,
    api,
    format,
    content,
    presentation,
    agents,
    artifacts,
    autopilots,
    chat,
    identity,
    marketplace,
    settings,
    shares,
    usage,
    dispose,
  };
}
export type Application = ReturnType<typeof createApplication>;
