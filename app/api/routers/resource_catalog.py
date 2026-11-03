from fastapi import APIRouter, Request

from ...config import Settings
from ...resources import discover_resources
from ...store import HR_TOOLS, IMAGE_TOOLS, SUPPORTED_TOOLS, WEB_TOOLS
from .. import contracts


def catalog_response(settings: Settings, *, include_job_tools: bool = True) -> dict:
    catalog = discover_resources(
        settings.pi_home, settings.pi_cwd, settings.pi_agents_home
    )
    catalog["default_provider"] = settings.pi_provider
    catalog["default_model"] = settings.pi_model
    catalog["default_tools"] = list(settings.pi_default_tools)
    tool_names = (
        SUPPORTED_TOOLS
        if include_job_tools
        else [name for name in SUPPORTED_TOOLS if name not in HR_TOOLS]
    )
    catalog["tools"] = [
        {
            "name": name,
            "description": "Platform job tool"
            if name in HR_TOOLS
            else "Platform image tool"
            if name in IMAGE_TOOLS
            else "Platform web tool"
            if name in WEB_TOOLS
            else "Pi built-in tool",
            "source": "platform"
            if name in HR_TOOLS + IMAGE_TOOLS + WEB_TOOLS
            else "builtin",
        }
        for name in tool_names
    ]
    catalog["default_extensions"] = list(settings.pi_default_extensions)
    catalog["default_skills"] = list(settings.pi_default_skills)
    catalog["default_mcp_servers"] = list(settings.pi_default_mcp_servers)
    catalog["mode"] = settings.mode
    catalog["default_thinking_level"] = settings.pi_thinking_level
    return catalog


def create_router(settings: Settings) -> APIRouter:
    router = APIRouter(prefix="/api", tags=["resources"])

    @router.get(
        "/resources",
        response_model=contracts.ResourcesResponse,
        response_model_exclude_unset=True,
    )
    async def list_resources(request: Request):
        user = request.state.user
        return catalog_response(
            settings, include_job_tools=bool(user and user.get("role") == "admin")
        )

    return router
