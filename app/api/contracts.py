"""HTTP wire models. Pi transcript fields remain extensible and are never persisted here."""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, JsonValue, RootModel
from starlette.responses import StreamingResponse


class OkResponse(BaseModel):
    ok: bool


class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    status: str
    created_at: str
    email: str | None = None
    nickname: str | None = None
    last_login_at: str | None = None


class SessionResponse(BaseModel):
    user: UserResponse | None


class UsersResponse(BaseModel):
    users: list[UserResponse]


class AgentResponse(BaseModel):
    id: str
    name: str
    instruction: str
    tags: list[str]
    quickstarts: list[str]
    tools: list[str]
    extensions: list[str]
    skills: list[str]
    mcp_servers: list[str]
    description: str | None = None
    provider: str | None = None
    model: str | None = None
    thinking_level: str | None = None
    user_id: str | None = None
    avatar_path: str | None = None
    protected: bool = False
    tools_configured: bool = True
    created_at: str | None = None
    updated_at: str | None = None
    deleted_at: str | None = None
    content_hash: str | None = None
    source_publication_id: str | None = None
    source_version: str | None = None
    source_hash: str | None = None
    marketplace_latest_version: str | None = None
    marketplace_update_available: bool = False
    # Marketplace views share the profile fields but omit private ownership/configuration.
    version: str | None = None
    author: str | None = None
    install_count: int = 0
    source_agent_id: str | None = None
    avatar_available: bool = False
    installation_status: str | None = None
    installed_agent_ids: list[str] = Field(default_factory=list)


class AgentsResponse(BaseModel):
    agents: list[AgentResponse]


class AgentResultResponse(BaseModel):
    agent: AgentResponse


class AgentDraftResponse(BaseModel):
    instruction: str
    description: str
    tags: list[str]
    quickstarts: list[str]


class DeletedAgentResponse(OkResponse):
    id: str


class ChatResponse(BaseModel):
    id: str
    session_id: str
    agent_id: str
    title: str
    status: str
    created_at: str
    updated_at: str
    last_activity_at: str
    user_id: str | None = None


class ChatsResponse(BaseModel):
    chats: list[ChatResponse]


class DeletedChatResponse(OkResponse):
    deleted_files: list[str]
    deleted_sessions: list[str]


class PiContent(BaseModel):
    model_config = ConfigDict(extra="allow")
    type: str
    text: str | None = None
    thinking: str | None = None
    id: str | None = None
    name: str | None = None
    arguments: JsonValue = None
    webResult: dict[str, JsonValue] | None = None


class PiMessage(BaseModel):
    model_config = ConfigDict(extra="allow")
    role: str
    content: list[PiContent] | str | None = None
    id: str | None = None
    stopReason: str | None = None
    timestamp: str | int | float | None = None
    usage: dict[str, JsonValue] | None = None
    details: dict[str, JsonValue] | None = None
    toolName: str | None = None
    toolCallId: str | None = None
    display_content: str | None = None
    skill_invocation: dict[str, JsonValue] | None = Field(
        default=None, alias="_skill_invocation"
    )
    attachments: list[dict[str, JsonValue]] | None = Field(
        default=None, alias="_attachments"
    )


class MessagesResponse(BaseModel):
    messages: list[PiMessage]


class ArtifactResponse(BaseModel):
    id: str
    name: str
    path: str
    size: int
    extension: str
    generated_at: str | None
    updated_at: str | None = None
    created_at: str | None = None
    chat_id: str | None = None
    agent_id: str | None = None
    agent_name: str | None = None
    media_type: str | None = None
    kind: str | None = None


class UploadResponse(BaseModel):
    id: str
    filename: str
    path: str
    media_type: str
    size: int
    chat_id: str
    created_at: str
    user_id: str | None = None
    sha256: str | None = None


class UploadsResponse(BaseModel):
    uploads: list[UploadResponse]


class FilesResponse(BaseModel):
    files: list[ArtifactResponse]


class LibraryResponse(FilesResponse):
    total: int
    page: int
    page_size: int
    pages: int


class ContentResponse(BaseModel):
    content: str


class ShareLinkResponse(BaseModel):
    token: str
    url: str
    existing: bool | None = None


class ArtifactShareResponse(ShareLinkResponse):
    path: str
    artifact_type: str


class ShareRecordResponse(BaseModel):
    token: str
    chat_id: str
    title: str
    created_at: str
    kind: Literal["session", "artifact"]
    url: str
    artifact_type: str | None = None
    path: str | None = None


class SharesResponse(BaseModel):
    shares: list[ShareRecordResponse]


class DeletedShareResponse(OkResponse):
    token: str


class SharedChatInfo(BaseModel):
    title: str | None
    created_at: str | None
    updated_at: str | None
    agent_id: str | None


class SharedChatResponse(MessagesResponse):
    chat: SharedChatInfo
    can_manage: bool


