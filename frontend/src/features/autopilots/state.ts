import type * as DTO from "../../shared/types";

export function createAutopilotsState() {
  return {
    autopilots: [] as DTO.Autopilot[],
    autopilotSearch: "",
    autopilotAgentFilter: "",
    autopilotAgentPickerOpen: false,
    autopilotEditAgentPickerOpen: false,
    autopilotDialog: false,
    autopilotRuns: [] as DTO.Run[],
    autopilotRunsOpen: false,
    autopilotRunsItem: null as DTO.Autopilot | null,
    autopilotLoading: false,
    autopilotSaving: false,
    autopilotEditing: null as DTO.Autopilot | null,
    autopilotName: "",
    autopilotInstruction: "",
    autopilotAgentId: "",
    autopilotCron: "0 * * * *",
    autopilotStartsAt: "",
    autopilotEndsAt: "",
    autopilotDeleteTarget: null as DTO.Autopilot | null,
    cronBuilderOpen: false,
    cronFrequency: "hourly",
    cronDay: ["1"],
    cronHour: "9",
    cronMinute: "0",
    cronMonth: "1",
    cronDayOfMonth: "1",
  };
}
