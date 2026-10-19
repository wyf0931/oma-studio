import type * as DTO from "../../shared/types";

export function createArtifactsState() {
  return {
    filesOpen: false,
    filesLoading: false,
    files: [] as DTO.Artifact[],
    inputFiles: [] as DTO.Artifact[],
    filesTab: "outputs",
    pendingUploads: [] as DTO.Upload[],
    pendingArtifacts: [] as DTO.Artifact[],
    uploadingFiles: false,
    uploadDragActive: false,
    uploadDragDepth: 0,
    uploadSelection: [] as File[],
    attachmentCommandIndex: 0,
    attachmentCommandDismissed: false,
    uploadLimits: { max_files: 100, max_bytes: 100 * 1024 * 1024 },
    fileViewer: null as DTO.FileViewer | null,
    fileViewerExpired: false,
    sharingViewedFile: false,
    libraryFiles: [] as DTO.Artifact[],
    libraryLoading: false,
    librarySearch: "",
    libraryAgentFilter: "",
    libraryAgentPickerOpen: false,
    libraryPage: 1,
    libraryPages: 1,
    libraryTotal: 0,
  };
}
