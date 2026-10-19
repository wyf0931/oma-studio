"""Serve the single Vite build through FastAPI; no runtime Node server required."""

import json
from pathlib import Path

from fastapi.staticfiles import StaticFiles


class FrontendFiles(StaticFiles):
    def __init__(self, directory: Path):
        super().__init__(directory=directory)
        self.manifest_path = directory / ".vite" / "manifest.json"
        self.manifest_mtime = None
        self._load_manifest()

    def _load_manifest(self):
        modified = self.manifest_path.stat().st_mtime_ns
        if modified == self.manifest_mtime:
            return
        manifest = json.loads(self.manifest_path.read_text())
        self.immutable_paths = set()
        for entry in manifest.values():
            self.immutable_paths.add(entry["file"])
            self.immutable_paths.update(entry.get("css", []))
            self.immutable_paths.update(entry.get("assets", []))
        self.manifest_mtime = modified

    async def get_response(self, path: str, scope):
        self._load_manifest()
        response = await super().get_response(path, scope)
        response.headers["Cache-Control"] = (
            "public, max-age=31536000, immutable"
            if path in self.immutable_paths and response.status_code in {200, 304}
            else "no-cache"
        )
        return response


def frontend_directory() -> Path:
    directory = Path(__file__).parent.parent / "dist"
    if not all(
        (directory / name).is_file() for name in ("index.html", ".vite/manifest.json")
    ):
        raise RuntimeError(
            "Frontend build missing. Run npm ci && npm run build before starting OMA Studio."
        )
    return directory
