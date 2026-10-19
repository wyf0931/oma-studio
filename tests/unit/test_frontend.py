import json

import pytest

from app import frontend


def test_missing_or_incomplete_build_has_actionable_setup_error(tmp_path, monkeypatch):
    monkeypatch.setattr(frontend, "__file__", str(tmp_path / "app" / "frontend.py"))
    with pytest.raises(RuntimeError, match="npm ci && npm run build"):
        frontend.frontend_directory()
    directory = tmp_path / "dist"
    directory.mkdir()
    (directory / "index.html").write_text("<html></html>")
    with pytest.raises(RuntimeError, match="Frontend build missing"):
        frontend.frontend_directory()
    (directory / ".vite").mkdir()
    (directory / ".vite" / "manifest.json").write_text("{}")
    assert frontend.frontend_directory() == directory


def test_manifest_refreshes_for_watch_rebuild_without_caching_public_images(tmp_path):
    (tmp_path / ".vite").mkdir()
    manifest = tmp_path / ".vite" / "manifest.json"
    manifest.write_text(
        json.dumps(
            {
                "entry": {
                    "file": "assets/app-first123.js",
                    "css": ["assets/app-first123.css"],
                }
            }
        )
    )
    files = frontend.FrontendFiles(tmp_path)
    assert "assets/app-first123.js" in files.immutable_paths
    assert "assets/default-assistant.jpg" not in files.immutable_paths
    manifest.write_text(
        json.dumps(
            {
                "entry": {
                    "file": "assets/app-second456.js",
                    "css": ["assets/app-second456.css"],
                }
            }
        )
    )
    files._load_manifest()
    assert "assets/app-second456.js" in files.immutable_paths
    assert "assets/app-first123.js" not in files.immutable_paths
