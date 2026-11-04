import uuid

import pytest

import app.main as main_module
from app.tool_tokens import WRITE_SCOPES, issue_tool_token, resolve_tool_token_secret

GOOD_INSTRUCTION = """# Role
交付带证据与判断的报告。

# Deliverable
Markdown 报告。

# Boundaries
- 不接纯润色，交给表达岗位。

# Routing
deep-research：需要交叉验证时加载。
"""


def _token(
    user_id: str, *, scopes=WRITE_SCOPES, ttl_seconds: int = 900, now=None
) -> str:
    return issue_tool_token(
        resolve_tool_token_secret(
            main_module.settings.tool_token_secret, main_module.settings.data_dir
        ),
        chat_id="test-chat",
        user_id=user_id,
        scopes=scopes,
        ttl_seconds=ttl_seconds,
        now=now,
    )


@pytest.fixture
def admin_id(client) -> str:
    response = client.get("/api/auth/session")
    assert response.status_code == 200
    return response.json()["user"]["id"]


@pytest.fixture
def hr_headers(admin_id):
    return {"X-OMA-Tool-Token": _token(admin_id)}


def job_payload(**overrides) -> dict:
    payload = {
        "name": f"测试岗位-{uuid.uuid4().hex[:8]}",
        "instruction": GOOD_INSTRUCTION,
        "description": f"单元测试专用岗位 {uuid.uuid4().hex[:8]}",
        "deliverable": f"测试报告 {uuid.uuid4().hex[:6]}",
        "acceptance": ["结论带信源", "推断单独标注", "列明未覆盖维度"],
        "skills": [],
        "confirm": True,
        "duplicate_decision": "new",
    }
    payload.update(overrides)
    return payload


def test_hr_agent_is_seeded_for_the_admin(client, hr_headers):
    response = client.get("/api/hr/agents", headers=hr_headers)

    assert response.status_code == 200
    agents = response.json()["agents"]
    hr = next(agent for agent in agents if agent["id"] == "hr-recruiter")
    assert hr["protected"] is True
    assert "create_agent" in hr["tools"]
    assert hr["acceptance"]


def test_hr_endpoints_require_a_token(client):
    assert client.get("/api/hr/agents").status_code == 401
    assert client.get("/api/hr/tools").status_code == 401


def test_hr_rejects_an_expired_token(client, admin_id):
    response = client.get(
        "/api/hr/agents",
        headers={"X-OMA-Tool-Token": _token(admin_id, ttl_seconds=10, now=1_000)},
    )

    assert response.status_code == 401


def test_hr_rejects_a_non_admin_token(client):
    created = client.post(
        "/api/users", json={"username": f"hr-nonadmin-{uuid.uuid4().hex[:6]}"}
    )
    assert created.status_code == 201
    response = client.get(
        "/api/hr/agents", headers={"X-OMA-Tool-Token": _token(created.json()["id"])}
    )

    assert response.status_code == 403


def test_hr_create_requires_confirmation(client, hr_headers):
    response = client.post(
        "/api/hr/agents", json=job_payload(confirm=False), headers=hr_headers
    )

    assert response.status_code == 400


def test_hr_create_blocks_missing_acceptance(client, hr_headers):
    response = client.post(
        "/api/hr/agents", json=job_payload(acceptance=[]), headers=hr_headers
    )

    assert response.status_code == 422
    findings = response.json()["findings"]
    assert any(item["code"] == "acceptance-missing" for item in findings)


def test_hr_create_blocks_restating_skills(client, hr_headers):
    response = client.post(
        "/api/hr/agents",
        json=job_payload(
            instruction=GOOD_INSTRUCTION + "\n## Skills\n- deep-research\n"
        ),
        headers=hr_headers,
    )

    assert response.status_code == 422
    assert any(item["code"] == "skills-section" for item in response.json()["findings"])


def test_hr_blocks_a_duplicate_then_accepts_a_variant(client, hr_headers):
    first = client.post("/api/hr/agents", json=job_payload(), headers=hr_headers)
    assert first.status_code == 201
    created = first.json()["agent"]

    try:
        duplicate = client.post(
            "/api/hr/agents",
            json=job_payload(
                deliverable=created["deliverable"], duplicate_decision=None
            ),
            headers=hr_headers,
        )
        assert duplicate.status_code == 409
        assert duplicate.json()["duplicates"]

        variant = client.post(
            "/api/hr/agents",
            json=job_payload(
                deliverable=created["deliverable"], duplicate_decision="variant"
            ),
            headers=hr_headers,
        )
        assert variant.status_code == 201
        client.delete(
            f"/api/hr/agents/{variant.json()['agent']['id']}?confirm=true",
            headers=hr_headers,
        )
    finally:
        client.delete(
            f"/api/hr/agents/{created['id']}?confirm=true", headers=hr_headers
        )


def test_hr_delete_requires_confirmation(client, hr_headers):
    created = client.post("/api/hr/agents", json=job_payload(), headers=hr_headers)
    assert created.status_code == 201
    agent_id = created.json()["agent"]["id"]

    assert (
        client.delete(f"/api/hr/agents/{agent_id}", headers=hr_headers).status_code
        == 400
    )
    confirmed = client.delete(
        f"/api/hr/agents/{agent_id}?confirm=true", headers=hr_headers
    )

    assert confirmed.status_code == 200
    assert confirmed.json()["id"] == agent_id


