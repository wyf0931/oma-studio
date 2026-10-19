"""Export API metadata from temporary resources, without importing app.main or starting Pi."""

import json
import logging
from dataclasses import replace
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Never
from zoneinfo import ZoneInfo

from fastapi import FastAPI

from ..autopilots import AutopilotScheduler
from ..config import get_settings
from ..pi_rpc import PiRuntimeManager
from ..store import Store
from .contracts import error_responses
from .routers import (
    agents,
    autopilots,
    chats,
    identity,
    marketplace,
    resource_catalog,
    shares,
    system,
    system_settings,
    usage,
)


def _schema_only(*_args, **_kwargs) -> Never:
    raise RuntimeError("Schema export must never execute request handlers")


async def _execute(_item: dict) -> None:
    raise RuntimeError("Schema export must never execute an autopilot")


def create_schema() -> dict:
    with TemporaryDirectory(prefix="oma-api-schema-") as directory:
        root = Path(directory)
        settings = replace(
            get_settings(),
            data_dir=root / "data",
            log_dir=root / "logs",
            pi_cwd=root / "workspace",
            pi_session_dir=root / "sessions",
            pi_home=root / "pi",
            pi_agents_home=root / "agents",
            pi_legacy_cwd=None,
        )
        store = Store(root / "data" / "schema.sqlite3")
        try:
            runtime = PiRuntimeManager(settings, store)
            timezone = lambda: ZoneInfo("UTC")
            scheduler = AutopilotScheduler(store, _execute, timezone)
            app = FastAPI(title="Pi Agent Platform", responses=error_responses())
            routers = [
                identity.create_router(settings, store),
                agents.create_router(
                    settings,
                    store,
                    runtime,
                    _schema_only,
                    _schema_only,
                    _schema_only,
                    _schema_only,
                ),
                resource_catalog.create_router(settings),
                marketplace.create_router(
                    settings, _schema_only, _schema_only, logging.getLogger(__name__)
                ),
                system_settings.create_router(settings, store, _schema_only),
                autopilots.create_router(
                    store, scheduler, timezone, _schema_only, _schema_only, _schema_only
                ),
                system.create_router(settings, runtime),
                shares.create_router(
                    settings,
                    store,
                    runtime,
                    _schema_only,
                    _schema_only,
                    _schema_only,
                    chats.visible_messages,
                ),
                chats.create_router(
                    settings,
                    store,
                    runtime,
                    _schema_only,
                    _schema_only,
                    _schema_only,
                    _schema_only,
                ),
                usage.create_router(settings, store),
            ]
            for router in routers:
                app.include_router(router)
            return app.openapi()
        finally:
            store.close()


if __name__ == "__main__":
    print(json.dumps(create_schema(), sort_keys=True, ensure_ascii=False))
