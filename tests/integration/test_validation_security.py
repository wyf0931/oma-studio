import pytest


@pytest.mark.parametrize(
    "path,payload",
    [
        (
            "/api/auth/login",
            {"username": "admin", "password": "AUDIT_SECRET_" + "x" * 201},
        ),
        (
            "/api/users/me/password",
            {
                "current_password": "AUDIT_SECRET_CURRENT",
                "new_password": "AUDIT_SECRET",
            },
        ),
        (
            "/api/users/me/password",
            {
                "current_password": {"nested": "AUDIT_SECRET_CURRENT"},
                "new_password": "AUDIT_SECRET",
            },
        ),
        (
            "/api/users/me/password",
            {
                "current_password": "AUDIT_SECRET_CURRENT",
                "new_password": "AUDIT_SECRET_" + "x" * 201,
            },
        ),
    ],
)
def test_validation_responses_never_include_password_inputs(client, path, payload):
    response = client.post(path, json=payload)
    assert response.status_code == 422
    assert "AUDIT_SECRET" not in response.text
    assert response.json()["code"] == "request.invalid"
    assert response.headers["X-Request-ID"]
    for error in response.json()["detail"]:
        assert error["loc"] and error["type"] and error["msg"]
        assert "input" not in error and "ctx" not in error
