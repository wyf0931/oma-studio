from app.auth import hash_password, session_digest, verify_password


def test_password_hash_is_salted_and_verifiable():
    first = hash_password("secret")
    second = hash_password("secret")

    assert first != second
    assert verify_password("secret", first)
    assert not verify_password("wrong", first)
    assert session_digest("token") != "token"


def test_argon2id_profile_and_legacy_scrypt_upgrade():
    import hashlib

    from app.auth import verify_and_update_password

    password = "a legacy user password"
    salt = bytes(range(16))
    digest = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1, dklen=32)
    legacy = f"scrypt$16384$8$1${salt.hex()}${digest.hex()}"
    assert verify_password(password, legacy)
    assert verify_and_update_password("wrong", legacy) == (False, None)
    valid, upgraded = verify_and_update_password(password, legacy)
    assert valid and upgraded is not None
    assert upgraded.startswith("$argon2id$v=19$m=19456,t=2,p=1$")
    assert verify_password(password, upgraded)
    assert verify_and_update_password(password, upgraded) == (True, None)
    assert not verify_password(password, legacy.replace("16384", "1073741824"))


def test_argon2_parameters_upgrade_on_success():
    from pwdlib import PasswordHash
    from pwdlib.hashers.argon2 import Argon2Hasher

    from app.auth import verify_and_update_password

    weak = PasswordHash(
        (Argon2Hasher(memory_cost=1024, time_cost=1, parallelism=1),)
    ).hash("old password")
    valid, upgraded = verify_and_update_password("old password", weak)
    assert valid and upgraded is not None
    assert "m=19456,t=2,p=1" in upgraded
    assert verify_and_update_password("wrong", weak) == (False, None)


def test_malformed_hashes_fail_closed():
    for encoded in (
        "",
        "plaintext",
        "scrypt$bad",
        "$argon2id$invalid",
        "scrypt$16384$8$1$$",
    ):
        assert not verify_password("password", encoded)
