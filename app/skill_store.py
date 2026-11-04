"""Author, update and delete platform-managed skills in the shared skills root.

Only directories this module created carry a manifest. Everything else under the
skills root belongs to the operator or a third-party package and is read-only
here, so a prompt-injected agent cannot rewrite a skill it merely can read.
"""

from __future__ import annotations

import json
import os
import re
import shutil
from dataclasses import dataclass
from pathlib import Path

MANIFEST_NAME = ".oma-skill.json"
SKILL_FILE = "SKILL.md"
MANIFEST_CREATOR = "oma-hr"

SKILL_NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")
REFERENCE_NAME_RE = re.compile(r"^[A-Za-z0-9._-][A-Za-z0-9._/-]{0,120}$")

MAX_DESCRIPTION_CHARS = 500
MAX_BODY_BYTES = 20_000
MAX_REFERENCE_BYTES = 100_000
MAX_REFERENCE_TOTAL_BYTES = 200_000
MAX_REFERENCES = 20


class SkillStoreError(ValueError):
    """Raised when a skill operation is invalid or not permitted."""


@dataclass(frozen=True)
class SkillRoot:
    skills_dir: Path

    @classmethod
    def from_agents_home(cls, agents_home: Path | str) -> SkillRoot:
        return cls(Path(agents_home).expanduser() / "skills")

    def resolve(self, name: str) -> Path:
        """Return the directory for a skill name, refusing any escape attempt."""

        validate_name(name)
        root = self.skills_dir.resolve()
        target = (root / name).resolve()
        if target.parent != root:
            raise SkillStoreError("Skill path escapes the skills root")
        return target


def validate_name(name: str) -> str:
    clean = (name or "").strip()
    if not SKILL_NAME_RE.fullmatch(clean):
        raise SkillStoreError(
            "Skill name must be lowercase letters, digits and dashes (max 64)"
        )
    return clean


def validate_description(description: str) -> str:
    clean = (description or "").strip()
    if not clean:
        raise SkillStoreError("Skill description is required")
    if "\n" in clean:
        raise SkillStoreError("Skill description must be a single line")
    if len(clean) > MAX_DESCRIPTION_CHARS:
        raise SkillStoreError(
            f"Skill description must be at most {MAX_DESCRIPTION_CHARS} characters"
        )
    return clean


def validate_body(body: str) -> str:
    clean = (body or "").strip()
    if not clean:
        raise SkillStoreError("Skill body is required")
    if len(clean.encode()) > MAX_BODY_BYTES:
        raise SkillStoreError(f"Skill body must stay under {MAX_BODY_BYTES} bytes")
    return clean


def validate_reference_path(path: str) -> str:
    clean = (path or "").strip()
    if (
        clean.startswith("/")
        or not REFERENCE_NAME_RE.fullmatch(clean)
        or ".." in Path(clean).parts
    ):
        raise SkillStoreError(f"Unsupported reference path: {path!r}")
    if clean == SKILL_FILE:
        raise SkillStoreError("Reference path must not be SKILL.md")
    return clean


def validate_references(
    references: dict[str, str] | None,
) -> dict[str, str]:
    if not references:
        return {}
    if len(references) > MAX_REFERENCES:
        raise SkillStoreError(f"At most {MAX_REFERENCES} reference files are allowed")
    validated: dict[str, str] = {}
    total = 0
    for raw_path, content in references.items():
        path = validate_reference_path(raw_path)
        text = content or ""
        size = len(text.encode())
        if size > MAX_REFERENCE_BYTES:
            raise SkillStoreError(
                f"Reference {path} exceeds {MAX_REFERENCE_BYTES} bytes"
            )
        total += size
        validated[path] = text
    if total > MAX_REFERENCE_TOTAL_BYTES:
        raise SkillStoreError(
            f"Reference files exceed {MAX_REFERENCE_TOTAL_BYTES} bytes in total"
        )
    return validated


def render_skill(name: str, description: str, body: str) -> str:
    # Folded block scalar keeps descriptions with colons and quotes intact without
    # inventing an escaping scheme the frontmatter parser does not implement.
    return f"---\nname: {name}\ndescription: >-\n  {description}\n---\n\n{body}\n"


