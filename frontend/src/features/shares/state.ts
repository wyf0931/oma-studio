import type * as DTO from "../../shared/types";

export function createSharesState() {
  return {
    shareRecordsOpen: false,
    shareRecordsLoading: false,
    shareRecords: [] as DTO.Share[],
    shareRevokeTarget: null as Pick<DTO.Share, "token" | "kind"> | null,
    shareRevoking: false,
    sharedMode: false,
    sharedToken: "",
    sharedCanManage: false,
    shareMode: false,
    shareStep: null as string | null,
    shareUrl: "",
    shareTarget: "session",
    creatingShare: false,
    copiedShare: false,
  };
}
