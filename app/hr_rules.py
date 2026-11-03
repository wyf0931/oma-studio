"""Job-definition rules for the built-in HR agent.

Both checks are pure functions so the API router, the HR tools and the tests
share one implementation. Nothing here reads storage, Pi state, or the network.
"""

from __future__ import annotations

import re
from collections.abc import Iterable
from difflib import SequenceMatcher
from typing import Any

INSTRUCTION_BUDGET = 1200
INSTRUCTION_HARD_CEILING = 2000
MIN_ACCEPTANCE = 3
MAX_ACCEPTANCE = 10
ACCEPTANCE_MIN_CHARS = 5
ACCEPTANCE_MAX_CHARS = 200
DUPLICATE_THRESHOLD = 0.8

REQUIRED_SECTIONS = ("# Role", "# Deliverable")
SUGGESTED_SECTIONS = ("# Boundaries", "# Routing", "# Environment")
LEGACY_DUPLICATION_SECTION = re.compile(r"(?m)^#{1,3}\s*Skills\s*$")
REFUSAL_MARKERS = (
    "不接",
    "不处理",
    "拒绝",
    "交给",
    "转交",
    "不做",
    "does not",
    "refuse",
    "hand off",
    "hand-off",
    "not take on",
)
COMMAND_MARKERS = re.compile(r"(?:^|\s)--[a-z][a-z-]{2,}|/scripts/|\.sh\b|\.mjs\b")
TOOL_MARKERS = (
    "web_fetch",
    "web_search",
    "publish_artifact",
    "generate_image",
    "edit_image",
    "bash",
    "grep",
    "read",
    "write",
    "edit",
    "ls",
    "find",
)


def finding(code: str, level: str, message: str) -> dict[str, str]:
    return {"code": code, "level": level, "message": message}


def skill_name(path: str) -> str:
    return path.rstrip("/").split("/")[-1]


def skill_names(paths: Iterable[str] | None) -> set[str]:
    return {skill_name(path) for path in paths or []}


def _mentioned_skills(instruction: str, skills: Iterable[str] | None) -> list[str]:
    lowered = instruction.casefold()
    return [
        name
        for name in sorted(skill_names(skills))
        if re.search(rf"(?<![\w-]){re.escape(name.casefold())}(?![\w-])", lowered)
    ]


