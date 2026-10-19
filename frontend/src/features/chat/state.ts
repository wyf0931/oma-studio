import type * as DTO from "../../shared/types";

export function createChatState() {
  return {
    runError: "",
    chats: [] as DTO.Chat[],
    activeChat: null as DTO.ActiveChat | null,
    editingChatTitle: false,
    chatTitleDraft: "",
    chatTitleSaving: false,
    messages: [] as DTO.Message[],
    selectedAgentId: "",
    skillCommandIndex: 0,
    skillCommandDismissed: false,
    agentPickerOpen: false,
    draft: "",
    loading: false,
    chatViewToken: 0,
    chatReadController: null as AbortController | null,
    watchingChat: null as string | null,
    streamSource: null as EventSource | null,
    pollTimer: null as ReturnType<typeof setTimeout> | null,
    copiedKey: "",
    messagesLoading: false,
    searchOpen: false,
    chatSearchQuery: "",
    chatSearchAgentFilter: "",
    chatSearchAgentPickerOpen: false,
    deleteChatTarget: null as DTO.Chat | null,
  };
}
