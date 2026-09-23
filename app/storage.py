"""SQLite engine configuration and in-place schema upgrades."""

import json
import os
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, TypeVar
from uuid import uuid4

from sqlalchemy import event
from sqlmodel import SQLModel, create_engine

from .storage_models import TABLE_MODELS

SCHEMA_VERSION = 4
SCHEMA_ALTERS = {
    "agents": {
        "description": "TEXT",
        "tags_json": "TEXT NOT NULL DEFAULT '[]'",
        "quickstarts_json": "TEXT NOT NULL DEFAULT '[]'",
        "deleted_at": "TEXT",
    }
}
T = TypeVar("T", bound=SQLModel)
JSON_FIELDS = {
    "extensions": "extensions_json",
    "skills": "skills_json",
    "tools": "tools_json",
    "mcp_servers": "mcp_servers_json",
    "tags": "tags_json",
    "quickstarts": "quickstarts_json",
    "version_sort": "version_sort_json",
    "content": "content_json",
}
MODEL_FIELDS = {name: set(model.model_fields) for name, model in TABLE_MODELS.items()}


def _schema_needs_upgrade(path: Path) -> bool:
    if not path.exists():
        return False
    connection = sqlite3.connect(path)
    try:
        try:
            version = int(
                connection.execute(
                    "SELECT value FROM schema_meta WHERE key='version'"
                ).fetchone()[0]
            )
        except (TypeError, ValueError, sqlite3.OperationalError):
            version = 0
        existing = {row[1] for row in connection.execute("PRAGMA table_info(agents)")}
        return version < SCHEMA_VERSION or any(
            column not in existing for column in SCHEMA_ALTERS["agents"]
        )
    finally:
        connection.close()


def _backup_before_schema_upgrade(path: Path) -> Path:
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    backup = path.with_name(f"{path.name}.schema-v{SCHEMA_VERSION}.{stamp}.bak")
    if backup.exists():
        backup = path.with_name(
            f"{path.name}.schema-v{SCHEMA_VERSION}.{stamp}.{uuid4().hex}.bak"
        )
    temporary = path.with_name(f".{backup.name}.{uuid4().hex}.tmp")
    source = sqlite3.connect(path)
    destination = sqlite3.connect(temporary)
    try:
        source.backup(destination)
        destination.commit()
    finally:
        destination.close()
        source.close()
    os.replace(temporary, backup)
    return backup


def create_sqlite_engine(path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if _schema_needs_upgrade(path):
        _backup_before_schema_upgrade(path)
    engine = create_engine(
        f"sqlite:///{path}",
        connect_args={"check_same_thread": False, "timeout": 30},
    )

    @event.listens_for(engine, "connect")
    def _sqlite_pragmas(dbapi_connection: sqlite3.Connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=30000")
        cursor.close()

    SQLModel.metadata.create_all(engine)
    with engine.begin() as connection:
        connection.exec_driver_sql(
            "CREATE TABLE IF NOT EXISTS schema_meta "
            "(key TEXT PRIMARY KEY, value TEXT NOT NULL)"
        )
        for table, columns in SCHEMA_ALTERS.items():
            existing = {
                row[1]
                for row in connection.exec_driver_sql(f"PRAGMA table_info({table})")
            }
            for column, definition in columns.items():
                if column not in existing:
                    connection.exec_driver_sql(
                        f"ALTER TABLE {table} ADD COLUMN {column} {definition}"
                    )
        connection.exec_driver_sql(
            "INSERT INTO schema_meta(key, value) VALUES ('version', ?) "
            "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (str(SCHEMA_VERSION),),
        )
    return engine


def _json_value(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def to_row(table: str, record: dict[str, Any]) -> dict[str, Any]:
    fields = MODEL_FIELDS[table]
    values: dict[str, Any] = {}
    extras: dict[str, Any] = {}
    for key, value in record.items():
        column = JSON_FIELDS.get(key, key)
        if column in fields:
            values[column] = _json_value(value) if key in JSON_FIELDS else value
        else:
            extras[key] = value
    values["extra_json"] = _json_value(extras)
    return values


def from_row(row: SQLModel) -> dict[str, Any]:
    values = row.model_dump()
    extras = json.loads(values.pop("extra_json", "{}") or "{}")
    for key, column in JSON_FIELDS.items():
        if column in values:
            raw = values.pop(column)
            values[key] = json.loads(raw or ("[]" if key != "content" else "{}"))
    values.update(extras)
    return values
