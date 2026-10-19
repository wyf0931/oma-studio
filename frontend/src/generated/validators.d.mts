import type { components } from "./api";
export declare function validateAgentDraftResponse(
  value: unknown,
): value is components["schemas"]["AgentDraftResponse"];
export declare function validateAgentResponse(value: unknown): value is components["schemas"]["AgentResponse"];
export declare function validateAgentResultResponse(
  value: unknown,
): value is components["schemas"]["AgentResultResponse"];
export declare function validateAgentsResponse(value: unknown): value is components["schemas"]["AgentsResponse"];
export declare function validateArtifactShareResponse(
  value: unknown,
): value is components["schemas"]["ArtifactShareResponse"];
export declare function validateAutopilotResponse(value: unknown): value is components["schemas"]["AutopilotResponse"];
export declare function validateAutopilotsResponse(
  value: unknown,
): value is components["schemas"]["AutopilotsResponse"];
export declare function validateChatResponse(value: unknown): value is components["schemas"]["ChatResponse"];
export declare function validateChatsResponse(value: unknown): value is components["schemas"]["ChatsResponse"];
export declare function validateContentResponse(value: unknown): value is components["schemas"]["ContentResponse"];
export declare function validateDeletedAgentResponse(
  value: unknown,
): value is components["schemas"]["DeletedAgentResponse"];
export declare function validateDeletedChatResponse(
  value: unknown,
): value is components["schemas"]["DeletedChatResponse"];
export declare function validateDeletedShareResponse(
  value: unknown,
): value is components["schemas"]["DeletedShareResponse"];
export declare function validateExtensionResultResponse(
  value: unknown,
): value is components["schemas"]["ExtensionResultResponse"];
export declare function validateFilesResponse(value: unknown): value is components["schemas"]["FilesResponse"];
export declare function validateHealthResponse(value: unknown): value is components["schemas"]["HealthResponse"];
export declare function validateLibraryResponse(value: unknown): value is components["schemas"]["LibraryResponse"];
export declare function validateMcpAddedResponse(value: unknown): value is components["schemas"]["McpAddedResponse"];
export declare function validateMcpRemovedResponse(
  value: unknown,
): value is components["schemas"]["McpRemovedResponse"];
export declare function validateMessagesResponse(value: unknown): value is components["schemas"]["MessagesResponse"];
export declare function validateOkResponse(value: unknown): value is components["schemas"]["OkResponse"];
export declare function validatePiMessage(value: unknown): value is components["schemas"]["PiMessage"];
export declare function validateQueuedResponse(value: unknown): value is components["schemas"]["QueuedResponse"];
export declare function validateResourcesResponse(value: unknown): value is components["schemas"]["ResourcesResponse"];
export declare function validateRunsResponse(value: unknown): value is components["schemas"]["RunsResponse"];
export declare function validateSessionResponse(value: unknown): value is components["schemas"]["SessionResponse"];
export declare function validateSettingsResponse(value: unknown): value is components["schemas"]["SettingsResponse"];
export declare function validateShareLinkResponse(value: unknown): value is components["schemas"]["ShareLinkResponse"];
export declare function validateSharedChatResponse(
  value: unknown,
): value is components["schemas"]["SharedChatResponse"];
export declare function validateSharesResponse(value: unknown): value is components["schemas"]["SharesResponse"];
export declare function validateSkillInstallResponse(
  value: unknown,
): value is components["schemas"]["SkillInstallResponse"];
export declare function validateSkillSearchResponse(
  value: unknown,
): value is components["schemas"]["SkillSearchResponse"];
export declare function validateStreamEnvelope(value: unknown): value is components["schemas"]["StreamEnvelope"];
export declare function validateUploadResponse(value: unknown): value is components["schemas"]["UploadResponse"];
export declare function validateUploadsResponse(value: unknown): value is components["schemas"]["UploadsResponse"];
export declare function validateUsageResponse(value: unknown): value is components["schemas"]["UsageResponse"];
export declare function validateUserResponse(value: unknown): value is components["schemas"]["UserResponse"];
export declare function validateUsersResponse(value: unknown): value is components["schemas"]["UsersResponse"];
export declare const responseValidators: Readonly<Record<string, ((value: unknown) => boolean) | undefined>>;
