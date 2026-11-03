"""Short-lived capability tokens for platform tools that call the platform API.

Pi tools run in a child process. They cannot use the browser session cookie, and
minting a long-lived user session for every chat would hand the child far more
authority than one turn needs. A tool token is scoped, expires quickly, and is
only ever injected into an admin chat.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from collections.abc import Iterable

TOOL_TOKEN_HEADER = "X-OMA-Tool-Token"
DEFAULT_TTL_SECONDS = 900
AGENT_READ = "agent:read"
AGENT_WRITE = "agent:write"
SKILL_READ = "skill:read"
SKILL_WRITE = "skill:write"
READ_SCOPES = (AGENT_READ, SKILL_READ)
WRITE_SCOPES = READ_SCOPES + (AGENT_WRITE, SKILL_WRITE)


class ToolTokenError(ValueError):
    """Raised when a tool token is malformed, expired, or out of scope."""


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64decode(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def _signature(secret: str, payload: str) -> str:
    digest = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest()
    return _b64encode(digest)


def issue_tool_token(
    secret: str,
    *,
    chat_id: str,
    user_id: str,
    scopes: Iterable[str],
    ttl_seconds: int = DEFAULT_TTL_SECONDS,
    now: float | None = None,
) -> str:
    raw_now = time.time() if now is None else now
    try:
        issued = int(raw_now)
    except (TypeError, ValueError) as exc:
        raise ToolTokenError("Invalid issue time") from exc
    payload = json.dumps(
        {
            "chat_id": chat_id,
            "user_id": user_id,
            "scopes": sorted(set(scopes)),
            "issued_at": issued,
            "expires_at": issued + max(1, ttl_seconds),
        },
        separators=(",", ":"),
        sort_keys=True,
    )
    encoded = _b64encode(payload.encode())
    return f"{encoded}.{_signature(secret, encoded)}"


def verify_tool_token(
    secret: str,
    token: str | None,
    *,
    required_scope: str,
    now: float | None = None,
) -> dict:
    if not token:
        raise ToolTokenError("Missing tool token")
    try:
        encoded, signature = token.split(".", 1)
    except ValueError as exc:
        raise ToolTokenError("Malformed tool token") from exc
    if not hmac.compare_digest(signature, _signature(secret, encoded)):
        raise ToolTokenError("Invalid tool token signature")
    try:
        payload = json.loads(_b64decode(encoded))
    except (ValueError, json.JSONDecodeError) as exc:
        raise ToolTokenError("Malformed tool token payload") from exc
    if not isinstance(payload, dict):
        raise ToolTokenError("Malformed tool token payload")
    current = time.time() if now is None else now
    try:
        expires_at = int(payload["expires_at"])
        user_id = str(payload["user_id"])
        scopes = list(payload.get("scopes") or [])
    except (KeyError, TypeError, ValueError) as exc:
        raise ToolTokenError("Incomplete tool token") from exc
    if current > expires_at:
        raise ToolTokenError("Expired tool token")
    if required_scope not in scopes:
        raise ToolTokenError("Tool token lacks the required scope")
    return {
        "user_id": user_id,
        "chat_id": payload.get("chat_id"),
        "scopes": scopes,
        "expires_at": expires_at,
    }
