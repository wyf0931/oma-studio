import json
from pathlib import Path

from app.config import get_settings
from app.resources import (
    discover_models,
    discover_resources,
    resolve_extension_path,
)


def test_discovers_pi_model_catalog(tmp_path: Path):
    (tmp_path / "models.json").write_text(
        json.dumps(
            {
                "providers": {
                    "example": {
                        "name": "Example Provider",
                        "models": [
                            {
                                "id": "example-fast",
                                "name": "Example Fast",
                                "reasoning": True,
                            },
                            {"id": "example-id-only"},
                        ],
                    },
                    "empty": {"models": []},
                }
            }
        ),
        encoding="utf-8",
    )

    assert discover_models(tmp_path) == [
        {
            "id": "example",
            "name": "Example Provider",
            "models": [
                {
                    "id": "example-fast",
                    "name": "Example Fast",
                    "thinking_levels": [
                        "minimal",
                        "low",
                        "medium",
                        "high",
                        "xhigh",
                        "max",
                    ],
                },
                {
                    "id": "example-id-only",
                    "name": "example-id-only",
                    "thinking_levels": ["off"],
                },
            ],
        }
    ]


def test_empty_thinking_map_uses_reasoning_levels_for_pi_auto_adaptation(
    tmp_path: Path,
):
    (tmp_path / "models.json").write_text(
        json.dumps(
            {
                "providers": {
                    "deepseek": {
                        "models": [
                            {
                                "id": "deepseek-flash",
                                "reasoning": True,
                                "thinkingLevelMap": {},
                            }
                        ]
                    }
                }
            }
        ),
        encoding="utf-8",
    )

    levels = discover_models(tmp_path)[0]["models"][0]["thinking_levels"]
    assert levels == ["minimal", "low", "medium", "high", "xhigh", "max"]


def test_reads_agent_defaults_from_dotenv(tmp_path: Path, monkeypatch):
    (tmp_path / ".env").write_text(
        "PI_DEFAULT_TOOLS=read,write\nPI_DEFAULT_EXTENSIONS=pi-mcp-adapter\n"
        "PI_DEFAULT_SKILLS=human-writing\nPI_DEFAULT_MCP_SERVERS=browser\n",
        encoding="utf-8",
    )
    monkeypatch.chdir(tmp_path)
    for name in (
        "PI_DEFAULT_TOOLS",
        "PI_DEFAULT_EXTENSIONS",
        "PI_DEFAULT_SKILLS",
        "PI_DEFAULT_MCP_SERVERS",
    ):
        monkeypatch.delenv(name, raising=False)

    settings = get_settings()

    assert settings.pi_default_tools == ("read", "write")
    assert settings.pi_default_extensions == ("pi-mcp-adapter",)
    assert settings.pi_default_skills == ("human-writing",)
    assert settings.pi_default_mcp_servers == ("browser",)


def test_reads_upload_limits_from_dotenv(tmp_path: Path, monkeypatch):
    (tmp_path / ".env").write_text(
        "OMA_MAX_UPLOAD_FILES=12\nOMA_MAX_UPLOAD_MB=64\n", encoding="utf-8"
    )
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("OMA_MAX_UPLOAD_FILES", raising=False)
    monkeypatch.delenv("OMA_MAX_UPLOAD_MB", raising=False)

    settings = get_settings()

    assert settings.max_upload_files == 12
    assert settings.max_upload_bytes == 64 * 1024 * 1024


def test_storage_paths_expand_home(tmp_path: Path, monkeypatch):
    (tmp_path / ".env").write_text(
        "PI_PLATFORM_DATA_DIR=~/.oma-studio/data\n"
        "PI_SESSION_DIR=~/.oma-studio/data/pi-sessions\n"
        "PI_CWD=~/.oma-studio/workspace\n",
        encoding="utf-8",
    )
    monkeypatch.chdir(tmp_path)
    for name in ("PI_PLATFORM_DATA_DIR", "PI_SESSION_DIR", "PI_CWD"):
        monkeypatch.delenv(name, raising=False)

    settings = get_settings()

    home = Path.home()
    assert settings.data_dir == home / ".oma-studio" / "data"
    assert settings.pi_session_dir == home / ".oma-studio" / "data" / "pi-sessions"
    assert settings.pi_cwd == home / ".oma-studio" / "workspace"


