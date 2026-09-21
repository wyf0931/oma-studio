from datetime import UTC, datetime, timedelta
from pathlib import Path

from app.store import Store


def test_default_agent_and_agent_crud(tmp_path: Path):
    store = Store(tmp_path / "db.json")
    default = store.ensure_default_agent()
    assert default["name"] == "assistant"
    assert default["protected"] is True
    assert store.ensure_default_agent()["id"] == default["id"]

    agent = store.create_agent(
        "researcher",
        "Research carefully",
        provider="deepseek",
        model="deepseek-v4-flash",
        thinking_level="low",
    )
    saved = store.get_agent(agent["id"])
    assert saved is not None
    assert saved["instruction"] == "Research carefully"
    assert saved["provider"] == "deepseek"
    assert saved["model"] == "deepseek-v4-flash"
    assert saved["thinking_level"] == "low"
    updated = store.update_agent(agent["id"], {"instruction": "Be rigorous"})
    assert updated is not None and updated["instruction"] == "Be rigorous"
    assert store.delete_agent(agent["id"]) is True
    deleted = store.get_agent(agent["id"])
    assert deleted is not None and deleted["deleted_at"]
    assert agent["id"] not in {item["id"] for item in store.list_agents()}
    assert store.delete_agent(default["id"]) is False


def test_update_agent_clears_model_configuration_for_auto(tmp_path: Path):
    store = Store(tmp_path / "db.json")
    agent = store.create_agent(
        "auto-config",
        "Use the deployment defaults",
        provider="deepseek",
        model="deepseek-flash",
        thinking_level="low",
    )

    updated = store.update_agent(
        agent["id"], {"provider": None, "model": None, "thinking_level": None}
    )

    assert updated is not None
    assert updated["provider"] is None
    assert updated["model"] is None
    assert updated["thinking_level"] is None
    stored = store.get_agent(agent["id"])
    assert stored is not None
    assert stored["provider"] is None
    assert updated["content_hash"] == Store.agent_content_hash(updated)


def test_update_agent_keeps_none_valued_fields_outside_nullable_fields(tmp_path: Path):
    store = Store(tmp_path / "db.json")
    agent = store.create_agent(
        "keep-instruction",
        "Keep the stored instruction",
    )

    updated = store.update_agent(agent["id"], {"instruction": None})

    assert updated is not None
    assert updated["instruction"] == "Keep the stored instruction"


def test_update_agent_clears_description(tmp_path: Path):
    store = Store(tmp_path / "db.json")
    agent = store.create_agent(
        "clear-description",
        "Keep it short",
        description="Remove me",
    )

    updated = store.update_agent(agent["id"], {"description": None})

    assert updated is not None
    assert updated["description"] is None
    stored = store.get_agent(agent["id"])
    assert stored is not None
    assert stored["description"] is None
    assert updated["content_hash"] == Store.agent_content_hash(updated)


def test_default_agent_instruction_migrates_legacy_value(tmp_path: Path):
    store = Store(tmp_path / "db.json")
    default = store.ensure_default_agent()
    store.update_agent(
        default["id"], {"instruction": "Be helpful, clear, and concise."}
    )

    refreshed = store.ensure_default_agent()

    assert refreshed["instruction"] == (
        "Be helpful, clear, concise and easy to follow; don't sacrifice clarity for brevity."
    )


def test_agent_user_profile_metadata_round_trips(tmp_path: Path):
    store = Store(tmp_path / "db.json")
    agent = store.create_agent(
        "writer",
        "Follow the internal writing rules.",
        description="Turn rough ideas into clear drafts.",
        tags=["Writing", "Editing"],
        quickstarts=["Rewrite this clearly.", "Give me three titles."],
    )
    saved = store.get_agent(agent["id"])
    assert saved is not None
    assert saved["description"] == "Turn rough ideas into clear drafts."
    assert saved["tags"] == ["Writing", "Editing"]
    assert saved["quickstarts"] == ["Rewrite this clearly.", "Give me three titles."]


