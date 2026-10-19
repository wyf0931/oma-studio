from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr, field_validator

from ...auth_limits import AuthRateLimits
from ...config import Settings
from ...store import Store
from .. import contracts

SESSION_COOKIE = "oma_session"


class LoginPayload(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: SecretStr = Field(min_length=1, max_length=200)


class UserCreate(BaseModel):
    username: str = Field(min_length=1, max_length=80, pattern=r"^[A-Za-z0-9_.-]+$")
    email: str | None = Field(default=None, max_length=200)


class UserStatusUpdate(BaseModel):
    status: str = Field(pattern=r"^(active|disabled)$")


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nickname: str | None = Field(default=None, max_length=80)
    email: EmailStr | None = Field(default=None, max_length=200)

    @field_validator("nickname", "email", mode="before")
    @classmethod
    def strip_optional_text(cls, value):
        return value.strip() or None if isinstance(value, str) else value


class PasswordChange(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: SecretStr = Field(min_length=1, max_length=200)
    new_password: SecretStr = Field(min_length=15, max_length=200)


def _require_admin(request: Request) -> dict:
    user = request.state.user
    if not user or user.get("role") != "admin":
        raise HTTPException(403, "Admin access required")
    return user


def create_router(settings: Settings, store: Store) -> APIRouter:
    router = APIRouter(prefix="/api", tags=["identity"])
    rate_limits = AuthRateLimits()

    @router.post(
        "/auth/login",
        response_model=contracts.UserResponse,
        response_model_exclude_unset=True,
    )
    async def login(payload: LoginPayload, request: Request, response: Response):
        username = payload.username.strip()
        client = request.client.host if request.client else "unknown"
        rate_limits.begin_login(client, username)
        user = store.authenticate_user(username, payload.password.get_secret_value())
        if not user:
            rate_limits.failed(client)
            raise HTTPException(401, "Invalid username or password")
        rate_limits.login_succeeded(client, username)
        expires_at = datetime.now(UTC) + timedelta(hours=24)
        token = store.create_session(user["id"], expires_at.isoformat())
        response.set_cookie(
            SESSION_COOKIE,
            token,
            httponly=True,
            max_age=24 * 60 * 60,
            samesite="lax",
            secure=request.headers.get("x-forwarded-proto", request.url.scheme)
            == "https",
        )
        return store.public_user(user)

    @router.get(
        "/auth/session",
        response_model=contracts.SessionResponse,
        response_model_exclude_unset=True,
    )
    async def auth_session(request: Request):
        user = request.state.user
        return {"user": store.public_user(user) if user else None}

    @router.post(
        "/auth/logout",
        response_model=contracts.OkResponse,
        response_model_exclude_unset=True,
    )
    async def logout(request: Request, response: Response):
        token = request.cookies.get(SESSION_COOKIE)
        if token:
            store.delete_session(token)
        response.delete_cookie(SESSION_COOKIE)
        return {"ok": True}

    @router.patch(
        "/users/me",
        response_model=contracts.UserResponse,
        response_model_exclude_unset=True,
    )
    async def update_profile(payload: ProfileUpdate, request: Request):
        user = request.state.user
        if not user:
            raise HTTPException(401, "Authentication required")
        updated = store.update_user_profile(
            user["id"], payload.model_dump(exclude_unset=True)
        )
        return store.public_user(updated or user)

    @router.post(
        "/users/me/password",
        response_model=contracts.OkResponse,
        response_model_exclude_unset=True,
    )
    async def change_password(payload: PasswordChange, request: Request):
        user = request.state.user
        token = request.cookies.get(SESSION_COOKIE)
        if not user or not token:
            raise HTTPException(401, "Authentication required")
        current = payload.current_password.get_secret_value()
        new = payload.new_password.get_secret_value()
        client = request.client.host if request.client else "unknown"
        rate_limits.begin_password_change(client, user["id"])
        if not store.change_user_password(user["id"], current, new, token):
            rate_limits.failed(client)
            # A wrong current password must not trigger the client's expired-session flow.
            raise HTTPException(403, "Current password is incorrect")
        rate_limits.password_changed(user["id"])
        return {"ok": True}

    @router.get(
        "/users",
        response_model=contracts.UsersResponse,
        response_model_exclude_unset=True,
    )
    async def list_users(request: Request):
        _require_admin(request)
        return {"users": store.list_users()}

    @router.post(
        "/users",
        status_code=201,
        response_model=contracts.UserResponse,
        response_model_exclude_unset=True,
    )
    async def create_user(payload: UserCreate, request: Request):
        _require_admin(request)
        if not settings.default_user_password:
            raise HTTPException(500, "OMA_DEFAULT_USER_PASSWORD is not configured")
        username = payload.username.strip()
        if store.get_user_by_username(username):
            raise HTTPException(409, "Username already exists")
        user = store.create_user(
            username, payload.email, settings.default_user_password
        )
        return store.public_user(user)

    @router.patch(
        "/users/{user_id}/status",
        response_model=contracts.UserResponse,
        response_model_exclude_unset=True,
    )
    async def update_user_status(
        user_id: str, payload: UserStatusUpdate, request: Request
    ):
        _require_admin(request)
        user = store.get_user(user_id)
        if not user:
            raise HTTPException(404, "User not found")
        if user.get("role") == "admin" and payload.status == "disabled":
            raise HTTPException(400, "The admin account cannot be disabled")
        updated = store.update_user_status(user_id, payload.status)
        return store.public_user(updated or user)

    @router.delete(
        "/users/{user_id}",
        response_model=contracts.OkResponse,
        response_model_exclude_unset=True,
    )
    async def delete_user(user_id: str, request: Request):
        _require_admin(request)
        user = store.get_user(user_id)
        if not user:
            raise HTTPException(404, "User not found")
        if user.get("role") == "admin":
            raise HTTPException(400, "The admin account cannot be deleted")
        store.delete_user(user_id)
        return {"ok": True}

    return router