def test_sensenova_watermark_defaults_to_false(tmp_path: Path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("SENSENOVA_WATERMARK", raising=False)

    assert get_settings().sensenova_watermark is False


def test_agent_neutral_skills_path_uses_host_setting(tmp_path: Path, monkeypatch):
    agents_home = tmp_path / ".agents"
    (tmp_path / ".env").write_text(
        f"PI_HOST_AGENTS_HOME={agents_home}\n", encoding="utf-8"
    )
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("PI_AGENTS_HOME", raising=False)
    monkeypatch.delenv("PI_HOST_AGENTS_HOME", raising=False)

    assert get_settings().pi_agents_home == agents_home


def test_skill_discovery_includes_skills_cli_source(tmp_path: Path):
    pi_home = tmp_path / ".pi" / "agent"
    skill_dir = pi_home / "skills" / "human-writing"
    skill_dir.mkdir(parents=True)
    (skill_dir / "SKILL.md").write_text(
        "---\nname: human-writing\ndescription: Writing helper\n---\n",
        encoding="utf-8",
    )
    lock_path = tmp_path / ".agents" / ".skill-lock.json"
    lock_path.parent.mkdir()
    lock_path.write_text(
        json.dumps(
            {
                "skills": {
                    "human-writing": {
                        "source": "owner/writing-skills",
                        "skillPath": "skills/human-writing/SKILL.md",
                    }
                }
            }
        ),
        encoding="utf-8",
    )

    skills = discover_resources(pi_home, tmp_path / "workspace")["skills"]
    assert skills[0]["source"] == "owner/writing-skills"
    assert skills[0]["author"] == "owner"


def test_skill_discovery_includes_agent_neutral_skills(tmp_path: Path):
    pi_home = tmp_path / ".pi" / "agent"
    agents_home = tmp_path / ".agents"
    skill_dir = agents_home / "skills" / "shared-skill"
    skill_dir.mkdir(parents=True)
    (skill_dir / "SKILL.md").write_text(
        "---\nname: shared-skill\ndescription: Shared helper\n---\n",
        encoding="utf-8",
    )

    skills = discover_resources(pi_home, tmp_path / "workspace", agents_home)["skills"]
    assert skills[0]["path"] == str(skill_dir)


def test_resource_metadata_includes_package_author(tmp_path: Path):
    pi_home = tmp_path / ".pi" / "agent"
    package_dir = pi_home / "npm" / "node_modules" / "example-extension"
    package_dir.mkdir(parents=True)
    (package_dir / "package.json").write_text(
        json.dumps(
            {
                "name": "example-extension",
                "author": {"name": "Example Author"},
                "pi": {"extensions": ["./index.ts"]},
            }
        ),
        encoding="utf-8",
    )
    (package_dir / "index.ts").write_text("export default {}", encoding="utf-8")

    extensions = discover_resources(pi_home, tmp_path / "workspace")["extensions"]
    assert extensions[0]["author"] == "Example Author"


def _package(tmp_path: Path, name: str, declared: list[str], entries: list[str]):
    package_dir = tmp_path / "npm" / "node_modules" / name
    package_dir.mkdir(parents=True)
    (package_dir / "package.json").write_text(
        json.dumps({"name": name, "pi": {"extensions": declared}}),
        encoding="utf-8",
    )
    for entry in entries:
        path = package_dir / entry
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("export default {}", encoding="utf-8")
    return package_dir


def test_resolve_extension_path_heals_renamed_package_entry(tmp_path: Path):
    # pi-subagents 0.70.0 ships compiled index.js, so a saved index.ts path goes stale.
    package_dir = _package(tmp_path, "pi-subagents", ["./index.js"], ["index.js"])

    assert resolve_extension_path(str(package_dir / "index.ts")) == str(
        package_dir / "index.js"
    )


def test_resolve_extension_path_prefers_the_declared_entry(tmp_path: Path):
    package_dir = _package(
        tmp_path,
        "example-extension",
        ["./dist/entry.js"],
        ["index.ts", "dist/entry.js"],
    )

    assert resolve_extension_path(str(package_dir / "legacy.ts")) == str(
        package_dir / "dist" / "entry.js"
    )


def test_resolve_extension_path_keeps_existing_and_unknown_paths(tmp_path: Path):
    package_dir = _package(tmp_path, "example-extension", [], ["index.ts"])
    existing = str(package_dir / "index.ts")
    assert resolve_extension_path(existing) == existing

    unknown = str(tmp_path / "npm" / "node_modules" / "gone" / "index.ts")
    assert resolve_extension_path(unknown) == unknown


def test_resolve_extension_path_handles_directory_extensions(tmp_path: Path):
    extension_dir = tmp_path / "extensions" / "local-extension"
    extension_dir.mkdir(parents=True)
    (extension_dir / "index.js").write_text("export default {}", encoding="utf-8")

    # An existing extension directory is passed to Pi as-is.
    assert resolve_extension_path(str(extension_dir)) == str(extension_dir)
    assert resolve_extension_path(str(extension_dir / "index.ts")) == str(
        extension_dir / "index.js"
    )
