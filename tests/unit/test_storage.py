import json
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from app.storage import create_sqlite_engine
from app.store import Store


def test_store_ignores_archived_platform_json(tmp_path: Path):
    """Startup must never read the retired TinyDB snapshot."""
    sqlite = tmp_path / "platform.sqlite3"
    legacy = tmp_path / "platform.json"
    archived = json.dumps({"chats": {"1": {"id": "chat-1", "agent_id": "agent-1"}}})
    legacy.write_text(archived, encoding="utf-8")

    store = Store(sqlite)
    try:
        assert store.list_chats() == []
        assert store.list_users() == []
    finally:
        store.close()

    assert legacy.read_text(encoding="utf-8") == archived
    assert not list(tmp_path.glob("platform.json.*.bak"))


def test_sqlite_allows_concurrent_writes(tmp_path: Path):
    path = tmp_path / "platform.sqlite3"
    Store(path).close()

    def create(index: int) -> str:
        store = Store(path)
        try:
            return store.create_user(f"user-{index}", None, "password")["id"]
        finally:
            store.close()

    with ThreadPoolExecutor(max_workers=8) as pool:
        ids = list(pool.map(create, range(32)))

    assert len(set(ids)) == 32
    store = Store(path)
    assert len(store.list_users()) == 32


def test_existing_sqlite_gets_agent_profile_columns(tmp_path: Path):
    path = tmp_path / "platform.sqlite3"
    connection = sqlite3.connect(path)
    connection.execute(
        "CREATE TABLE agents (id TEXT PRIMARY KEY, name TEXT, instruction TEXT, created_at TEXT, updated_at TEXT, extra_json TEXT)"
    )
    connection.commit()
    connection.close()

    engine = create_sqlite_engine(path)
    with engine.connect() as connection:
        columns = {
            row[1] for row in connection.exec_driver_sql("PRAGMA table_info(agents)")
        }
        artifact_share_columns = {
            row[1]
            for row in connection.exec_driver_sql("PRAGMA table_info(artifact_shares)")
        }
        version = connection.exec_driver_sql(
            "SELECT value FROM schema_meta WHERE key='version'"
        ).scalar()
    engine.dispose()
    assert {"description", "tags_json", "quickstarts_json", "deleted_at"} <= columns
    assert {"token", "chat_id", "path", "artifact_type"} <= artifact_share_columns
    assert version == "4"
    backups = list(tmp_path.glob("platform.sqlite3.schema-v4.*.bak"))
    assert len(backups) == 1
    assert backups[0].stat().st_size > 0
