from datetime import UTC, datetime, timedelta

import pytest
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from app.api.routers.identity import create_router
from app.auth import verify_password
from app.config import get_settings
from app.errors import error_payload
from app.store import Store


@pytest.fixture
def identity(tmp_path):
    store = Store(tmp_path / "identity.sqlite3")
    app = FastAPI()

    @app.middleware("http")
    async def identify(request, call_next):
        token = request.cookies.get("oma_session")
        request.state.user = store.get_session_user(token) if token else None
        return await call_next(request)

    @app.exception_handler(HTTPException)
    async def errors(request: Request, exc: HTTPException):
        return JSONResponse(
            error_payload(exc.detail, exc.status_code), status_code=exc.status_code
        )

    app.include_router(create_router(get_settings(), store))
    user = store.create_user("member", None, "original password")
    expires = (datetime.now(UTC) + timedelta(hours=1)).isoformat()
    token = store.create_session(user["id"], expires)
    with TestClient(app) as client:
        client.cookies.set("oma_session", token)
        yield client, store, user, token, expires
    store.close()


def test_profile_updates_are_partial_private_and_persistent(identity):
    client, store, user, _, _ = identity
    other = store.create_user("other", "other@example.com", "other password")
    original_hash = store.get_user(user["id"])["password_hash"]
    response = client.patch(
        "/api/users/me",
        json={"nickname": "  小明  ", "email": "  member@example.com  "},
    )
    assert response.status_code == 200
    assert response.json()["nickname"] == "小明"
    assert response.json()["email"] == "member@example.com"
    assert response.json()["username"] == "member"
    assert "password_hash" not in response.json()
    assert client.get("/api/auth/session").json()["user"]["nickname"] == "小明"
    response = client.patch("/api/users/me", json={"email": ""})
    assert response.json()["email"] is None
    assert response.json()["nickname"] == "小明"
    assert (
        client.patch("/api/users/me", json={"nickname": "   "}).json()["nickname"]
        is None
    )
    assert store.get_user(user["id"])["password_hash"] == original_hash
    assert store.get_user(other["id"])["email"] == "other@example.com"
    reopened = Store(store.sqlite_path)
    try:
        persisted = reopened.get_user(user["id"])
        assert persisted is not None
        assert persisted["nickname"] is None
    finally:
        reopened.close()


@pytest.mark.parametrize(
    "payload",
    [
        {"nickname": "x" * 81},
        {"email": "not-email"},
        {"email": "x" * 201},
        {"role": "admin"},
        {"username": "changed"},
        {"id": "other"},
        {"password_hash": "plaintext"},
        {"nickname": 123},
    ],
)
def test_profile_rejects_invalid_or_privileged_fields(identity, payload):
    client, store, user, _, _ = identity
    assert client.patch("/api/users/me", json=payload).status_code == 422
    unchanged = store.get_user(user["id"])
    assert unchanged["username"] == "member"
    assert unchanged["role"] == "normal"
    assert unchanged["email"] is None


def test_password_change_verifies_current_password_and_preserves_other_users(identity):
    client, store, user, token, expires = identity
    other_session = store.create_session(user["id"], expires)
    other_user = store.create_user("other", None, "another password")
    other_user_session = store.create_session(other_user["id"], expires)
    original_hash = store.get_user(user["id"])["password_hash"]
    payload = {"current_password": "incorrect", "new_password": "a brand new password"}
    response = client.post("/api/users/me/password", json=payload)
    assert response.status_code == 403
    assert response.json()["code"] == "account.currentPasswordIncorrect"
    assert store.get_user(user["id"])["password_hash"] == original_hash
    assert store.get_session_user(other_session)
    assert client.get("/api/auth/session").json()["user"]["id"] == user["id"]

    payload["current_password"] = "original password"
    response = client.post("/api/users/me/password", json=payload)
    assert response.status_code == 200
    assert response.json() == {"ok": True}
    assert client.cookies.get("oma_session") == token
    assert store.get_session_user(token)
    assert not store.get_session_user(other_session)
    assert store.get_session_user(other_user_session)
    saved = store.get_user(user["id"])
    assert verify_password(payload["new_password"], saved["password_hash"])
    assert not verify_password("original password", saved["password_hash"])
    assert (
        client.post(
            "/api/auth/login",
            json={"username": "member", "password": "original password"},
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/api/auth/login",
            json={"username": "member", "password": payload["new_password"]},
        ).status_code
        == 200
    )


@pytest.mark.parametrize("password", ["short", "x" * 201])
def test_password_policy_is_validated_before_any_change(identity, password):
    client, store, user, _, _ = identity
    response = client.post(
        "/api/users/me/password",
        json={"current_password": "original password", "new_password": password},
    )
    assert response.status_code == 422
    assert verify_password(
        "original password", store.get_user(user["id"])["password_hash"]
    )


def test_password_preserves_unicode_and_whitespace(identity):
    client, store, user, _, _ = identity
    password = "  中文密码支持空格和各种字符🙂🙂  "
    assert (
        client.post(
            "/api/users/me/password",
            json={"current_password": "original password", "new_password": password},
        ).status_code
        == 200
    )
    assert verify_password(password, store.get_user(user["id"])["password_hash"])


def test_admin_can_change_own_password(identity):
    client, store, _, _, _ = identity
    admin = store.ensure_default_user("original admin password")
    login = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "original admin password"},
    )
    assert login.status_code == 200
    response = client.post(
        "/api/users/me/password",
        json={
            "current_password": "original admin password",
            "new_password": "new admin password",
        },
    )
    assert response.status_code == 200
    assert verify_password(
        "new admin password", store.get_user(admin["id"])["password_hash"]
    )


def test_account_mutations_require_login(identity):
    client, _, _, _, _ = identity
    client.cookies.clear()
    assert client.patch("/api/users/me", json={"nickname": "test"}).status_code == 401
    assert (
        client.post(
            "/api/users/me/password",
            json={
                "current_password": "password",
                "new_password": "a brand new password",
            },
        ).status_code
        == 401
    )
