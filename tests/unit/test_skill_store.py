from pathlib import Path

import pytest

from app.skill_store import (
    MANIFEST_NAME,
    SkillRoot,
    SkillStoreError,
    create_skill,
    delete_skill,
    read_manifest,
    skill_files,
    split_skill,
    update_skill,
    validate_reference_path,
)

TIMESTAMP = "2026-11-04T00:00:00+00:00"
BODY = "# 岗位编制\n\n先问任务，再定岗位。\n"
DESCRIPTION = "岗位编制流程：新建、合并、撤销 Agent 岗位时使用。"


def make_root(tmp_path: Path) -> SkillRoot:
    return SkillRoot.from_agents_home(tmp_path)


def test_create_skill_writes_manifest_frontmatter_and_files(tmp_path):
    root = make_root(tmp_path)

    directory = create_skill(
        root,
        "hiring-test",
        DESCRIPTION,
        BODY,
        references={"references/checklist.md": "- 交付物\n- 验收标准\n"},
        timestamp=TIMESTAMP,
    )

    assert directory == tmp_path / "skills" / "hiring-test"
    manifest = read_manifest(directory)
    assert manifest is not None
    assert manifest["created_by"] == "oma-hr"
    assert manifest["created_at"] == TIMESTAMP
    rendered = (directory / "SKILL.md").read_text(encoding="utf-8")
    assert rendered.startswith("---\nname: hiring-test\n")
    assert "description: >-" in rendered
    description, body = split_skill(rendered)
    assert description == DESCRIPTION
    assert body.strip() == BODY.strip()
    assert skill_files(directory) == ["SKILL.md", "references/checklist.md"]


def test_create_skill_rejects_duplicates_and_bad_names(tmp_path):
    root = make_root(tmp_path)
    create_skill(root, "hiring-test", DESCRIPTION, BODY, timestamp=TIMESTAMP)

    with pytest.raises(SkillStoreError, match="already exists"):
        create_skill(root, "hiring-test", DESCRIPTION, BODY, timestamp=TIMESTAMP)
    with pytest.raises(SkillStoreError, match="lowercase"):
        create_skill(root, "Hiring Test", DESCRIPTION, BODY, timestamp=TIMESTAMP)
    with pytest.raises(SkillStoreError):
        create_skill(root, "../../etc/passwd", DESCRIPTION, BODY, timestamp=TIMESTAMP)


def test_create_skill_rejects_unsafe_or_oversized_content(tmp_path):
    root = make_root(tmp_path)

    with pytest.raises(SkillStoreError, match="Unsupported reference path"):
        create_skill(
            root,
            "hiring-test",
            DESCRIPTION,
            BODY,
            references={"../../evil.md": "nope"},
            timestamp=TIMESTAMP,
        )
    with pytest.raises(SkillStoreError, match="Unsupported reference path"):
        create_skill(
            root,
            "hiring-test",
            DESCRIPTION,
            BODY,
            references={"/abs.md": "nope"},
            timestamp=TIMESTAMP,
        )
    with pytest.raises(SkillStoreError, match="body must stay under"):
        create_skill(
            root, "hiring-test", DESCRIPTION, "x" * 20_001, timestamp=TIMESTAMP
        )
    with pytest.raises(SkillStoreError, match="single line"):
        create_skill(root, "hiring-test", "two\nlines", BODY, timestamp=TIMESTAMP)


def test_reference_path_validation():
    assert validate_reference_path("references/a.md") == "references/a.md"
    for bad in ("../a.md", "a/../../b.md", "", "a b.md"):
        with pytest.raises(SkillStoreError):
            validate_reference_path(bad)


def test_update_skill_requires_a_platform_manifest(tmp_path):
    root = make_root(tmp_path)
    operator = tmp_path / "skills" / "operator-skill"
    operator.mkdir(parents=True)
    (operator / "SKILL.md").write_text(
        "---\nname: operator-skill\n---\n\nbody\n", encoding="utf-8"
    )

    with pytest.raises(SkillStoreError, match="not managed by the platform"):
        update_skill(root, "operator-skill", body="new", timestamp=TIMESTAMP)


def test_update_skill_rewrites_body_and_references(tmp_path):
    root = make_root(tmp_path)
    create_skill(
        root,
        "hiring-test",
        DESCRIPTION,
        BODY,
        references={"references/a.md": "old"},
        timestamp=TIMESTAMP,
    )

    directory = update_skill(
        root,
        "hiring-test",
        description="新的路由描述：只在岗位复盘时使用。",
        body="# 复盘\n\n先看使用数据。\n",
        references={"references/b.md": "new"},
        remove_references=["references/a.md"],
        timestamp="2026-11-05T00:00:00+00:00",
    )

    rendered = (directory / "SKILL.md").read_text(encoding="utf-8")
    description, body = split_skill(rendered)
    assert description == "新的路由描述：只在岗位复盘时使用。"
    assert body.strip() == "# 复盘\n\n先看使用数据。".strip()
    assert skill_files(directory) == ["SKILL.md", "references/b.md"]
    manifest = read_manifest(directory)
    assert manifest is not None
    assert manifest["created_at"] == TIMESTAMP
    assert manifest["updated_at"] == "2026-11-05T00:00:00+00:00"


def test_delete_skill_removes_only_platform_skills(tmp_path):
    root = make_root(tmp_path)
    create_skill(root, "hiring-test", DESCRIPTION, BODY, timestamp=TIMESTAMP)
    operator = tmp_path / "skills" / "operator-skill"
    operator.mkdir(parents=True)
    (operator / "SKILL.md").write_text("body", encoding="utf-8")

    delete_skill(root, "hiring-test")
    assert not (tmp_path / "skills" / "hiring-test").exists()

    with pytest.raises(SkillStoreError, match="not managed by the platform"):
        delete_skill(root, "operator-skill")
    assert operator.exists()


def test_manifest_is_not_listed_as_a_skill_file(tmp_path):
    root = make_root(tmp_path)
    directory = create_skill(
        root, "hiring-test", DESCRIPTION, BODY, timestamp=TIMESTAMP
    )

    assert MANIFEST_NAME not in skill_files(directory)
    assert (directory / MANIFEST_NAME).is_file()


def test_reference_symlink_cannot_escape_the_skill_directory(tmp_path):
    root = make_root(tmp_path)
    directory = create_skill(
        root, "hiring-test", DESCRIPTION, BODY, timestamp=TIMESTAMP
    )
    outside = tmp_path / "outside"
    outside.mkdir()
    (directory / "references").symlink_to(outside, target_is_directory=True)

    with pytest.raises(SkillStoreError, match="escapes the skill directory"):
        update_skill(
            root,
            "hiring-test",
            references={"references/leak.md": "should not land outside"},
            timestamp=TIMESTAMP,
        )

    assert list(outside.iterdir()) == []
