"""Admin-only job management for the built-in HR agent.

These routes are called by Pi tools, not by the browser. They authenticate with a
short-lived capability token (see app/tool_tokens.py) instead of the session
cookie, and every write goes through the job-definition rules in app/hr_rules.py.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ... import market
from ...config import Settings
from ...hr_rules import (
    blocking,
    find_duplicates,
    lint_job_definition,
    skill_name,
)
from ...resources import discover_resources
from ...skill_store import (
    SkillRoot,
    SkillStoreError,
    create_skill,
    delete_skill,
    inventory,
    locate,
    quarantine,
    read_manifest,
    skill_files,
    update_skill,
)
from ...store import PLATFORM_TOOLS, SUPPORTED_TOOLS, Store, now_iso
from ...tool_tokens import (
    AGENT_READ,
    AGENT_WRITE,
    SKILL_READ,
    SKILL_WRITE,
    TOOL_TOKEN_HEADER,
    ToolTokenError,
    resolve_tool_token_secret,
    verify_tool_token,
)
from .. import contracts

MAX_SKILL_BODY_BYTES = 64_000
MAX_SKILL_FILES = 80


class HrAgentWrite(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    instruction: str = Field(min_length=1, max_length=10000)
    description: str | None = Field(default=None, max_length=240)
    deliverable: str | None = Field(default=None, max_length=240)
    acceptance: list[str] = Field(default_factory=list, max_length=10)
    tags: list[str] = Field(default_factory=list, max_length=5)
    quickstarts: list[str] = Field(default_factory=list, max_length=5)
    tools: list[str] | None = None
    skills: list[str] = Field(default_factory=list)
    extensions: list[str] = Field(default_factory=list)
    mcp_servers: list[str] = Field(default_factory=list)
    provider: str | None = None
    model: str | None = None
    thinking_level: str | None = None
    # "new" or "variant" acknowledges an existing similar job; anything else is
    # treated as an unresolved duplicate decision.
    duplicate_decision: str | None = None
    confirm: bool = False


class HrAgentPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    instruction: str | None = Field(default=None, min_length=1, max_length=10000)
    description: str | None = Field(default=None, max_length=240)
    deliverable: str | None = Field(default=None, max_length=240)
    acceptance: list[str] | None = Field(default=None, max_length=10)
    tags: list[str] | None = Field(default=None, max_length=5)
    quickstarts: list[str] | None = Field(default=None, max_length=5)
    tools: list[str] | None = None
    skills: list[str] | None = None
    extensions: list[str] | None = None
    mcp_servers: list[str] | None = None
    confirm: bool = False


class HrSkillRef(BaseModel):
    skill: str = Field(min_length=1, max_length=200)
    confirm: bool = False


class HrSkillQuery(BaseModel):
    query: str = Field(min_length=1, max_length=400)


class HrSkillCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    description: str = Field(min_length=1, max_length=500)
    body: str = Field(min_length=1, max_length=20000)
    references: dict[str, str] = Field(default_factory=dict)
    confirm: bool = False


class HrSkillUpdate(BaseModel):
    description: str | None = Field(default=None, max_length=500)
    body: str | None = Field(default=None, max_length=20000)
    references: dict[str, str] = Field(default_factory=dict)
    remove_references: list[str] = Field(default_factory=list)
    confirm: bool = False


class HrSkillInstall(BaseModel):
    source: str = Field(min_length=1, max_length=300)
    skill: str = Field(min_length=1, max_length=200)
    confirm: bool = False


def structured_error(status_code: int, message: str, **extra: Any) -> JSONResponse:
    """Return a machine-readable error body; HTTPException flattens detail to a string."""

    return JSONResponse(status_code=status_code, content={"error": message, **extra})


def create_router(settings: Settings, store: Store) -> APIRouter:
    router = APIRouter(prefix="/api/hr", tags=["hr"])

    def catalog() -> dict:
        return discover_resources(
            settings.pi_home, settings.pi_cwd, settings.pi_agents_home
        )

    def authenticate(token: str | None, scope: str) -> dict:
        try:
            claim = verify_tool_token(
                resolve_tool_token_secret(
                    settings.tool_token_secret, settings.data_dir
                ),
                token,
                required_scope=scope,
            )
        except ToolTokenError as exc:
            raise HTTPException(401, str(exc)) from exc
        user = next(
            (item for item in store.list_users() if item.get("id") == claim["user_id"]),
            None,
        )
        if not user or user.get("role") != "admin":
            raise HTTPException(403, "Admin access required")
        return {**claim, "user": user}

    def own_agents(user: dict) -> list[dict]:
        return [
            agent
            for agent in store.list_agents()
            if agent.get("user_id") == user.get("id")
        ]

    def own_agent_or_404(agent_id: str, user: dict) -> dict:
        agent = store.get_active_agent(agent_id)
        if not agent or agent.get("user_id") != user.get("id"):
            raise HTTPException(404, "Agent not found")
        return agent

    def skill_by_ref(reference: str, resource_catalog: dict) -> dict:
        for skill in resource_catalog["skills"]:
            if reference in {skill["name"], skill["path"], skill["id"]}:
                return skill
        raise HTTPException(400, f"Unknown skill: {reference}")

    def skill_usage(resource_catalog: dict) -> dict[str, list[str]]:
        usage: dict[str, list[str]] = {}
        for agent in store.list_agents():
            for path in agent.get("skills") or []:
                usage.setdefault(skill_name(path), []).append(agent["name"])
        return usage

    def lint(payload: dict) -> list[dict[str, str]]:
        return lint_job_definition(
            description=payload.get("description"),
            instruction=payload.get("instruction") or "",
            deliverable=payload.get("deliverable"),
            acceptance=payload.get("acceptance"),
            skills=payload.get("skills"),
        )

    @router.get(
        "/agents",
        response_model=contracts.HrAgentsResponse,
        response_model_exclude_unset=True,
    )
    def list_agents(x_oma_tool_token: str | None = Header(default=None)):
        user = authenticate(x_oma_tool_token, AGENT_READ)["user"]
        return {"agents": own_agents(user)}

    @router.get(
        "/agents/{agent_id}",
        response_model=contracts.HrAgentDetail,
        response_model_exclude_unset=True,
    )
    def get_agent(agent_id: str, x_oma_tool_token: str | None = Header(default=None)):
        user = authenticate(x_oma_tool_token, AGENT_READ)["user"]
        agent = own_agent_or_404(agent_id, user)
        return {"agent": agent, "findings": lint(agent)}

    @router.post(
        "/agents/find",
        response_model=contracts.HrDuplicatesResponse,
        response_model_exclude_unset=True,
    )
    def find_agent_matches(
        payload: HrAgentWrite, x_oma_tool_token: str | None = Header(default=None)
    ):
        user = authenticate(x_oma_tool_token, AGENT_READ)["user"]
        matches = find_duplicates(payload.model_dump(), own_agents(user))
        return {"matches": matches}

    @router.post(
        "/agents",
        status_code=201,
        response_model=contracts.HrWriteResponse,
        response_model_exclude_unset=True,
    )
    def create_agent(
        payload: HrAgentWrite, x_oma_tool_token: str | None = Header(default=None)
    ):
        user = authenticate(x_oma_tool_token, AGENT_WRITE)["user"]
        if not payload.confirm:
            raise HTTPException(400, "Creating a job requires confirm=true")
        values = payload.model_dump()
        resource_catalog = catalog()
        validate_capabilities(values, resource_catalog)
        findings = lint(values)
        errors = blocking(findings)
        if errors:
            return structured_error(
                422, "Job definition failed validation", findings=errors
            )
        matches = find_duplicates(values, own_agents(user))
        if matches and values.get("duplicate_decision") not in {"new", "variant"}:
            return structured_error(409, "Similar job exists", duplicates=matches)
        if any(
            agent["name"].casefold() == payload.name.strip().casefold()
            for agent in own_agents(user)
        ):
            raise HTTPException(409, "Agent name already exists")
        agent = store.create_agent(
            payload.name,
            payload.instruction,
            payload.description,
            payload.tags,
            payload.quickstarts,
            payload.provider,
            payload.model,
            values["tools"]
            if values.get("tools") is not None
            else list(settings.pi_default_tools),
            payload.extensions or [],
            payload.skills or [],
            payload.mcp_servers or [],
            thinking_level=payload.thinking_level,
            user_id=user["id"],
            deliverable=payload.deliverable,
            acceptance=payload.acceptance,
        )
        return {"agent": agent, "findings": findings, "duplicates": matches}

    @router.patch(
        "/agents/{agent_id}",
        response_model=contracts.HrWriteResponse,
        response_model_exclude_unset=True,
    )
    def update_agent(
        agent_id: str,
        payload: HrAgentPatch,
        x_oma_tool_token: str | None = Header(default=None),
    ):
        user = authenticate(x_oma_tool_token, AGENT_WRITE)["user"]
        agent = own_agent_or_404(agent_id, user)
        if not payload.confirm:
            raise HTTPException(400, "Updating a job requires confirm=true")
        changes = payload.model_dump(exclude_unset=True)
        changes.pop("confirm", None)
        candidate = {**agent, **changes}
        validate_capabilities(candidate, catalog())
        findings = lint(candidate)
        errors = blocking(findings)
        if errors:
            return structured_error(
                422, "Job definition failed validation", findings=errors
            )
        updated = store.update_agent(agent_id, changes)
        if not updated:
            raise HTTPException(404, "Agent not found")
        return {"agent": updated, "findings": findings, "duplicates": []}

    @router.delete(
        "/agents/{agent_id}",
        response_model=contracts.DeletedAgentResponse,
        response_model_exclude_unset=True,
    )
    def delete_agent(
        agent_id: str,
        confirm: bool = False,
        x_oma_tool_token: str | None = Header(default=None),
    ):
        user = authenticate(x_oma_tool_token, AGENT_WRITE)["user"]
        own_agent_or_404(agent_id, user)
        if not confirm:
            raise HTTPException(400, "Deleting a job requires confirm=true")
        if not store.delete_agent(agent_id):
            raise HTTPException(400, "Agent does not exist or is protected")
        return {"ok": True, "id": agent_id}

    @router.get(
        "/skills",
        response_model=contracts.HrSkillsResponse,
        response_model_exclude_unset=True,
    )
    def list_skills(x_oma_tool_token: str | None = Header(default=None)):
        authenticate(x_oma_tool_token, SKILL_READ)
        resource_catalog = catalog()
        usage = skill_usage(resource_catalog)
        return {
            "skills": [
                {
                    "name": skill["name"],
                    "description": skill.get("description") or "",
                    "path": skill["path"],
                    "agents": sorted(usage.get(skill["name"], [])),
                }
                for skill in resource_catalog["skills"]
            ]
        }

    @router.post(
        "/skills/find",
        response_model=contracts.HrSkillsResponse,
        response_model_exclude_unset=True,
    )
    def find_skills(
        payload: HrSkillQuery, x_oma_tool_token: str | None = Header(default=None)
    ):
        authenticate(x_oma_tool_token, SKILL_READ)
        resource_catalog = catalog()
        usage = skill_usage(resource_catalog)
        terms = [term for term in payload.query.casefold().split() if term]
        scored: list[tuple[int, dict]] = []
        for skill in resource_catalog["skills"]:
            haystack = f"{skill['name']} {skill.get('description') or ''}".casefold()
            score = sum(1 for term in terms if term in haystack)
            if score:
                scored.append((score, skill))
        scored.sort(key=lambda item: (-item[0], item[1]["name"]))
        return {
            "skills": [
                {
                    "name": skill["name"],
                    "description": skill.get("description") or "",
                    "path": skill["path"],
                    "agents": sorted(usage.get(skill["name"], [])),
                }
                for _, skill in scored[:20]
            ]
        }

    @router.get(
        "/skills/{name}",
        response_model=contracts.HrSkillDetail,
        response_model_exclude_unset=True,
    )
    def get_skill(name: str, x_oma_tool_token: str | None = Header(default=None)):
        authenticate(x_oma_tool_token, SKILL_READ)
        resource_catalog = catalog()
        skill = skill_by_ref(name, resource_catalog)
        directory = Path(skill["path"]).resolve()
        body_file = directory / "SKILL.md"
        if not body_file.is_file():
            raise HTTPException(404, "Skill has no SKILL.md")
        if body_file.stat().st_size > MAX_SKILL_BODY_BYTES:
            raise HTTPException(413, "Skill body is too large to read")
        files = sorted(
            str(path.relative_to(directory))
            for path in directory.rglob("*")
            if path.is_file() and path != body_file
        )[:MAX_SKILL_FILES]
        usage = skill_usage(resource_catalog)
        return {
            "skill": {
                "name": skill["name"],
                "description": skill.get("description") or "",
                "path": skill["path"],
                "agents": sorted(usage.get(skill["name"], [])),
            },
            "body": body_file.read_text(encoding="utf-8", errors="replace"),
            "files": files,
        }

    @router.get(
        "/tools",
        response_model=contracts.HrToolsResponse,
        response_model_exclude_unset=True,
    )
    def list_tools(x_oma_tool_token: str | None = Header(default=None)):
        authenticate(x_oma_tool_token, AGENT_READ)
        counts: dict[str, int] = {}
        for agent in store.list_agents():
            for tool in agent.get("tools") or []:
                counts[tool] = counts.get(tool, 0) + 1
        return {
            "tools": [
                {
                    "name": name,
                    "description": "Platform tool"
                    if name in PLATFORM_TOOLS
                    else "Pi built-in tool",
                    "source": "platform" if name in PLATFORM_TOOLS else "builtin",
                    "agents": counts.get(name, 0),
                }
                for name in SUPPORTED_TOOLS
            ],
            "defaults": list(settings.pi_default_tools),
        }

    @router.post(
        "/agents/{agent_id}/skills",
        response_model=contracts.HrWriteResponse,
        response_model_exclude_unset=True,
    )
    def attach_skill(
        agent_id: str,
        payload: HrSkillRef,
        x_oma_tool_token: str | None = Header(default=None),
    ):
        user = authenticate(x_oma_tool_token, AGENT_WRITE)["user"]
        agent = own_agent_or_404(agent_id, user)
        if not payload.confirm:
            raise HTTPException(400, "Changing a job's skills requires confirm=true")
        skill = skill_by_ref(payload.skill, catalog())
        skills = list(agent.get("skills") or [])
        if skill["path"] not in skills:
            skills.append(skill["path"])
        updated = store.update_agent(agent_id, {"skills": skills})
        if not updated:
            raise HTTPException(404, "Agent not found")
        return {"agent": updated, "findings": lint(updated), "duplicates": []}

    @router.delete(
        "/agents/{agent_id}/skills/{name}",
        response_model=contracts.HrWriteResponse,
        response_model_exclude_unset=True,
    )
    def detach_skill(
        agent_id: str,
        name: str,
        confirm: bool = False,
        x_oma_tool_token: str | None = Header(default=None),
    ):
        user = authenticate(x_oma_tool_token, AGENT_WRITE)["user"]
        agent = own_agent_or_404(agent_id, user)
        if not confirm:
            raise HTTPException(400, "Changing a job's skills requires confirm=true")
        skills = [
            path for path in agent.get("skills") or [] if skill_name(path) != name
        ]
        updated = store.update_agent(agent_id, {"skills": skills})
        if not updated:
            raise HTTPException(404, "Agent not found")
        return {"agent": updated, "findings": lint(updated), "duplicates": []}

    def skill_root() -> SkillRoot:
        return SkillRoot.from_agents_home(settings.pi_agents_home)

    def skill_response(name: str) -> dict:
        resource_catalog = catalog()
        skill = skill_by_ref(name, resource_catalog)
        directory = Path(skill["path"]).resolve()
        usage = skill_usage(resource_catalog)
        return {
            "skill": {
                "name": skill["name"],
                "description": skill.get("description") or "",
                "path": skill["path"],
                "agents": sorted(usage.get(skill["name"], [])),
            },
            "body": (directory / "SKILL.md").read_text(
                encoding="utf-8", errors="replace"
            ),
            "files": skill_files(directory),
        }

    def attached_jobs(name: str) -> list[str]:
        return [
            agent["name"]
            for agent in store.list_agents()
            if name in {skill_name(path) for path in agent.get("skills") or []}
        ]

    @router.post(
        "/skills",
        status_code=201,
        response_model=contracts.HrSkillDetail,
        response_model_exclude_unset=True,
    )
    def create_skill_endpoint(
        payload: HrSkillCreate, x_oma_tool_token: str | None = Header(default=None)
    ):
        authenticate(x_oma_tool_token, SKILL_WRITE)
        if not payload.confirm:
            raise HTTPException(400, "Creating a skill requires confirm=true")
        if any(item["name"] == payload.name for item in catalog()["skills"]):
            raise HTTPException(409, f"Skill {payload.name} already exists")
        try:
            create_skill(
                skill_root(),
                payload.name,
                payload.description,
                payload.body,
                references=payload.references,
                timestamp=now_iso(),
            )
        except SkillStoreError as exc:
            raise HTTPException(400, str(exc)) from exc
        return skill_response(payload.name)

    @router.patch(
        "/skills/{name}",
        response_model=contracts.HrSkillDetail,
        response_model_exclude_unset=True,
    )
    def update_skill_endpoint(
        name: str,
        payload: HrSkillUpdate,
        x_oma_tool_token: str | None = Header(default=None),
    ):
        authenticate(x_oma_tool_token, SKILL_WRITE)
        if not payload.confirm:
            raise HTTPException(400, "Updating a skill requires confirm=true")
        if (
            payload.description is None
            and payload.body is None
            and not payload.references
            and not payload.remove_references
        ):
            raise HTTPException(400, "Nothing to update")
        try:
            update_skill(
                skill_root(),
                name,
                description=payload.description,
                body=payload.body,
                references=payload.references,
                remove_references=payload.remove_references,
                timestamp=now_iso(),
            )
        except SkillStoreError as exc:
            raise HTTPException(400, str(exc)) from exc
        return skill_response(name)

    def extra_skill_roots() -> list[Path]:
        return [Path(settings.pi_home).expanduser() / "skills"]

    @router.delete(
        "/skills/{name}",
        response_model=contracts.HrSkillDeleteResponse,
        response_model_exclude_unset=True,
    )
    def delete_skill_endpoint(
        name: str,
        confirm: bool = False,
        force: bool = False,
        x_oma_tool_token: str | None = Header(default=None),
    ):
        """Delete a platform skill, or quarantine an operator-installed one.

        An unmanaged directory (no manifest) is never destroyed silently: without
        `force` the response carries its file inventory so the operator can review
        exactly what would move, and `force` only relocates it to the data
        directory's skill-trash folder.
        """

        authenticate(x_oma_tool_token, SKILL_WRITE)
        if not confirm:
            raise HTTPException(400, "Deleting a skill requires confirm=true")
        jobs = attached_jobs(name)
        if jobs:
            raise HTTPException(
                409, f"Skill {name} is still attached to: {', '.join(sorted(jobs))}"
            )
        root = skill_root()
        directory = locate(root, name, extra_skill_roots())
        if directory is None:
            raise HTTPException(404, f"Skill {name} is not installed")
        if read_manifest(directory) is None:
            files = inventory(directory)
            if not force:
                return structured_error(
                    409,
                    f"Skill {name} is not managed by the platform",
                    unmanaged=True,
                    root=str(directory.parent),
                    files=files,
                )
            target = quarantine(directory, settings.data_dir / "skill-trash", now_iso())
            return {
                "ok": True,
                "deleted": name,
                "quarantined_to": str(target),
            }
        if directory.parent != root.skills_dir.resolve():
            raise HTTPException(
                400, f"Skill {name} is managed but not in the shared skills root"
            )
        try:
            delete_skill(root, name)
        except SkillStoreError as exc:
            raise HTTPException(400, str(exc)) from exc
        return {"ok": True, "deleted": name}

    @router.post(
        "/skills/install",
        response_model=contracts.HrSkillDetail,
        response_model_exclude_unset=True,
    )
    async def install_skill_endpoint(
        payload: HrSkillInstall, x_oma_tool_token: str | None = Header(default=None)
    ):
        authenticate(x_oma_tool_token, SKILL_WRITE)
        if not payload.confirm:
            raise HTTPException(400, "Installing a skill requires confirm=true")
        if any(item["name"] == payload.skill for item in catalog()["skills"]):
            raise HTTPException(409, f"Skill {payload.skill} is already installed")
        try:
            market.validate_skill_source(payload.source, payload.skill)
            await market.install_skill(payload.source, payload.skill)
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from exc
        except TimeoutError as exc:
            raise HTTPException(504, str(exc)) from exc
        except RuntimeError as exc:
            raise HTTPException(502, f"skill install failed: {exc}") from exc
        return skill_response(payload.skill)

    @router.post(
        "/skills/uninstall",
        response_model=contracts.OkResponse,
        response_model_exclude_unset=True,
    )
    async def uninstall_skill_endpoint(
        payload: HrSkillInstall, x_oma_tool_token: str | None = Header(default=None)
    ):
        authenticate(x_oma_tool_token, SKILL_WRITE)
        if not payload.confirm:
            raise HTTPException(400, "Uninstalling a skill requires confirm=true")
        jobs = attached_jobs(payload.skill)
        if jobs:
            raise HTTPException(
                409,
                f"Skill {payload.skill} is still attached to: {', '.join(sorted(jobs))}",
            )
        try:
            await market.uninstall_skill(payload.source or None, payload.skill)
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from exc
        except TimeoutError as exc:
            raise HTTPException(504, str(exc)) from exc
        except RuntimeError as exc:
            raise HTTPException(502, f"skill uninstall failed: {exc}") from exc
        return {"ok": True}

    @router.get(
        "/market",
        response_model=contracts.HrMarketResponse,
        response_model_exclude_unset=True,
    )
    def list_market(
        type: str | None = None,
        query: str | None = None,
        x_oma_tool_token: str | None = Header(default=None),
    ):
        """List published agents plus the installed skill, MCP and extension catalogues."""

        authenticate(x_oma_tool_token, AGENT_READ)
        wanted = (type or "").strip().lower()
        needle = (query or "").strip().casefold()
        resource_catalog = catalog()
        items: list[dict] = []
        if wanted in {"", "agents", "agent"}:
            for publication in store.list_agent_publications():
                latest = publication["latest"]
                items.append(
                    {
                        "type": "agent",
                        "id": publication["id"],
                        "name": publication["name"],
                        "description": publication.get("description"),
                        "detail": f"latest {latest['version']} · {publication.get('install_count', 0)} installs",
                    }
                )
        for kind, key, label in (
            ("skills", "skills", "skill"),
            ("mcp", "mcp_servers", "mcp"),
            ("extensions", "extensions", "extension"),
        ):
            if wanted not in {"", kind, label}:
                continue
            for item in resource_catalog[key]:
                items.append(
                    {
                        "type": label,
                        "id": item.get("id") or item.get("path") or item["name"],
                        "name": item["name"],
                        "description": item.get("description"),
                        "detail": item.get("source")
                        or item.get("author")
                        or item.get("path"),
                    }
                )
        if needle:
            items = [
                item
                for item in items
                if needle
                in f"{item['name']} {item.get('description') or ''}".casefold()
            ]
        return {"items": items}

    @router.post(
        "/market/agents/{agent_id}/publish",
        response_model=contracts.HrMarketResponse,
        response_model_exclude_unset=True,
    )
    def publish_market_agent(
        agent_id: str,
        payload: contracts.HrPublishRequest,
        x_oma_tool_token: str | None = Header(default=None),
    ):
        user = authenticate(x_oma_tool_token, AGENT_WRITE)["user"]
        agent = own_agent_or_404(agent_id, user)
        if not payload.confirm:
            raise HTTPException(400, "Publishing a job requires confirm=true")
        version = (
            payload.version
            if payload.version.startswith("v")
            else f"v{payload.version}"
        )
        publication = next(
            (
                item
                for item in store.list_agent_publications()
                if item["source_agent_id"] == agent_id
            ),
            None,
        )
        if publication and store.has_agent_publication_version(
            publication["id"], version
        ):
            raise HTTPException(409, f"Agent version {version} already exists")
        published = store.publish_agent(agent, user["id"], version)
        return {
            "items": [
                {
                    "type": "agent",
                    "id": published["id"],
                    "name": published["name"],
                    "description": published.get("description"),
                    "detail": f"published {version}",
                }
            ]
        }

    @router.delete(
        "/market/agents/{publication_id}",
        response_model=contracts.HrSkillDeleteResponse,
        response_model_exclude_unset=True,
    )
    def unpublish_market_agent(
        publication_id: str,
        confirm: bool = False,
        x_oma_tool_token: str | None = Header(default=None),
    ):
        authenticate(x_oma_tool_token, AGENT_WRITE)
        if not confirm:
            raise HTTPException(400, "Unpublishing a job requires confirm=true")
        publication = store.get_agent_publication(publication_id)
        if not publication:
            raise HTTPException(404, "Published Agent not found")
        if not store.delete_agent_publication(publication_id):
            raise HTTPException(404, "Published Agent not found")
        return {"ok": True, "deleted": str(publication.get("name") or publication_id)}

    @router.post(
        "/market/agents/{publication_id}/install",
        status_code=201,
        response_model=contracts.HrAgentsResponse,
        response_model_exclude_unset=True,
    )
    def install_market_agent(
        publication_id: str,
        payload: contracts.HrInstallRequest,
        x_oma_tool_token: str | None = Header(default=None),
    ):
        user = authenticate(x_oma_tool_token, AGENT_WRITE)["user"]
        if not payload.confirm:
            raise HTTPException(400, "Installing a job requires confirm=true")
        publication = store.get_agent_publication(publication_id)
        if not publication:
            raise HTTPException(404, "Published Agent not found")
        version = payload.version
        if version and not version.startswith("v"):
            version = f"v{version}"
        installed = store.install_agent_publication(publication_id, user["id"], version)
        if not installed:
            raise HTTPException(404, "Published Agent version not found")
        return {"agents": [installed]}

    return router


def validate_capabilities(values: dict[str, Any], resource_catalog: dict) -> None:
    tools = values.get("tools") or []
    if any(tool not in SUPPORTED_TOOLS for tool in tools):
        raise HTTPException(400, "Unsupported tool")
    allowed_extensions = {item["path"] for item in resource_catalog["extensions"]}
    allowed_skills = {item["path"] for item in resource_catalog["skills"]}
    allowed_servers = {item["id"] for item in resource_catalog["mcp_servers"]}
    if any(path not in allowed_extensions for path in values.get("extensions") or []):
        raise HTTPException(400, "Unsupported extension path")
    if any(path not in allowed_skills for path in values.get("skills") or []):
        raise HTTPException(400, "Unsupported skill path")
    if any(name not in allowed_servers for name in values.get("mcp_servers") or []):
        raise HTTPException(400, "Unsupported MCP server")
    if len(set(tools)) != len(tools):
        raise HTTPException(400, "Duplicate tool selection")


__all__ = ["TOOL_TOKEN_HEADER", "create_router", "validate_capabilities"]
