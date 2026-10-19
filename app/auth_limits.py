"""Expiring authentication limits for the single-process MVP (no shared backend)."""

import math
import time

from fastapi import HTTPException
from limits import RateLimitItemPerMinute
from limits.storage import MemoryStorage
from limits.strategies import FixedWindowRateLimiter

from .auth import session_digest


class AuthRateLimits:
    def __init__(self):
        self.storage = MemoryStorage()
        self.limiter = FixedWindowRateLimiter(self.storage)
        self.client_failures = RateLimitItemPerMinute(30, 5)
        self.login_pair = RateLimitItemPerMinute(5, 5)
        self.login_account = RateLimitItemPerMinute(20, 5)
        self.password_user = RateLimitItemPerMinute(5, 5)

    def _check(self, limit: RateLimitItemPerMinute, key: str, *, consume: bool):
        allowed = (
            self.limiter.hit(limit, key) if consume else self.limiter.test(limit, key)
        )
        if not allowed:
            reset, _ = self.limiter.get_window_stats(limit, key)
            seconds = max(1, math.ceil(reset - time.time()))
            raise HTTPException(
                429,
                f"Too many attempts. Try again in {seconds} seconds.",
                headers={"Retry-After": str(seconds)},
            )

    def begin_login(self, client: str, username: str):
        self._check(self.client_failures, f"client:{client}", consume=False)
        account = session_digest(username)
        self._check(self.login_pair, f"login:{client}:{account}", consume=True)
        self._check(self.login_account, f"account:{account}", consume=True)

    def login_succeeded(self, client: str, username: str):
        account = session_digest(username)
        self.storage.clear(self.login_pair.key_for(f"login:{client}:{account}"))
        self.storage.clear(self.login_account.key_for(f"account:{account}"))

    def begin_password_change(self, client: str, user_id: str):
        self._check(self.client_failures, f"client:{client}", consume=False)
        self._check(self.password_user, f"password:{user_id}", consume=True)

    def password_changed(self, user_id: str):
        self.storage.clear(self.password_user.key_for(f"password:{user_id}"))

    def failed(self, client: str):
        self.limiter.hit(self.client_failures, f"client:{client}")
