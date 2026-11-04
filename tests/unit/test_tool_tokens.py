import pytest

from app.tool_tokens import (
    AGENT_READ,
    AGENT_WRITE,
    WRITE_SCOPES,
    ToolTokenError,
    issue_tool_token,
    verify_tool_token,
)

SECRET = "unit-test-secret"


def test_roundtrip_returns_claims():
    token = issue_tool_token(
        SECRET, chat_id="chat-1", user_id="admin-1", scopes=WRITE_SCOPES
    )

    claims = verify_tool_token(SECRET, token, required_scope=AGENT_WRITE)

    assert claims["user_id"] == "admin-1"
    assert claims["chat_id"] == "chat-1"
    assert set(claims["scopes"]) == set(WRITE_SCOPES)


def test_missing_scope_is_rejected():
    token = issue_tool_token(
        SECRET, chat_id="chat-1", user_id="admin-1", scopes=[AGENT_READ]
    )

    with pytest.raises(ToolTokenError, match="scope"):
        verify_tool_token(SECRET, token, required_scope=AGENT_WRITE)


def test_expired_token_is_rejected():
    token = issue_tool_token(
        SECRET,
        chat_id="chat-1",
        user_id="admin-1",
        scopes=[AGENT_READ],
        ttl_seconds=10,
        now=1_000,
    )

    with pytest.raises(ToolTokenError, match="Expired"):
        verify_tool_token(SECRET, token, required_scope=AGENT_READ, now=2_000)


def test_tampered_token_is_rejected():
    token = issue_tool_token(
        SECRET, chat_id="chat-1", user_id="admin-1", scopes=[AGENT_READ]
    )
    payload, signature = token.split(".", 1)
    forged = payload[:-2] + ("AA" if payload[-2:] != "AA" else "BB") + "." + signature

    with pytest.raises(ToolTokenError):
        verify_tool_token(SECRET, forged, required_scope=AGENT_READ)


def test_missing_and_malformed_tokens_are_rejected():
    with pytest.raises(ToolTokenError, match="Missing"):
        verify_tool_token(SECRET, None, required_scope=AGENT_READ)
    with pytest.raises(ToolTokenError, match="Malformed"):
        verify_tool_token(SECRET, "not-a-token", required_scope=AGENT_READ)
