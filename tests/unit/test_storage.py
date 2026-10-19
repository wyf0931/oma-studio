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


def test_metadata_permissions_cover_existing_files_sidecars_and_backups(tmp_path):
    import stat

    path = tmp_path / "platform.sqlite3"
    unrelated = tmp_path / "workspace-note.txt"
    unrelated.write_text("leave workspace content alone")
    unrelated.chmod(0o644)
    store = Store(path)
    user = store.create_user("private", None, "private password")
    sidecars = [Path(f"{path}-wal"), Path(f"{path}-shm")]
    assert all(item.exists() for item in sidecars)
    backup = tmp_path / "platform.sqlite3.schema-v3.old.bak"
    backup.write_text("old backup")
    for item in [path, backup, *sidecars]:
        item.chmod(0o644)
    reopened = Store(path)
    try:
        for item in [path, backup, *sidecars]:
            assert stat.S_IMODE(item.stat().st_mode) == 0o600
        assert stat.S_IMODE(unrelated.stat().st_mode) == 0o644
        assert reopened.get_user(user["id"]) is not None
    finally:
        reopened.close()
        store.close()


def test_new_metadata_and_upgrade_backups_are_private(tmp_path):
    import stat

    path = tmp_path / "private" / "platform.sqlite3"
    store = Store(path)
    assert stat.S_IMODE(path.stat().st_mode) == 0o600
    assert stat.S_IMODE(path.parent.stat().st_mode) == 0o700
    store.close()
    with sqlite3.connect(path) as connection:
        connection.execute("UPDATE schema_meta SET value='0'")
    store = Store(path)
    try:
        backups = list(path.parent.glob("platform.sqlite3.schema-v*.bak"))
        assert len(backups) == 1
        assert stat.S_IMODE(backups[0].stat().st_mode) == 0o600
    finally:
        store.close()