def test_deleting_agent_publication_keeps_installed_copy(tmp_path: Path):
    store = Store(tmp_path / "db.json")
    source = store.create_agent("publisher", "Share this agent")
    publication = store.publish_agent(source, "admin", "v1.0.0")
    store.publish_agent(source, "admin", "v1.1.0")
    installed = store.install_agent_publication(publication["id"], "user-1")

    assert installed is not None
    assert store.delete_agent_publication(publication["id"]) is True
    assert store.get_agent_publication(publication["id"]) is None
    assert store.list_agent_publications() == []
    assert store.get_agent(installed["id"]) is not None
    assert store.delete_agent_publication(publication["id"]) is False


def test_chat_index_does_not_store_messages(tmp_path: Path):
    store = Store(tmp_path / "db.json")
    agent = store.ensure_default_agent()
    chat = store.create_chat(agent["id"], "session-1")
    assert chat["session_id"] == "session-1"
    assert "messages" not in chat
    assert "session_file" not in chat


def test_artifact_shares_are_independent_per_file_and_revocable(tmp_path: Path):
    store = Store(tmp_path / "platform.sqlite3")
    agent = store.ensure_default_agent()
    chat = store.create_chat(agent["id"], user_id="owner-1")

    first = store.create_artifact_share(chat["id"], "reports/one.md", "owner-1")
    reused = store.create_artifact_share(chat["id"], "reports/one.md", "owner-1")
    second = store.create_artifact_share(chat["id"], "reports/two.md", "owner-1")

    assert first["token"] == reused["token"]
    assert first["token"] != second["token"]
    assert first["artifact_type"] == "markdown"
    assert {share["path"] for share in store.list_artifact_shares("owner-1")} == {
        "reports/one.md",
        "reports/two.md",
    }
    assert store.delete_artifact_share(first["token"], "someone-else") is False
    assert store.delete_artifact_share(first["token"], "owner-1") is True
    assert store.get_artifact_share(first["token"]) is None
    assert store.delete_chat(chat["id"]) is True
    assert store.list_artifact_shares("owner-1") == []


def test_autopilot_chats_always_get_fresh_session_ids(tmp_path: Path):
    store = Store(tmp_path / "db.json")
    agent = store.ensure_default_agent()
    first = store.create_autopilot_chat(agent["id"], "Daily")
    second = store.create_autopilot_chat(agent["id"], "Daily")
    assert first["id"] != second["id"]
    assert first["session_id"] == first["id"]
    assert second["session_id"] == second["id"]


def test_new_chat_defaults_to_its_own_session_id(tmp_path: Path):
    store = Store(tmp_path / "db.json")
    agent = store.ensure_default_agent()
    chat = store.create_chat(agent["id"], status="created")
    assert chat["session_id"] == chat["id"]
    assert chat["session_id"] != "pending"


def test_autopilot_and_run_metadata(tmp_path: Path):
    store = Store(tmp_path / "db.json")
    agent = store.ensure_default_agent()
    autopilot = store.create_autopilot(
        "Daily brief", "Summarize today", agent["id"], "0 9 * * *"
    )
    assert store.list_autopilots()[0]["name"] == "Daily brief"
    run = store.create_autopilot_run(autopilot["id"], "chat-1", "session-1")
    store.update_autopilot_run(run["id"], {"status": "success", "duration_ms": 123})
    assert store.list_autopilot_runs(autopilot["id"])[0]["status"] == "success"


def test_viewing_a_chat_does_not_change_ordering(tmp_path: Path):
    store = Store(tmp_path / "db.json")
    agent = store.ensure_default_agent()
    first = store.create_chat(agent["id"], "session-first")
    second = store.create_chat(agent["id"], "session-second")  # newest → listed on top
    assert [c["id"] for c in store.list_chats()] == [second["id"], first["id"]]

    # Status/metadata touches (viewing history) must not reorder the sidebar.
    import time

    time.sleep(0.01)
    store.update_chat(first["id"], {"status": "ready"})
    assert [c["id"] for c in store.list_chats()] == [second["id"], first["id"]]
    touched = store.get_chat(first["id"])
    assert (
        touched is not None and touched["last_activity_at"] == first["last_activity_at"]
    )

    # Explicit activity (a sent message) is what moves a chat to the top.
    time.sleep(0.01)
    future_activity = (datetime.now(UTC) + timedelta(seconds=1)).isoformat()
    store.update_chat(
        first["id"],
        {"status": "running", "last_activity_at": future_activity},
    )
    assert [c["id"] for c in store.list_chats()] == [first["id"], second["id"]]