class AutopilotResponse(BaseModel):
    id: str
    name: str
    instruction: str
    agent_id: str
    cron: str
    enabled: bool
    created_at: str
    updated_at: str
    agent_name: str
    status: str
    next_run_at: str | None
    user_id: str | None = None
    starts_at: str | None = None
    ends_at: str | None = None
    last_run_at: str | None = None


class AutopilotsResponse(BaseModel):
    autopilots: list[AutopilotResponse]


class AutopilotRunResponse(BaseModel):
    id: str
    autopilot_id: str
    chat_id: str
    session_id: str
    status: str
    started_at: str
    user_id: str | None = None
    finished_at: str | None = None
    duration_ms: int | None = None
    error: str | None = None


class RunsResponse(BaseModel):
    runs: list[AutopilotRunResponse]


class QueuedResponse(OkResponse):
    status: Literal["queued"]


class ResourceResponse(BaseModel):
    id: str
    name: str
    description: str
    path: str
    type: str
    source: str | None = None
    author: str | None = None


class ModelResponse(BaseModel):
    id: str
    name: str
    thinking_levels: list[str]


class ProviderResponse(BaseModel):
    id: str
    name: str
    models: list[ModelResponse]


class ToolResponse(BaseModel):
    name: str
    description: str
    source: str


class ResourcesResponse(BaseModel):
    extensions: list[ResourceResponse]
    skills: list[ResourceResponse]
    mcp_servers: list[ResourceResponse]
    providers: list[ProviderResponse]
    tools: list[ToolResponse]
    default_tools: list[str]
    default_extensions: list[str]
    default_skills: list[str]
    default_mcp_servers: list[str]
    mode: str
    default_thinking_level: str


class SkillResultResponse(BaseModel):
    repo: str
    skill: str
    installs: str
    url: str
    owner: str | None = None


class SkillSearchResponse(BaseModel):
    results: list[SkillResultResponse]


class SkillInstallResponse(BaseModel):
    skill: str
    resources: ResourcesResponse


class ExtensionResultResponse(BaseModel):
    package: str
    resources: ResourcesResponse


class McpAddedResponse(BaseModel):
    servers: list[str]
    resources: ResourcesResponse


class McpRemovedResponse(BaseModel):
    name: str
    resources: ResourcesResponse


class SettingsResponse(BaseModel):
    timezone: str


class UploadLimits(BaseModel):
    max_files: int
    max_bytes: int


class HealthResponse(OkResponse):
    active_processes: int
    upload_limits: UploadLimits


class UsageMetrics(BaseModel):
    input_tokens: int
    output_tokens: int
    cached_tokens: int
    tool_calls: int
    search_calls: int
    fetch_calls: int
    cost: float


class UsageSummary(UsageMetrics):
    sessions: int


class DailyUsage(UsageSummary):
    date: str


class SessionUsage(UsageMetrics):
    id: str
    session_id: str
    title: str
    created_at: str | None
    agent_id: str | None
    agent_name: str
    user_id: str | None
    username: str


class UserUsage(UsageSummary):
    user_id: str | None
    username: str


class AgentUsage(UsageSummary):
    agent_id: str | None
    agent_name: str


class UsageRange(BaseModel):
    days: int
    from_date: str = Field(alias="from")
    to: str


class UsageResponse(BaseModel):
    range: UsageRange
    summary: UsageSummary
    daily: list[DailyUsage]
    sessions: list[SessionUsage]
    users: list[UserUsage]
    agents: list[AgentUsage]


class ValidationIssue(BaseModel):
    type: str
    loc: list[str | int]
    msg: str


class ErrorResponse(BaseModel):
    detail: str | list[ValidationIssue]
    code: str
    params: dict[str, JsonValue]


class DeltaEvent(BaseModel):
    type: Literal["delta", "thinking_delta"]
    delta: str


class MessageEndEvent(BaseModel):
    type: Literal["assistant_message_end"]
    message: PiMessage | None = None


class FinalEvent(BaseModel):
    type: Literal["final"]
    text: str


class ToolEvent(BaseModel):
    model_config = ConfigDict(extra="allow")
    type: Literal["tool"]


class ErrorEvent(BaseModel):
    type: Literal["error"]
    error: str


class CompleteEvent(BaseModel):
    type: Literal["complete"]
    chat: ChatResponse
    assistant: str | None = None
    messages: list[PiMessage] = Field(default_factory=list)
    tools: list[dict[str, JsonValue]] = Field(default_factory=list)


class StreamEnvelope(
    RootModel[
        Annotated[
            DeltaEvent
            | MessageEndEvent
            | FinalEvent
            | ToolEvent
            | ErrorEvent
            | CompleteEvent,
            Field(discriminator="type"),
        ]
    ]
):
    """Document the stream wire contract; Pi events remain transient."""


class EventStreamResponse(StreamingResponse):
    media_type = "text/event-stream"


def error_responses() -> dict:
    return {
        status: {"model": ErrorResponse}
        for status in (400, 401, 403, 404, 409, 413, 415, 422, 429, 500, 502, 503, 504)
    }
