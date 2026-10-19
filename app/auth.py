import hashlib
import hmac
import secrets

from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError
from pwdlib.hashers.argon2 import Argon2Hasher

# OWASP's 19 MiB / two-pass profile keeps memory bounded in the single process.
PASSWORD_HASH = PasswordHash(
    (Argon2Hasher(memory_cost=19456, time_cost=2, parallelism=1),)
)


def hash_password(password: str) -> str:
    return PASSWORD_HASH.hash(password)


def _verify_legacy_scrypt(password: str, encoded: str) -> bool:
    try:
        algorithm, n, r, p, salt, expected = encoded.split("$")
        salt_bytes, expected_bytes = bytes.fromhex(salt), bytes.fromhex(expected)
        # Only the historical format is supported; corrupt records must not
        # select arbitrary memory/CPU costs during authentication.
        if (algorithm, n, r, p) != ("scrypt", "16384", "8", "1"):
            return False
        if len(salt_bytes) != 16 or len(expected_bytes) != 32:
            return False
        actual = hashlib.scrypt(
            password.encode(), salt=salt_bytes, n=16384, r=8, p=1, dklen=32
        )
        return hmac.compare_digest(actual, expected_bytes)
    except (TypeError, ValueError):
        return False


def verify_password(password: str, encoded: str) -> bool:
    if encoded.startswith("scrypt$"):
        return _verify_legacy_scrypt(password, encoded)
    try:
        return PASSWORD_HASH.verify(password, encoded)
    except (UnknownHashError, ValueError):
        return False


def verify_and_update_password(password: str, encoded: str) -> tuple[bool, str | None]:
    if encoded.startswith("scrypt$"):
        valid = _verify_legacy_scrypt(password, encoded)
        return valid, hash_password(password) if valid else None
    try:
        return PASSWORD_HASH.verify_and_update(password, encoded)
    except (UnknownHashError, ValueError):
        return False, None


def new_session_token() -> str:
    return secrets.token_urlsafe(32)


def session_digest(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