def read_manifest(directory: Path) -> dict | None:
    manifest = directory / MANIFEST_NAME
    if not manifest.is_file():
        return None
    try:
        loaded = json.loads(manifest.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return loaded if isinstance(loaded, dict) else None


def _contained(directory: Path, relative: str) -> Path:
    """Resolve a skill-relative path and keep it inside the skill directory.

    The regex check on the relative name is not enough on its own: a symlink that
    already exists inside the skill directory could otherwise redirect a write.
    """

    root = directory.resolve()
    target = (root / relative).resolve()
    if root not in target.parents:
        raise SkillStoreError(f"Reference path escapes the skill directory: {relative}")
    return target


def _write_file(path: Path, content: str, *, timestamp: str) -> None:
    path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    handle = os.open(temporary, os.O_CREAT | os.O_TRUNC | os.O_WRONLY, 0o600)
    with os.fdopen(handle, "w", encoding="utf-8") as stream:
        stream.write(content)
    os.replace(temporary, path)


def _write_manifest(directory: Path, *, created_at: str, updated_at: str) -> None:
    existing = read_manifest(directory) or {}
    payload = {
        "created_by": MANIFEST_CREATOR,
        "created_at": existing.get("created_at") or created_at,
        "updated_at": updated_at,
    }
    _write_file(
        directory / MANIFEST_NAME,
        json.dumps(payload, ensure_ascii=False, sort_keys=True) + "\n",
        timestamp=updated_at,
    )


def create_skill(
    root: SkillRoot,
    name: str,
    description: str,
    body: str,
    *,
    references: dict[str, str] | None = None,
    timestamp: str,
) -> Path:
    directory = root.resolve(name)
    if directory.exists():
        raise SkillStoreError(f"Skill {name} already exists")
    clean_description = validate_description(description)
    clean_body = validate_body(body)
    clean_references = validate_references(references)
    directory.mkdir(mode=0o700, parents=True)
    for path, content in clean_references.items():
        _write_file(_contained(directory, path), content, timestamp=timestamp)
    _write_file(
        directory / SKILL_FILE,
        render_skill(name, clean_description, clean_body),
        timestamp=timestamp,
    )
    _write_manifest(directory, created_at=timestamp, updated_at=timestamp)
    return directory


def update_skill(
    root: SkillRoot,
    name: str,
    *,
    description: str | None = None,
    body: str | None = None,
    references: dict[str, str] | None = None,
    remove_references: list[str] | None = None,
    timestamp: str,
) -> Path:
    directory = root.resolve(name)
    manifest = read_manifest(directory)
    if manifest is None:
        raise SkillStoreError(
            f"Skill {name} is not managed by the platform; edit it at its source"
        )
    skill_file = directory / SKILL_FILE
    if not skill_file.is_file():
        raise SkillStoreError(f"Skill {name} has no {SKILL_FILE}")

    current = skill_file.read_text(encoding="utf-8")
    current_description, current_body = split_skill(current)
    next_description = (
        validate_description(description)
        if description is not None
        else current_description
    )
    next_body = validate_body(body) if body is not None else current_body
    if description is not None or body is not None:
        _write_file(
            skill_file,
            render_skill(name, next_description, next_body),
            timestamp=timestamp,
        )

    for raw_path in remove_references or []:
        path = validate_reference_path(raw_path)
        target = directory / path
        if target.is_file():
            target.unlink()

    for path, content in validate_references(references).items():
        _write_file(_contained(directory, path), content, timestamp=timestamp)

    _write_manifest(
        directory,
        created_at=str(manifest.get("created_at") or timestamp),
        updated_at=timestamp,
    )
    return directory


def delete_skill(root: SkillRoot, name: str) -> None:
    directory = root.resolve(name)
    if read_manifest(directory) is None:
        raise SkillStoreError(
            f"Skill {name} is not managed by the platform; remove it at its source"
        )
    try:
        shutil.rmtree(directory)
    except OSError as exc:
        raise SkillStoreError(f"Skill {name} could not be removed: {exc}") from exc


def split_skill(text: str) -> tuple[str, str]:
    """Return (description, body) from a rendered skill file."""

    if not text.startswith("---"):
        return "", text.strip()
    parts = text.split("---", 2)
    if len(parts) < 3:
        return "", text.strip()
    description = ""
    lines = parts[1].splitlines()
    index = 0
    while index < len(lines):
        match = re.match(r"^description:\s*(.*)$", lines[index].strip())
        if not match:
            index += 1
            continue
        value = match.group(1).strip()
        if value in {">", ">-", "|", "|-", ">+", "|+"}:
            collected: list[str] = []
            index += 1
            while index < len(lines) and (
                not lines[index].strip() or lines[index].startswith((" ", "\t"))
            ):
                if lines[index].strip():
                    collected.append(lines[index].strip())
                index += 1
            description = " ".join(collected)
            continue
        description = value.strip("\"'")
        index += 1
    return description, parts[2].strip()


def skill_files(directory: Path) -> list[str]:
    if not directory.is_dir():
        return []
    return sorted(
        str(path.relative_to(directory))
        for path in directory.rglob("*")
        if path.is_file() and path.name != MANIFEST_NAME
    )
