import pytest

from app.hr_rules import (
    INSTRUCTION_BUDGET,
    blocking,
    find_duplicates,
    lint_job_definition,
    skill_similarity,
)

GOOD_INSTRUCTION = """# Role
研究员，交付带证据与判断的报告。

# Deliverable
Markdown 报告，先给结论与置信度。

# Boundaries
- 不接纯润色，交给表达岗位。
- 查不到来源就明说。

# Routing
deep-research：需要多轮交叉验证时加载。

# Environment
只有 web_search 与 web_fetch。
"""

GOOD_ACCEPTANCE = ["关键结论均标注信源", "事实与推断分栏", "说明未覆盖的维度"]


def codes(findings):
    return {item["code"] for item in findings}


def test_clean_job_definition_has_no_blocking_findings():
    findings = lint_job_definition(
        description="做深度研究并给出可执行结论",
        instruction=GOOD_INSTRUCTION,
        deliverable="一份带置信度的研究报告",
        acceptance=GOOD_ACCEPTANCE,
        skills=["/skills/deep-research"],
    )

    assert blocking(findings) == []


def test_legacy_skills_section_is_blocked():
    findings = lint_job_definition(
        description="做研究",
        instruction=GOOD_INSTRUCTION + "\n## Skills\n- deep-research：多轮检索\n",
        deliverable="研究报告",
        acceptance=GOOD_ACCEPTANCE,
    )

    assert "skills-section" in codes(findings)
    assert blocking(findings)


def test_missing_acceptance_and_deliverable_are_blocked():
    findings = lint_job_definition(
        description="做研究",
        instruction=GOOD_INSTRUCTION,
        deliverable=None,
        acceptance=["只有一条"],
    )

    assert {"deliverable-missing", "acceptance-missing"} <= codes(findings)


def test_over_ceiling_instruction_is_blocked():
    findings = lint_job_definition(
        description="做研究",
        instruction=GOOD_INSTRUCTION + ("冗长" * 1200),
        deliverable="研究报告",
        acceptance=GOOD_ACCEPTANCE,
    )

    assert "instruction-over-ceiling" in codes(findings)


def test_over_budget_instruction_only_warns():
    findings = lint_job_definition(
        description="做研究",
        instruction=GOOD_INSTRUCTION + ("说明" * (INSTRUCTION_BUDGET // 2)),
        deliverable="研究报告",
        acceptance=GOOD_ACCEPTANCE,
    )

    assert "instruction-over-budget" in codes(findings)
    assert blocking(findings) == []


def test_missing_description_and_refusal_are_flagged():
    findings = lint_job_definition(
        description="",
        instruction="# Role\n做研究。\n\n# Deliverable\n报告。\n",
        deliverable="报告",
        acceptance=GOOD_ACCEPTANCE,
    )

    assert "description-missing" in codes(findings)
    assert "no-refusal" in codes(findings)


def test_commands_and_tool_lists_are_flagged():
    findings = lint_job_definition(
        description="抓字幕",
        instruction=GOOD_INSTRUCTION
        + "\n用 yt-dlp --write-auto-subs 抓，再用 read 和 write 与 web_fetch 与 bash。\n",
        deliverable="字幕文件",
        acceptance=GOOD_ACCEPTANCE,
    )

    assert "commands-inline" in codes(findings)
    assert "tools-listed" in codes(findings)


def test_skill_similarity_uses_skill_names_only():
    left = ["/home/node/.pi/agent/skills/deep-research", "/skills/grilling"]
    right = [
        "/home/node/.agents/skills/deep-research",
        "/skills/grilling",
        "/skills/pdf",
    ]

    assert skill_similarity(left, right) == pytest.approx(2 / 3)
    assert skill_similarity([], right) == 0.0


def test_find_duplicates_ranks_identical_capability_sets_first():
    candidate = {
        "name": "研究员",
        "description": "做研究并给出结论",
        "deliverable": "研究报告",
        "skills": ["/skills/deep-research", "/skills/grilling"],
    }
    agents = [
        {
            "id": "a",
            "name": "LLM Researcher",
            "description": "做研究并给出结论",
            "deliverable": "研究报告",
            "skills": ["/skills/deep-research", "/skills/grilling"],
        },
        {
            "id": "b",
            "name": "Youtube",
            "description": "整理字幕",
            "deliverable": "字幕",
            "skills": ["/skills/youtube-transcript"],
        },
    ]

    matches = find_duplicates(candidate, agents)

    assert [match["agent_id"] for match in matches] == ["a"]
    assert matches[0]["score"] == 1.0
    assert matches[0]["shared_skills"] == ["deep-research", "grilling"]


def test_find_duplicates_skips_the_candidate_itself():
    candidate = {
        "id": "a",
        "name": "研究员",
        "description": "做研究",
        "deliverable": "报告",
        "skills": ["/skills/deep-research"],
    }

    assert find_duplicates(candidate, [candidate]) == []
