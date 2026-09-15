from app.errors import classify_error, error_payload


def test_error_codes_are_stable_and_keep_legacy_detail():
    assert classify_error("Authentication required", 401) == (
        "auth.required",
        {},
        "Authentication required",
    )
    assert error_payload("Skill archify is already installed", 409) == {
        "detail": "Skill archify is already installed",
        "code": "market.skillExists",
        "params": {"skill": "archify"},
    }


def test_unknown_errors_use_status_family_fallback_codes():
    assert classify_error("invalid input", 422)[0] == "request.invalid"
    assert classify_error("upstream failed", 503)[0] == "server.error"
