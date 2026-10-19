import json
from pathlib import Path

from app.api.contracts import PiMessage, UserResponse
from app.api.export_schema import create_schema
from app.main import app


def test_isolated_schema_matches_the_live_api_and_uses_no_production_state(
    tmp_path, monkeypatch
):
    state = tmp_path / "must-remain-unused"
    monkeypatch.setenv("PI_PLATFORM_DATA_DIR", str(state))
    monkeypatch.setenv("OMA_ADMIN_PASSWORD", "schema-export-secret-marker")
    schema = create_schema()
    actual = {
        path: value
        for path, value in app.openapi()["paths"].items()
        if path.startswith("/api/")
    }
    assert schema["paths"] == actual
    assert "schema-export-secret-marker" not in json.dumps(schema)
    assert not state.exists()
    snapshot = json.loads(Path("schemas/openapi.json").read_text())
    assert snapshot["paths"] == schema["paths"]
    assert snapshot["components"] == schema["components"]


def test_stream_contract_describes_sse_not_json():
    schema = create_schema()
    for path, method in [
        ("/api/chats/{chat_id}/messages", "post"),
        ("/api/chats/{chat_id}/stream", "get"),
    ]:
        content = schema["paths"][path][method]["responses"]["200"]["content"]
        assert set(content) == {"text/event-stream"}
        assert content["text/event-stream"]["schema"]["$ref"].endswith("StreamEnvelope")


def test_response_contracts_keep_explicit_nulls_without_adding_absent_fields():
    payload = {
        "id": "user",
        "username": "fixture",
        "role": "user",
        "status": "active",
        "created_at": "now",
        "email": None,
    }
    assert (
        UserResponse.model_validate(payload).model_dump(exclude_unset=True) == payload
    )
    transcript = {
        "role": "assistant",
        "content": [
            {"type": "text", "text": "fixture", "provider_metadata": {"version": 2}}
        ],
        "future_pi_field": True,
    }
    assert (
        PiMessage.model_validate(transcript).model_dump(
            exclude_unset=True, by_alias=True
        )
        == transcript
    )


def test_declared_response_model_rejects_backend_shape_drift_without_logging_content(
    client, monkeypatch, caplog
):
    user_id = client.get("/api/auth/session").json()["user"]["id"]
    marker = "response-contract-private-value"
    monkeypatch.setattr(
        app.state.oma.store,
        "list_agents",
        lambda: [{"id": "broken", "name": marker, "user_id": user_id}],
    )
    response = client.get("/api/agents")
    assert response.status_code == 500
    assert response.json()["detail"] == "Internal server error"
    assert response.headers["X-Request-ID"]
    assert marker not in caplog.text
    assert "api.response.invalid" in caplog.text or any(
        getattr(record, "event", "") == "api.response.invalid"
        for record in caplog.records
    )


def test_agent_and_identity_contracts_preserve_metadata_and_hide_passwords(
    client, temporary_agent
):
    response = temporary_agent(
        {"name": "contract metadata fixture", "instruction": "fixture"}
    )
    assert response.status_code == 201
    agent = response.json()
    assert agent["provider"] is None
    assert agent["tools_configured"] is True
    stored = app.state.oma.store.get_agent(agent["id"])
    assert stored is not None
    assert all(stored[key] == value for key, value in agent.items())
    user = client.get("/api/auth/session").json()["user"]
    assert "password_hash" not in user
