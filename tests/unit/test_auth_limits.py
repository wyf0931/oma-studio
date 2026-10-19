import pytest
from fastapi import HTTPException

from app.auth_limits import AuthRateLimits


def test_login_budget_expires_without_permanent_lockout(monkeypatch):
    clock = [1000.0]
    monkeypatch.setattr("time.time", lambda: clock[0])
    limits = AuthRateLimits()
    for _ in range(5):
        limits.begin_login("client", "user")
        limits.failed("client")
    with pytest.raises(HTTPException) as blocked:
        limits.begin_login("client", "user")
    assert blocked.value.status_code == 429
    assert blocked.value.headers == {"Retry-After": "300"}
    limits.begin_login("another-client", "other-user")
    clock[0] += 301
    limits.begin_login("client", "user")


def test_success_clears_account_attempts():
    limits = AuthRateLimits()
    for _ in range(15):
        limits.begin_login("client", "user")
        limits.login_succeeded("client", "user")
    for _ in range(5):
        limits.begin_password_change("client", "user-id")
    with pytest.raises(HTTPException):
        limits.begin_password_change("another-client", "user-id")
    limits.password_changed("user-id")
    limits.begin_password_change("client", "user-id")


def test_distributed_account_and_client_failure_limits():
    limits = AuthRateLimits()
    for index in range(20):
        limits.begin_login(f"client-{index}", "target")
    with pytest.raises(HTTPException):
        limits.begin_login("new-client", "target")
    for index in range(30):
        limits.begin_login("attacker", f"user-{index}")
        limits.failed("attacker")
    with pytest.raises(HTTPException):
        limits.begin_login("attacker", "new-user")