def lint_job_definition(
    *,
    description: str | None,
    instruction: str,
    deliverable: str | None = None,
    acceptance: Iterable[str] | None = None,
    skills: Iterable[str] | None = None,
) -> list[dict[str, str]]:
    """Return findings for one agent definition. Errors must block a write."""

    findings: list[dict[str, str]] = []
    text = instruction or ""
    acceptance_list = [item.strip() for item in acceptance or [] if item.strip()]

    if not (description or "").strip():
        findings.append(
            finding("description-missing", "error", "A job needs a description.")
        )
    if not text.strip():
        findings.append(
            finding("instruction-missing", "error", "Instruction is empty.")
        )
        return findings

    if len(text) > INSTRUCTION_HARD_CEILING:
        findings.append(
            finding(
                "instruction-over-ceiling",
                "error",
                f"Instruction is {len(text)} characters; the hard ceiling is "
                f"{INSTRUCTION_HARD_CEILING}.",
            )
        )
    elif len(text) > INSTRUCTION_BUDGET:
        findings.append(
            finding(
                "instruction-over-budget",
                "warning",
                f"Instruction is {len(text)} characters; aim for "
                f"{INSTRUCTION_BUDGET} or less.",
            )
        )

    missing_sections = [name for name in REQUIRED_SECTIONS if name not in text]
    if missing_sections:
        findings.append(
            finding(
                "instruction-sections",
                "error",
                "Missing required section(s): " + ", ".join(missing_sections) + ".",
            )
        )
    absent_suggested = [name for name in SUGGESTED_SECTIONS if name not in text]
    if absent_suggested:
        findings.append(
            finding(
                "instruction-sections-suggested",
                "warning",
                "Consider adding: " + ", ".join(absent_suggested) + ".",
            )
        )

    if LEGACY_DUPLICATION_SECTION.search(text):
        findings.append(
            finding(
                "skills-section",
                "error",
                "Remove the Skills section: Pi already injects every skill's name "
                "and description, so restating them here creates a second, drifting "
                "copy. Reference skill names under # Routing instead.",
            )
        )

    mentioned = _mentioned_skills(text, skills)
    if len(mentioned) >= 3:
        findings.append(
            finding(
                "skills-restated",
                "warning",
                f"{len(mentioned)} attached skills are named in the instruction "
                f"({', '.join(mentioned)}). Keep # Routing to one clause per skill "
                "and move the rest into the skill itself.",
            )
        )

    if COMMAND_MARKERS.search(text):
        findings.append(
            finding(
                "commands-inline",
                "warning",
                "Instruction contains command lines or script paths; those belong "
                "in the skill that owns them.",
            )
        )

    if len([name for name in TOOL_MARKERS if name in text]) >= 4:
        findings.append(
            finding(
                "tools-listed",
                "warning",
                "Instruction lists tool names; the selected tool set is already "
                "visible to the model.",
            )
        )

    if not any(marker in text.casefold() for marker in REFUSAL_MARKERS):
        findings.append(
            finding(
                "no-refusal",
                "warning",
                "Add at least one refusal boundary under # Boundaries so the job "
                "declines work it does not own.",
            )
        )

    if not (deliverable or "").strip():
        findings.append(
            finding(
                "deliverable-missing",
                "error",
                "A job needs exactly one deliverable.",
            )
        )

    if len(acceptance_list) < MIN_ACCEPTANCE:
        findings.append(
            finding(
                "acceptance-missing",
                "error",
                f"Provide at least {MIN_ACCEPTANCE} acceptance criteria; found "
                f"{len(acceptance_list)}.",
            )
        )
    if len(acceptance_list) > MAX_ACCEPTANCE:
        findings.append(
            finding(
                "acceptance-too-many",
                "error",
                f"At most {MAX_ACCEPTANCE} acceptance criteria are allowed.",
            )
        )
    if len(set(acceptance_list)) != len(acceptance_list):
        findings.append(
            finding(
                "acceptance-duplicate",
                "error",
                "Acceptance criteria must be unique.",
            )
        )
    invalid = [
        item
        for item in acceptance_list
        if not ACCEPTANCE_MIN_CHARS <= len(item) <= ACCEPTANCE_MAX_CHARS
    ]
    if invalid:
        findings.append(
            finding(
                "acceptance-invalid",
                "error",
                f"Acceptance criteria must be {ACCEPTANCE_MIN_CHARS}-"
                f"{ACCEPTANCE_MAX_CHARS} characters; {len(invalid)} are out of range.",
            )
        )

    return findings


def skill_similarity(left: Iterable[str] | None, right: Iterable[str] | None) -> float:
    left_names, right_names = skill_names(left), skill_names(right)
    if not left_names or not right_names:
        return 0.0
    shared = len(left_names & right_names)
    return shared / len(left_names | right_names)


def text_similarity(left: str | None, right: str | None) -> float:
    left_text = (left or "").strip().casefold()
    right_text = (right or "").strip().casefold()
    if not left_text or not right_text:
        return 0.0
    return SequenceMatcher(None, left_text, right_text).ratio()


def job_similarity(
    candidate: dict[str, Any], existing: dict[str, Any]
) -> dict[str, Any]:
    skills = skill_similarity(candidate.get("skills"), existing.get("skills"))
    description = text_similarity(
        candidate.get("description"), existing.get("description")
    )
    deliverable = text_similarity(
        candidate.get("deliverable"), existing.get("deliverable")
    )
    shared = sorted(
        skill_names(candidate.get("skills")) & skill_names(existing.get("skills"))
    )
    return {
        "agent_id": existing.get("id"),
        "name": existing.get("name"),
        "skills": round(skills, 3),
        "description": round(description, 3),
        "deliverable": round(deliverable, 3),
        "score": round(max(skills, description, deliverable), 3),
        "shared_skills": shared,
    }


def find_duplicates(
    candidate: dict[str, Any],
    existing_agents: Iterable[dict[str, Any]],
    *,
    threshold: float = DUPLICATE_THRESHOLD,
    limit: int = 5,
) -> list[dict[str, Any]]:
    """Rank existing jobs by how much of this candidate they already cover."""

    matches = [
        job_similarity(candidate, existing)
        for existing in existing_agents
        if existing.get("id") != candidate.get("id")
    ]
    matches = [match for match in matches if match["score"] >= threshold]
    matches.sort(key=lambda match: match["score"], reverse=True)
    return matches[:limit]


def blocking(findings: Iterable[dict[str, str]]) -> list[dict[str, str]]:
    return [item for item in findings if item["level"] == "error"]
