"""Chat-scoped user uploads staged inside Pi's shared workspace."""

import hashlib
import re
from collections.abc import AsyncIterator
from pathlib import Path
from shutil import rmtree
from uuid import uuid4

from fastapi import HTTPException

DEFAULT_MAX_UPLOAD_BYTES = 100 * 1024 * 1024
UPLOADS_DIRNAME = "uploads"
_FILENAME_SAFE = re.compile(r"[^A-Za-z0-9._ -]+")


def upload_directory(workspace: Path, chat_id: str) -> Path:
    root = (workspace.expanduser().resolve() / UPLOADS_DIRNAME).resolve()
    directory = (root / chat_id).resolve()
    try:
        directory.relative_to(root)
    except ValueError as exc:
        raise HTTPException(400, "Invalid chat upload directory") from exc
    return directory


def file_sha256(path: Path) -> str | None:
    digest = hashlib.sha256()
    try:
        with path.open("rb") as source:
            for chunk in iter(lambda: source.read(1024 * 1024), b""):
                digest.update(chunk)
    except OSError:
        return None
    return digest.hexdigest()


def _safe_filename(filename: str | None) -> str:
    candidate = Path(filename or "upload").name.strip()
    candidate = _FILENAME_SAFE.sub("_", candidate).strip(" .")
    return candidate or "upload"


async def save_upload(
    workspace: Path,
    chat_id: str,
    filename: str | None,
    media_type: str | None,
    chunks: AsyncIterator[bytes],
    max_bytes: int = DEFAULT_MAX_UPLOAD_BYTES,
) -> dict:
    directory = upload_directory(workspace, chat_id)
    directory.mkdir(parents=True, exist_ok=True)
    safe_name = _safe_filename(filename)
    destination = directory / safe_name
    if destination.exists():
        destination = (
            directory / f"{destination.stem}-{uuid4().hex[:8]}{destination.suffix}"
        )
    written = 0
    digest = hashlib.sha256()
    try:
        with destination.open("wb") as target:
            async for chunk in chunks:
                written += len(chunk)
                if written > max_bytes:
                    raise HTTPException(413, "Upload exceeds the configured size limit")
                target.write(chunk)
                digest.update(chunk)
    except HTTPException:
        destination.unlink(missing_ok=True)
        raise
    return {
        "id": str(uuid4()),
        "filename": destination.name,
        "path": str(destination.relative_to(workspace.expanduser().resolve())),
        "media_type": media_type or "application/octet-stream",
        "size": written,
        "sha256": digest.hexdigest(),
    }


def delete_chat_uploads(workspace: Path, chat_id: str) -> None:
    directory = upload_directory(workspace, chat_id)
    if directory.is_dir():
        rmtree(directory, ignore_errors=True)
