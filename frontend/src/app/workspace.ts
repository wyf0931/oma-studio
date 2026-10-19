import { appActions } from "./actions";
import { i18nActions } from "../shared/i18n";
import { domActions } from "../shared/dom";
import { apiActions } from "../shared/api";
import { identityActions } from "../features/identity/actions";
import { agentsActions } from "../features/agents/actions";
import { sharesActions } from "../features/shares/actions";
import { chatActions } from "../features/chat/actions";
import { marketplaceActions } from "../features/marketplace/actions";
import { artifactsActions } from "../features/artifacts/actions";
import { formatActions } from "../shared/format";
import { autopilotsActions } from "../features/autopilots/actions";
import { settingsActions } from "../features/settings/actions";
import { usageActions } from "../features/usage/actions";
import { renderingActions } from "../shared/rendering";
import { createState } from "./state";
import { reactive } from "vue";
export type Workspace = ReturnType<typeof createState> &
  typeof appActions &
  typeof i18nActions &
  typeof domActions &
  typeof apiActions &
  typeof identityActions &
  typeof agentsActions &
  typeof sharesActions &
  typeof chatActions &
  typeof marketplaceActions &
  typeof artifactsActions &
  typeof formatActions &
  typeof autopilotsActions &
  typeof settingsActions &
  typeof usageActions &
  typeof renderingActions;
export function createWorkspace(): Workspace {
  const state = reactive(createState()) as Workspace;
  const actions = {
    ...appActions,
    ...i18nActions,
    ...domActions,
    ...apiActions,
    ...identityActions,
    ...agentsActions,
    ...sharesActions,
    ...chatActions,
    ...marketplaceActions,
    ...artifactsActions,
    ...formatActions,
    ...autopilotsActions,
    ...settingsActions,
    ...usageActions,
    ...renderingActions,
  };
  for (const [name, action] of Object.entries(actions))
    Object.defineProperty(state, name, { value: action.bind(state) });
  return state;
}