def test_hr_attach_and_detach_skill(client, hr_headers):
    skills = client.get("/api/hr/skills", headers=hr_headers)
    assert skills.status_code == 200

    # Any installed skill works: the catalog itself is only read here, and the
    # attach/detach happens on a job this test creates and then retires.
    available = skills.json()["skills"]
    if not available:
        pytest.skip("no skills are installed in this environment")
    candidate = available[0]

    created = client.post("/api/hr/agents", json=job_payload(), headers=hr_headers)
    assert created.status_code == 201
    agent_id = created.json()["agent"]["id"]
    try:
        attached = client.post(
            f"/api/hr/agents/{agent_id}/skills",
            json={"skill": candidate["name"], "confirm": True},
            headers=hr_headers,
        )
        assert attached.status_code == 200
        assert candidate["path"] in attached.json()["agent"]["skills"]

        detached = client.delete(
            f"/api/hr/agents/{agent_id}/skills/{candidate['name']}?confirm=true",
            headers=hr_headers,
        )
        assert detached.status_code == 200
        assert candidate["path"] not in detached.json()["agent"]["skills"]
    finally:
        client.delete(f"/api/hr/agents/{agent_id}?confirm=true", headers=hr_headers)


def test_hr_tools_lists_job_tools_for_admin(client, hr_headers):
    response = client.get("/api/hr/tools", headers=hr_headers)

    assert response.status_code == 200
    names = {tool["name"] for tool in response.json()["tools"]}
    assert {"create_agent", "attach_skill", "list_tools"} <= names


def skill_payload(name: str, **overrides) -> dict:
    payload = {
        "name": name,
        "description": f"集成测试技能 {name}：只在测试里使用。",
        "body": "# 测试技能\n\n先读一遍，再动手。\n",
        "references": {"references/checklist.md": "- 一步\n"},
        "confirm": True,
    }
    payload.update(overrides)
    return payload


def test_hr_authors_updates_and_deletes_a_skill(client, hr_headers):
    name = f"oma-test-{uuid.uuid4().hex[:8]}"
    created = client.post(
        "/api/hr/skills", json=skill_payload(name), headers=hr_headers
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["skill"]["name"] == name
    assert "references/checklist.md" in body["files"]

    try:
        listed = client.get("/api/hr/skills", headers=hr_headers)
        assert name in {skill["name"] for skill in listed.json()["skills"]}

        updated = client.patch(
            f"/api/hr/skills/{name}",
            json={
                "description": "更新后的路由描述：只在岗位复盘时使用。",
                "body": "# 复盘\n\n先看数据。\n",
                "remove_references": ["references/checklist.md"],
                "confirm": True,
            },
            headers=hr_headers,
        )
        assert updated.status_code == 200, updated.text
        assert updated.json()["files"] == ["SKILL.md"]
        assert "先看数据" in updated.json()["body"]
    finally:
        # Deleting through the endpoint is covered below; guarantee cleanup here.
        client.delete(f"/api/hr/skills/{name}?confirm=true", headers=hr_headers)

    assert name not in {
        skill["name"]
        for skill in client.get("/api/hr/skills", headers=hr_headers).json()["skills"]
    }


def test_hr_skill_writes_require_confirmation(client, hr_headers):
    name = f"oma-test-{uuid.uuid4().hex[:8]}"

    assert (
        client.post(
            "/api/hr/skills",
            json=skill_payload(name, confirm=False),
            headers=hr_headers,
        ).status_code
        == 400
    )
    assert client.patch(
        f"/api/hr/skills/{name}", json={"body": "x"}, headers=hr_headers
    ).status_code in {
        400,
        401,
        422,
    }
    assert (
        client.delete(f"/api/hr/skills/{name}", headers=hr_headers).status_code == 400
    )


def test_hr_skill_delete_is_blocked_while_attached(client, hr_headers):
    name = f"oma-test-{uuid.uuid4().hex[:8]}"
    created = client.post(
        "/api/hr/skills", json=skill_payload(name), headers=hr_headers
    )
    assert created.status_code == 201, created.text

    agent = client.post("/api/hr/agents", json=job_payload(), headers=hr_headers)
    assert agent.status_code == 201
    agent_id = agent.json()["agent"]["id"]

    try:
        attached = client.post(
            f"/api/hr/agents/{agent_id}/skills",
            json={"skill": name, "confirm": True},
            headers=hr_headers,
        )
        assert attached.status_code == 200, attached.text

        blocked = client.delete(
            f"/api/hr/skills/{name}?confirm=true", headers=hr_headers
        )
        assert blocked.status_code == 409
        assert "still attached" in blocked.text

        client.delete(
            f"/api/hr/agents/{agent_id}/skills/{name}?confirm=true", headers=hr_headers
        )
        removed = client.delete(
            f"/api/hr/skills/{name}?confirm=true", headers=hr_headers
        )
        assert removed.status_code == 200
    finally:
        client.delete(f"/api/hr/agents/{agent_id}?confirm=true", headers=hr_headers)
        client.delete(f"/api/hr/skills/{name}?confirm=true", headers=hr_headers)


def test_hr_refuses_to_edit_skills_it_did_not_create(client, hr_headers):
    skills = client.get("/api/hr/skills", headers=hr_headers).json()["skills"]
    if not skills:
        pytest.skip("no skills are installed in this environment")
    foreign = skills[0]["name"]

    response = client.patch(
        f"/api/hr/skills/{foreign}",
        json={"body": "should not be written", "confirm": True},
        headers=hr_headers,
    )

    assert response.status_code == 400
    assert "not managed by the platform" in response.text
