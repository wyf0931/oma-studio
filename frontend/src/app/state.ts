import { createAppState } from "./shell-state";
import { createSettingsState } from "../features/settings/state";
import { createUsageState } from "../features/usage/state";
import { createIdentityState } from "../features/identity/state";
import { createSharesState } from "../features/shares/state";
import { createI18nState } from "../shared/i18n-state";
import { createChatState } from "../features/chat/state";
import { createAutopilotsState } from "../features/autopilots/state";
import { createAgentsState } from "../features/agents/state";
import { createArtifactsState } from "../features/artifacts/state";
import { createMarketplaceState } from "../features/marketplace/state";
// Each application instance owns fresh feature state; no module-level singleton.
export function createState() {
  return {
    ...createAppState(),
    ...createSettingsState(),
    ...createUsageState(),
    ...createIdentityState(),
    ...createSharesState(),
    ...createI18nState(),
    ...createChatState(),
    ...createAutopilotsState(),
    ...createAgentsState(),
    ...createArtifactsState(),
    ...createMarketplaceState(),
  };
}
