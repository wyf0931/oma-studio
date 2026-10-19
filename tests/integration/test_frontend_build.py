import re
from pathlib import Path


def test_built_shell_assets_and_locales_are_served_with_correct_cache_policy(client):
    response = client.get("/chat")
    assert response.status_code == 200
    assert response.headers["Cache-Control"] == "no-cache"
    assert "cdn.jsdelivr.net" not in response.text
    scripts = re.findall(r'<script[^>]+src="(/static/assets/[^"]+\.js)"', response.text)
    assert len(scripts) >= 2  # Targeted polyfills execute before the application.
    assert "polyfills-" in scripts[0]
    assert any("polyfills" not in path for path in scripts)
    for path in scripts:
        asset = client.get(path)
        assert asset.status_code == 200
        assert "javascript" in asset.headers["Content-Type"]
        assert asset.headers["Cache-Control"] == "public, max-age=31536000, immutable"
        conditional = client.get(path, headers={"If-None-Match": asset.headers["ETag"]})
        assert conditional.status_code == 304
        assert "immutable" in conditional.headers["Cache-Control"]
    locale = client.get("/static/locales/en.json")
    assert locale.status_code == 200
    assert locale.headers["Cache-Control"] == "no-cache"
    assert locale.json()["account"]["title"] == "Account"
    image = client.get("/static/assets/default-assistant.jpg")
    assert image.status_code == 200
    assert image.headers["Cache-Control"] == "no-cache"
    assert client.get("/static/assets/does-not-exist.js").status_code == 404


def test_built_share_shell_preserves_social_metadata_markers_and_routes(client):
    shell = Path("dist/index.html").read_text(encoding="utf-8")
    assert "<!-- OMA:OG:START -->" in shell
    assert "<!-- OMA:OG:END -->" in shell
    response = client.get("/share/unknown-public-token")
    assert response.status_code == 200
    assert (
        'property="og:url" content="http://testserver/share/unknown-public-token"'
        in response.text
    )
    assert "/static/assets/" in response.text
    assert "cdn.jsdelivr.net" not in response.text
